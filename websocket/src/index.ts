import WebSocket, { WebSocketServer } from 'ws'
import dotenv from 'dotenv'
import { WsClient } from './WsClient'
import { CourseWsClient } from './clients/CourseWsClient'
import { TaskWsClient } from './clients/TaskWsClient'
dotenv.config()

// Create a WebSocket server on port
const port = parseInt(process.env.SERVER_PORT!)
const wss = new WebSocketServer({ port: port })

function createWsClient(ws: WebSocket, url: string | undefined): WsClient | null {
    if (!url) return null

    if (url.startsWith('/ws/course/')) {
        return new CourseWsClient(ws, url)
    } else if (url.startsWith('/ws/task/')) {
        return new TaskWsClient(ws, url)
    } else return null
}

wss.on('connection', (ws: WebSocket, req) => {
    const client = createWsClient(ws, req.url)
    if (!client) {
        console.log(`error: invalid request url: ${req.url}`)
        ws.terminate()
        return
    }
})

console.log('WebSocket server is running on ws://localhost:' + port)
