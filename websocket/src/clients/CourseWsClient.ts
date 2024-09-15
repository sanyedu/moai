import WebSocket from 'ws'
import { WsClient } from '@/WsClient'

export interface DataMsg {
    type: string
    name: string
    id: string
    data: string
}

interface StrDictionary<T> {
    [key: string]: T
}

export class CourseWsClient extends WsClient {
    private static courseStudentSnapshots: StrDictionary<StrDictionary<DataMsg>> = {}
    private static studentClients: CourseWsClient[] = []
    private static teacherClients: CourseWsClient[] = []

    courseName: string
    isTeacher: boolean

    constructor(ws: WebSocket, url: string) {
        super(ws, url)

        this.isTeacher = url.endsWith('/teacher')
        if (this.isTeacher) {
            this.courseName = url.substring(4, url.lastIndexOf('/'))
            CourseWsClient.teacherClients.push(this)

            let i = 0
            const studentSnapshots = this.getStudentSnapshots()
            for (let id in studentSnapshots) {
                let data = studentSnapshots[id]
                this.send(JSON.stringify(data))
                i++
            }
            console.log(`teacher is connected. send student snapshots to teacher. snapshots: ${i}`)
            ws.on('message', this.onTeacherMessage.bind(this))
        } else {
            this.courseName = url.substring(4)
            CourseWsClient.studentClients.push(this)
            console.log(`student is connected.`)
            ws.on('message', this.onStudentMessage.bind(this))
        }
    }

    protected onClose(): void {
        console.log(`course ws client is closed. ${this.courseName}, ${this.isTeacher}`)
        if (this.isTeacher) {
            const index = CourseWsClient.teacherClients.findIndex((client) => client.ws === this.ws)
            CourseWsClient.teacherClients.splice(index, 1)
        } else {
            const index = CourseWsClient.studentClients.findIndex((client) => client.ws === this.ws)
            CourseWsClient.studentClients.splice(index, 1)
        }
        super.onClose()
    }

    private getStudentSnapshots(): StrDictionary<DataMsg> {
        if (this.courseName in CourseWsClient.courseStudentSnapshots) {
            return CourseWsClient.courseStudentSnapshots[this.courseName]
        } else {
            CourseWsClient.courseStudentSnapshots[this.courseName] = {}
            return {}
        }
    }

    private saveStudentSnapshots(data: DataMsg) {
        const studentSnapshots = this.getStudentSnapshots()
        studentSnapshots[data.id] = data
        CourseWsClient.courseStudentSnapshots[this.courseName] = studentSnapshots
    }

    private onTeacherMessage(message: string) {
        console.log(`teacher message is received in course: ${this.courseName}`)
        const data: DataMsg = JSON.parse(message)
        const messageToBroadcast = JSON.stringify(data)

        if (data.type === 'CLEAR_SNAPSHOT') {
            CourseWsClient.courseStudentSnapshots[this.courseName] = {}
            console.log(`student snapshots are cleard for course: ${this.courseName}`)
        } else {
            try {
                let i = 0
                CourseWsClient.studentClients.forEach((client) => {
                    client.send(messageToBroadcast)
                    i++
                })
                console.log(`message is forwarded to ${i} students.`)
                // const data: DataMsg = JSON.parse(message)
            } catch (error) {
                console.error('Failed to parse incoming message:', error)
            }
        }
    }

    private onStudentMessage(message: string) {
        console.log(`student message is received in course: ${this.courseName}`)
        const data: DataMsg = JSON.parse(message)
        const messageToBroadcast = JSON.stringify(data)
        this.saveStudentSnapshots(data)

        let i = 0
        CourseWsClient.teacherClients.forEach((client) => {
            client.send(messageToBroadcast)
            i++
        })
        console.log(`message is forwarded to ${i} teachers.`)
    }
}
