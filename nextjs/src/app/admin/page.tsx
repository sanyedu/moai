'use client'

import React from 'react'
import { UploadOutlined } from '@ant-design/icons'

import type { PopconfirmProps, UploadProps } from 'antd'
import { Button, Typography, message, Popconfirm, Upload } from 'antd'
import { useEffect, useState } from 'react'

const { Title, Paragraph, Text, Link } = Typography

export default function Home() {
    const [classes, setClasses] = useState<string[]>([])

    const cancel: PopconfirmProps['onCancel'] = (e) => {
        console.log(e)
        message.error('删除操作已取消')
    }
    const props: UploadProps = {
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

    return (
        <Typography>
            <Title>班级列表</Title>
            <Paragraph>
                <ul>
                    {classes.map((name) => (
                        <li key={name}>
                            {name} | <Link href={'/api/download?file=' + name + '.xlsx'}>下载</Link> |{' '}
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

            <Upload {...props}>
                <Button icon={<UploadOutlined />}>上传班级Excel文件</Button>
            </Upload>
        </Typography>
    )
}
