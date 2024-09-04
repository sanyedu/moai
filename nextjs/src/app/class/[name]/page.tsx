'use client'

import React from 'react'
import { Button, Image, Card, Flex, Typography, Space, Input, Alert, Spin } from 'antd'
const { Title, Text } = Typography
import { useEffect, useState, useRef } from 'react'
import { WebSocketClient } from './WebSocketClient'
const { TextArea } = Input

const CARD_WIDTH = 300
const cardStyle: React.CSSProperties = {
    width: CARD_WIDTH,
}

const textareaPasteImgStyle: React.CSSProperties = {
    display: 'block',
    width: CARD_WIDTH - 20,
    height: 35,
}

const spinContentStyle: React.CSSProperties = {
    padding: 50,
    background: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
}

const spinContent = <div style={spinContentStyle} />

interface Student {
    id: string
    name: string
    src: string
}

export default function Home({ params }: { params: { name: string } }) {
    const [isConnecting, setIsConnecting] = useState<boolean>(true)
    const [client, setClient] = useState<WebSocketClient | null>(null)
    const [students, setStudents] = useState<Student[]>([])
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [placeHolderText, setPlaceHolderText] = useState<string>('')
    const [logs, setLogs] = useState<string[]>([])
    const [broadcastImage, setBroadcastImage] = useState<string>('/placeholder.svg')
    const [broadcastText, setBroadcastText] = useState<string>('')

    const stateRef = useRef<string[]>()
    stateRef.current = logs

    useEffect(() => {
        fetch('/api/get-class-students?class=' + params.name)
            .then((response) => response.json())
            .then((data) => {
                setStudents(data)
            })
            .catch((error) => {
                console.error('Error fetching students:', error)
            })
    }, [])

    function logSuccess(msg: string) {
        msg = new Date().toLocaleString() + ' ok: ' + msg
        console.log(msg)
        setLogs(stateRef.current!.concat([msg]))
    }
    function logError(msg: string) {
        msg = new Date().toLocaleString() + ' error: ' + msg
        console.log(msg)
        setLogs(stateRef.current!.concat([msg]))
    }
    function handleStudentClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        const id = event.currentTarget.getAttribute('data-id')!
        const name = event.currentTarget.innerText

        setSelectedStudent({ id, name, src: '/placeholder.svg' })
        connect_server(id)
    }

    function handlePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
        const studentId = event.currentTarget.getAttribute('data-id')
        const items = event.clipboardData.items
        let blob: Blob | null = null

        // Find pasted image among pasted items
        for (let i = 0; i < items.length; i++) {
            console.log(items[i].type)
            if (items[i].type.indexOf('image') === 0) {
                blob = items[i].getAsFile()
                break
            }
        }
        if (!blob) {
            logError('剪贴板中没有图片')
            return
        }
        if (!client) {
            logError('no web socket client.')
            return
        }

        // Load and display the image, and send it via WebSocket
        const reader = new FileReader()
        reader.onload = (event) => {
            // update selected student image
            setSelectedStudent({
                id: selectedStudent?.id as string,
                name: selectedStudent?.name as string,
                src: event.target?.result as string,
            })
            client.broadcastImage(event.target?.result as string)
            logSuccess(`发送图片成功 id: ${studentId}`)
        }
        reader.readAsDataURL(blob)
    }

    function connect_server(id: string) {
        setIsConnecting(true)
        //connect
        const client = new WebSocketClient(params.name, false, id)
        client.ws.onopen = () => {
            console.log('connection is opened.')
            setClient(client)
            setIsConnecting(false)
        }
        client.ws.onclose = () => {
            console.log('connection is closed.')
            setClient(null)
            setIsConnecting(false)
        }
        client.ws.onerror = (error) => {
            console.error('connection error.', error)
            setClient(null)
            setIsConnecting(false)
        }
        client.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                // if (data.name != params.name)
                //     throw new Error(`${data.name} != ${params.name}`);
                if (data.type == 'BROADCAST_IMAGE') {
                    setBroadcastImage(data.data)
                    logSuccess('收到广播图片')
                }
                if (data.type == 'BROADCAST_TEXT') {
                    setBroadcastText(data.data)
                    logSuccess('收到广播文字')
                }
            } catch (err) {
                console.error('Error processing WebSocket message:', err)
            }
        }
    }

    function handleConnectClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        if (selectedStudent) connect_server(selectedStudent.id)
    }

    if (!selectedStudent)
        return (
            <div>
                <h1>{params.name}</h1>
                <Flex gap="small" wrap>
                    {students.map((student) => (
                        <Button key={student.id} data-id={student.id} onClick={handleStudentClick}>
                            {student.name}
                        </Button>
                    ))}
                </Flex>
            </div>
        )
    else
        return (
            <div>
                <h1>{params.name}</h1>
                {isConnecting ? (
                    <Spin tip="正在连接服务器..." size="large">
                        {spinContent}
                    </Spin>
                ) : (
                    <Flex gap="small">
                        <Alert
                            message={client !== null ? '连接成功' : '无法连接服务器'}
                            type={client !== null ? 'success' : 'error'}
                            showIcon
                        />
                        {client === null ? (
                            <Button type="primary" onClick={handleConnectClick}>
                                连接服务器
                            </Button>
                        ) : null}
                    </Flex>
                )}

                {client === null && !isConnecting ? (
                    <Alert message="错误" description="请检查网络。" type="error" showIcon />
                ) : (
                    <div>
                        <Flex wrap gap="small">
                            <Card
                                id="card"
                                hoverable
                                style={cardStyle}
                                styles={{
                                    body: { padding: 5, overflow: 'hidden' },
                                }}
                            >
                                <Flex vertical={true}>
                                    <Typography>
                                        <Title level={2}>{selectedStudent.name}</Title>
                                    </Typography>
                                    <textarea
                                        data-id={selectedStudent.id}
                                        placeholder="使用Ctrl+V在这里粘贴图片"
                                        style={textareaPasteImgStyle}
                                        onPaste={handlePaste}
                                        onChange={(e) => setPlaceHolderText('')}
                                        value={placeHolderText}
                                    ></textarea>
                                    <Image
                                        alt={selectedStudent.id}
                                        src={selectedStudent.src}
                                        width={CARD_WIDTH}
                                        height={CARD_WIDTH}
                                    />
                                </Flex>
                            </Card>
                            <Card
                                id="card"
                                hoverable
                                style={cardStyle}
                                styles={{
                                    body: { padding: 5, overflow: 'hidden' },
                                }}
                            >
                                <Flex vertical={true}>
                                    <Typography>
                                        <Title level={3}>操作日志</Title>
                                    </Typography>
                                    <TextArea readOnly rows={15} style={{ resize: 'none' }} value={logs.join('\n')} />
                                </Flex>
                            </Card>
                        </Flex>
                        <Flex wrap gap="small">
                            <Card
                                id="card"
                                hoverable
                                style={cardStyle}
                                styles={{
                                    body: { padding: 5, overflow: 'hidden' },
                                }}
                            >
                                <Flex vertical={true}>
                                    <Typography>
                                        <Title level={2}>图片广播</Title>
                                    </Typography>
                                    <Image alt="图片广播" src={broadcastImage} width={CARD_WIDTH} height={CARD_WIDTH} />
                                </Flex>
                            </Card>
                            <Card
                                id="card"
                                hoverable
                                style={cardStyle}
                                styles={{
                                    body: { padding: 5, overflow: 'hidden' },
                                }}
                            >
                                <Flex vertical={true}>
                                    <Typography>
                                        <Title level={2}>文本广播</Title>
                                    </Typography>
                                    <TextArea readOnly rows={15} style={{ resize: 'none' }} value={broadcastText} />
                                </Flex>
                            </Card>
                        </Flex>
                    </div>
                )}
            </div>
        )
}
