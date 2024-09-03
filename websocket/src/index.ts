import WebSocket, { WebSocketServer } from 'ws'
import dotenv from 'dotenv'
import { WebSocketClient, DataMsg } from './WebSocketClient'
dotenv.config()

// Create a WebSocket server on port
const port = parseInt(process.env.SERVER_PORT!)
const wss = new WebSocketServer({ port: port })

//all clients: both students and teachers
const allClients: WebSocketClient[] = []

const allStudentSnapshots: DataMsg[] = []
wss.on('connection', (ws: WebSocket, req) => {
    const client = new WebSocketClient(allClients, allStudentSnapshots, ws, req.url!)
    allClients.push(client)

    console.log(
        `client connection is open on url: ${client.url}, className: ${client.className}, isTeacher: ${client.isTeacher}.`
    )
    ws.on('close', () => {
        const index = allClients.findIndex((client) => client.ws === ws)
        allClients[index].onDestroyed()
        allClients.splice(index, 1)
    })
    ws.on('error', (error: Error) => {
        console.log('error: ', error)
        ws.terminate()
    })

    console.log(`total clients: ${allClients.length}`)
})

wss.on('close', function close() {
    allClients.forEach((client) => {
        client.onDestroyed()
    })
})

console.log('WebSocket server is running on ws://localhost:' + port)
