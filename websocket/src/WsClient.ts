import WebSocket from 'ws'

const KEEP_ALIVE_INTERVAL = 30000

export class WsClient {
    ws: WebSocket
    url: string

    isAlive: boolean = true
    keepAliveTimer: any

    constructor(ws: WebSocket, url: string) {
        this.ws = ws
        this.url = url

        this.keepAliveTimer = setInterval(this.sendPing.bind(this), KEEP_ALIVE_INTERVAL)
        // console.log('Keepalilve timer started.')
        //  ws.on('open') this event is not triggered on server-side
        ws.on('pong', this.onPongReceived.bind(this))
        ws.on('close', this.onClose.bind(this))
        ws.on('error', (error: Error) => {
            console.log('error: ', error)
            ws.terminate()
        })
    }
    protected onClose() {
        clearInterval(this.keepAliveTimer)
        console.log(`client is disconnected on url, keepalive stopped: ${this.url}.`)
    }
    private onPongReceived() {
        // console.log('pong received')
        this.isAlive = true
    }

    protected send(message: string) {
        this.ws.send(message)
    }

    private sendPing() {
        if (this.isAlive === false) {
            this.ws.terminate()
            console.log('terminate inactive client')
            return
        }
        this.isAlive = false
        this.ws.ping()
        // console.log('send ping')
    }
}
