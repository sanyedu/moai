interface DataMsg {
    type: string
    name: string
    id: string
    data: string
}

const KEEP_ALIVE_INTERVAL = 1000

export class WebSocketClient {
    ws: WebSocket
    className: string
    isTeacher: boolean
    studentId?: string

    constructor(className: string, isTeacher: boolean, studentId?: string) {
        // Create WebSocket connection
        // const endpoint = process.env.NEXT_PUBLIC_WS_ENDPOINT! + "/" + params.name;
        this.studentId = studentId
        this.className = className
        this.isTeacher = isTeacher

        const endpoint = `${process.env.NEXT_PUBLIC_WS_ENDPOINT}/course/${className}${isTeacher ? '/teacher' : ''}`
        console.log(`conncet to ws server: ${endpoint}`)
        this.ws = new WebSocket(endpoint)
    }

    disconnect() {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.close()
            console.log('disconnect')
        }
    }

    clearStudentSnapshot() {
        try {
            this.ws.send(
                JSON.stringify({
                    type: 'CLEAR_SNAPSHOT',
                })
            )
            console.log(`clear snapshots command is sent`)
        } catch (err) {
            console.error('send clear snapshots command failed.', err)
        }
    }
    broadcastImage(image: string) {
        try {
            this.ws.send(
                JSON.stringify({
                    type: 'BROADCAST_IMAGE',
                    name: this.className,
                    id: this.studentId,
                    data: image,
                })
            )
            console.log(`broadcast image is sent`)
        } catch (err) {
            console.error('Send broadcast image failed.', err)
        }
    }

    broadcastText(text: string) {
        try {
            this.ws.send(
                JSON.stringify({
                    type: 'BROADCAST_TEXT',
                    name: this.className,
                    id: this.studentId,
                    data: text,
                })
            )
            console.log(`broadcast text is sent`)
        } catch (err) {
            console.error('Send broadcast text failed', err)
        }
    }
}
