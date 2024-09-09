'use client'

import React from 'react'
import { Button, Typography } from 'antd'
import { useEffect, useState } from 'react'

const { Title, Paragraph, Text, Link } = Typography

const spinContentStyle: React.CSSProperties = {
    padding: 10,
}

export default function Home() {
    const [classes, setClasses] = useState<string[]>([])

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

    return (
        <div>
            <Typography>
                <Title>班级列表</Title>
                <Paragraph>
                    <ul>
                        {classes.map((name) => (
                            <li key={name}>
                                <span style={spinContentStyle}>{name}:</span>
                                <Link href={'/class/' + name}>学生入口</Link> |
                                <Link href={'/class/' + name + '/teacher'}>教师入口</Link>
                            </li>
                        ))}
                    </ul>
                </Paragraph>
            </Typography>
            <Link href="/admin">管理入口</Link>
        </div>
    )
}
