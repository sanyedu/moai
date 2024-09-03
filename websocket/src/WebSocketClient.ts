import WebSocket from 'ws'

export interface DataMsg {
    type: string
    name: string
    id: string
    data: string
}

const KEEP_ALIVE_INTERVAL = 30000

export class WebSocketClient {
    clients: WebSocketClient[]
    snapshots: DataMsg[]
    ws: WebSocket
    isAlive: boolean = false
    url: string
    interval: any
    className: string
    isTeacher: boolean

    constructor(clients: WebSocketClient[], snapshots: DataMsg[], ws: WebSocket, url: string) {
        this.clients = clients
        this.snapshots = snapshots

        this.ws = ws
        this.url = url
        this.isTeacher = url.endsWith('/teacher')
        if (this.isTeacher) this.className = url.substring(4, url.lastIndexOf('/'))
        else this.className = url.substring(4)
        this.isAlive = true

        //  ws.on('open') this event is not triggered on server-side
        ws.on('message', this.onMessage.bind(this))
        ws.on('pong', this.onPongReceived.bind(this))

        console.log(
            `client connection is open on url: ${this.url}, className: ${this.className}, isTeacher: ${this.isTeacher}.`
        )

        if (this.isTeacher) {
            let i = 0
            this.snapshots
                .filter((data) => data.name === this.className)
                .forEach((data) => {
                    this.send(JSON.stringify(data))
                    i++
                })
            console.log(`send student snapshots to teacher. snapshots: ${i}`)
        }

        this.interval = setInterval(this.sendPing.bind(this), KEEP_ALIVE_INTERVAL)
        console.log('Keepalilve timer started.')
    }

    send(message: string) {
        this.ws.send(message)
    }
    sendPing() {
        if (this.isAlive === false) {
            this.ws.terminate()
            console.log('terminate inactive client')
            return
        }
        this.isAlive = false
        this.ws.ping()
        // console.log('send ping')
    }
    onPongReceived() {
        // console.log('pong received')
        this.isAlive = true
    }
    onMessage(message: string) {
        console.log(`message is received with url ${this.url}`)
        const data: DataMsg = JSON.parse(message)
        if (data.type === 'CLEAR_SNAPSHOT') {
            const s = this.snapshots.length
            this.snapshots.splice(0, s)
            console.log(`student snapshots are cleard. count: ${s}`)
        } else {
            const messageToBroadcast = JSON.stringify(data)
            try {
                let i = 0
                if (this.isTeacher) {
                    this.getStudents().forEach((client) => {
                        client.send(messageToBroadcast)
                        i++
                    })
                } else {
                    this.saveStudentSnapshot(data)
                    this.getTeachers().forEach((client) => {
                        client.send(messageToBroadcast)
                        i++
                    })
                }
                console.log(`message is forwarded to ${i} clients.`)
                // const data: DataMsg = JSON.parse(message)
            } catch (error) {
                console.error('Failed to parse incoming message:', error)
            }
        }
    }
    onDestroyed() {
        clearInterval(this.interval)
        console.log(`client is disconnected on url, keepalive stopped: ${this.url}.`)
    }

    saveStudentSnapshot(data: DataMsg) {
        let found = false
        let i = 0
        for (i = 0; i < this.snapshots.length; i++) {
            if (this.snapshots[i].id === data.id) {
                found = true
                break
            }
        }
        if (found) {
            this.snapshots[i] = data
        } else {
            this.snapshots.push(data)
        }
        console.log(`student message snapshot is saved. name: ${data.name}, id:${data.id}`)
    }
    getStudents(): WebSocketClient[] {
        return this.clients.filter((client) => client.className === this.className && !client.isTeacher)
    }
    getTeachers(): WebSocketClient[] {
        return this.clients.filter((client) => client.className === this.className && client.isTeacher)
    }
}
