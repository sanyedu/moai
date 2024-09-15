import WebSocket from 'ws'
import { WsClient } from '@/WsClient'

export class TaskWsClient extends WsClient {
    constructor(ws: WebSocket, url: string) {
        super(ws, url)
    }
}
