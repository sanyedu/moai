'use client'

import React from 'react'
import { Image, Card, Flex, Typography, Input, Button, Alert, Spin, Form, Checkbox, message } from 'antd'
const { Title, Paragraph, Text, Link } = Typography
import type { FormProps } from 'antd'
import { useEffect, useState } from 'react'
import { WebSocketClient } from '../WebSocketClient'
const { TextArea } = Input

const CARD_WIDTH = 90
const BROADCAST_CARD_WIDTH = 500
const cardStyle: React.CSSProperties = {
    width: CARD_WIDTH,
}

const broadcastCardStyle: React.CSSProperties = {
    width: BROADCAST_CARD_WIDTH,
}

const textareaPasteImgStyle: React.CSSProperties = {
    display: 'block',
    width: BROADCAST_CARD_WIDTH - 20,
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

type FieldType = {
    password?: string
    remember?: string
}

export default function Home({ params }: { params: { name: string } }) {
    const className = decodeURI(params.name)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const [isConnecting, setIsConnecting] = useState<boolean>(true)
    const [client, setClient] = useState<WebSocketClient | null>(null)
    const [students, setStudents] = useState<Student[]>([])

    const [placeHolderText, setPlaceHolderText] = useState<string>('')
    const [broadcastImage, setBroadcastImage] = useState<string>('/placeholder.svg')

    useEffect(() => {
        fetch('/api/get-class-students?class=' + className)
            .then((response) => response.json())
            .then((data) => {
                const students = data.map((s: Student) => {
                    s.src = '/placeholder.svg'
                    return s
                })
                setStudents(students)
                connect_server(students)
            })
            .catch((error) => {
                console.error('Error fetching students:', error)
            })
    }, [])

    function connect_server(students: Student[]) {
        setIsConnecting(true)
        //connect
        const client = new WebSocketClient(className, true)
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
                if (data.type == 'BROADCAST_IMAGE') {
                    console.log(`update image for student id: ${data.id}`)
                    setStudents(
                        students.map((s: Student) => {
                            if (data.id == s.id) s.src = data.data
                            return s
                        })
                    )
                }
            } catch (err) {
                console.error('Error processing WebSocket message:', err)
            }
        }
    }
    function handlePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
        const studentId = event.currentTarget.getAttribute('data-id')
        console.log(`paste image. id=${studentId}`)
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
            console.log('no image.')
            return
        }
        if (!client) {
            console.log('no socket.')
            return
        }

        // Load and display the image, and send it via WebSocket
        const reader = new FileReader()
        reader.onload = (event) => {
            const image = event.target?.result as string
            setBroadcastImage(image)
            client.broadcastImage(image)
        }
        reader.readAsDataURL(blob)
    }

    function handleConnectClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        connect_server(students)
    }

    function handleBroadcastTextClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        const text = document.getElementById('textAreaBroadcast')?.textContent
        console.log(text)
        if (!text) {
            console.log('no text.')
            return
        }
        if (!client) {
            console.log('no socket.')
            return
        }
        client.broadcastText(text)
    }

    function handleClearSnapshotClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        client?.clearStudentSnapshot()
        setStudents(
            students.map((s: Student) => {
                s.src = '/placeholder.svg'
                return s
            })
        )
        message.success('操作成功')
    }

    const onFinish: FormProps<FieldType>['onFinish'] = (values) => {
        if (values.password === process.env.NEXT_PUBLIC_TOKEN) {
            setIsAuthenticated(true)
            message.info('通过验证')
        } else {
            message.error('密码错误')
        }
    }
    const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
        message.error('请输入密码')
    }

    return (
        <div>
            {isAuthenticated ? (
                <div>
                    <h1>{className}</h1>
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

                    <Button type="primary" onClick={handleClearSnapshotClick}>
                        清空剪贴板
                    </Button>

                    <Flex wrap gap="small">
                        <Image.PreviewGroup
                            preview={{
                                onChange: (current, prev) =>
                                    console.log(`current index: ${current}, prev index: ${prev}`),
                            }}
                        >
                            {students.map((student) => (
                                <Card
                                    key={student.id}
                                    hoverable
                                    style={cardStyle}
                                    styles={{
                                        body: { padding: 5, overflow: 'hidden' },
                                    }}
                                >
                                    <Flex vertical={true}>
                                        <Typography>
                                            <Title level={3}>{student.name}</Title>
                                        </Typography>
                                        <Image
                                            alt={student.id}
                                            src={student.src}
                                            width={CARD_WIDTH}
                                            height={CARD_WIDTH}
                                        />
                                    </Flex>
                                </Card>
                            ))}
                        </Image.PreviewGroup>
                    </Flex>
                    <Flex wrap gap="small">
                        <Card
                            id="card"
                            hoverable
                            style={broadcastCardStyle}
                            styles={{
                                body: { padding: 5, overflow: 'hidden' },
                            }}
                        >
                            <Flex vertical={true}>
                                <Typography>
                                    <Title level={2}>图片广播</Title>
                                </Typography>
                                <textarea
                                    placeholder="使用Ctrl+V在这里粘贴图片"
                                    style={textareaPasteImgStyle}
                                    onPaste={handlePaste}
                                    onChange={(e) => setPlaceHolderText('')}
                                    value={placeHolderText}
                                ></textarea>
                                <Image
                                    alt="图片广播"
                                    src={broadcastImage}
                                    width={BROADCAST_CARD_WIDTH}
                                    height={BROADCAST_CARD_WIDTH}
                                />
                            </Flex>
                        </Card>
                        <Card
                            id="card"
                            hoverable
                            style={broadcastCardStyle}
                            styles={{
                                body: { padding: 5, overflow: 'hidden' },
                            }}
                        >
                            <Flex vertical={true}>
                                <Typography>
                                    <Title level={2}>文本广播</Title>
                                </Typography>
                                <Button type="primary" onClick={handleBroadcastTextClick}>
                                    Send Broadcast
                                </Button>
                                <TextArea id="textAreaBroadcast" rows={23} style={{ resize: 'none' }} />
                            </Flex>
                        </Card>
                    </Flex>
                </div>
            ) : (
                <Form
                    name="basic"
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    style={{ maxWidth: 600 }}
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                >
                    <Form.Item<FieldType>
                        label="输入密码"
                        name="password"
                        rules={[{ required: true, message: 'Please input your password!' }]}
                    >
                        <Input.Password />
                    </Form.Item>

                    <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                        <Button type="primary" htmlType="submit">
                            Submit
                        </Button>
                    </Form.Item>
                </Form>
            )}
        </div>
    )
}
