'use client'

import React from 'react'
import { Typography } from 'antd'
import { useEffect, useState } from 'react'

const { Title, Paragraph, Text, Link } = Typography

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
        <Typography>
            <Title>班级列表</Title>

            <Paragraph>
                <ul>
                    {classes.map((name) => (
                        <li key={name}>
                            <Link href={'/class/' + name}>{name}</Link>
                        </li>
                    ))}
                </ul>
            </Paragraph>
        </Typography>
    )
}
