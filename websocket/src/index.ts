import WebSocket, { WebSocketServer } from 'ws'

interface ImageDataMessage {
  name: string
  id: string
  imageData: string
}

// Create a WebSocket server on port 8080
const wssTeacher = new WebSocketServer({ port: 8080 })

wssTeacher.on('connection', (ws: WebSocket, req) => {
  console.log(`teacher connected on url: ${req.url}. total teachers: ${wssTeacher.clients.size}`)

  ws.on('close', () => {
    console.log('teacher client disconnected.')
  })

  ws.on('error', (error: Error) => {
    console.log('Teacher WebSocket error: ', error)
  })
})

console.log('Teacher WebSocket server is running on ws://localhost:8080')

const wssStudent = new WebSocketServer({ port: 8081 })

wssStudent.on('connection', (ws: WebSocket, req) => {
  console.log(`student connected on url: ${req.url}. total students: ${wssStudent.clients.size}`)
  ws.on('message', (message: string) => {
    try {
      const data: ImageDataMessage = JSON.parse(message)
      const messageToBroadcast = JSON.stringify(data)

      wssTeacher.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageToBroadcast)
        }
      })
      console.log(`messages are sent to teacher. id: ${data.id}, name: ${data.name}`)
    } catch (error) {
      console.error('Failed to parse incoming message:', error)
    }
  })

  ws.on('close', () => {
    console.log('Student client disconnected.')
  })

  ws.on('error', (error: Error) => {
    console.log('Student WebSocket error: ', error)
  })
})

console.log('Student WebSocket server is running on ws://localhost:8081')
