'use client'

import React from 'react'
import { UploadOutlined } from '@ant-design/icons'

import type { PopconfirmProps, UploadProps } from 'antd'
import type { FormProps } from 'antd'
import { Button, Typography, message, Popconfirm, Upload, Form, Checkbox, Input } from 'antd'
import { useEffect, useState } from 'react'

const { Title, Paragraph, Text, Link } = Typography

type FieldType = {
    password?: string
    remember?: string
}

export default function Home() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const [classes, setClasses] = useState<string[]>([])

    const cancel: PopconfirmProps['onCancel'] = (e) => {
        console.log(e)
        message.error('删除操作已取消')
    }
    const uploadProps: UploadProps = {
        name: 'file',
        action: '/api/upload',
        headers: {
            authorization: 'authorization-text',
        },
        onChange(info) {
            if (info.file.status !== 'uploading') {
                console.log(info.file, info.fileList)
            }
            if (info.file.status === 'done') {
                message.success(`${info.file.name} 文件上传成功`)
                const name = info.file.name.replace('.xlsx', '')
                if (classes.indexOf(name) >= 0) setClasses(classes.concat([]))
                else setClasses(classes.concat([name]))
            } else if (info.file.status === 'error') {
                message.error(`${info.file.name} 文件上传失败`)
            }
        },
    }

    useEffect(() => {
        fetch('/api/class')
            .then((response) => response.json())
            .then((data) => {
                setClasses(data)
            })
            .catch((error) => {
                console.error('Error fetching classes:', error)
            })
    }, [])

    function handleAddClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {}
    function handleDelClick(name: string) {
        fetch('/api/class?file=' + name + '.xlsx', {
            method: 'DELETE',
        })
            .then((response) => response.json())
            .then((data) => {
                setClasses(data)
                message.success(`已删除班级：${name}`)
            })
            .catch((error) => {
                message.error('删除失败')
                console.error('Error fetching classes:', error)
            })
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
                <Typography>
                    <Title>班级列表</Title>
                    <Paragraph>
                        <ul>
                            {classes.map((name: string) => (
                                <li key={name}>
                                    {name}: <Link href={'/api/download?file=' + name + '.xlsx'}>下载</Link> |
                                    <Popconfirm
                                        title="删除班级"
                                        description={`确定删除${name}吗？此操作无法撤销。`}
                                        onConfirm={(e) => handleDelClick(name)}
                                        onCancel={cancel}
                                        okText="Yes"
                                        cancelText="No"
                                    >
                                        <Button type="link" danger>
                                            删除
                                        </Button>
                                    </Popconfirm>
                                </li>
                            ))}
                        </ul>
                    </Paragraph>

                    <p style={{ color: 'red' }}>
                        注意：上传Excel文件名即为课程名，只接受英文、数字、短横线和下划线。
                        <br />
                        不接受中文和特殊字符！！
                    </p>
                    <Upload {...uploadProps}>
                        <Button icon={<UploadOutlined />}>上传班级Excel文件</Button>
                    </Upload>
                </Typography>
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
