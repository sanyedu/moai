"use client";

import React from "react";
import { Image, Card, Flex, Typography } from "antd";
const { Title, Paragraph, Text, Link } = Typography;
import { useEffect, useState, useCallback } from "react";

const CARD_WIDTH = 150;
const cardStyle: React.CSSProperties = {
    width: CARD_WIDTH,
};

const textareaPasteImgStyle: React.CSSProperties = {
    display: "block",
    width: CARD_WIDTH - 20,
    height: 35,
};

interface Student {
    id: string;
    name: string;
    src: string;
}

export default function Home({ params }: { params: { name: string } }) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [students, setStudents] = useState<Student[]>([]);

    useEffect(() => {
        fetch("/api/get-class-students?class=" + params.name)
            .then((response) => response.json())
            .then((data) => {
                setStudents(
                    data.map((s: Student) => {
                        s.src = "/placeholder.svg";
                        return s;
                    })
                );
            })
            .catch((error) => {
                console.error("Error fetching students:", error);
            });

        // Create WebSocket connection
        // const endpoint = process.env.NEXT_PUBLIC_WS_ENDPOINT! + "/" + params.name;
        const endpoint = process.env.NEXT_PUBLIC_WS_ENDPOINT_TEACHER!;
        console.log(`ws connect. endpoint: ${endpoint}`);
        const ws = new WebSocket(endpoint);
        setSocket(ws);

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        ws.onclose = () => {
            console.log("WebSocket connection closed");
        };

        // Cleanup on component unmount
        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
                console.log("ws disconnect");
            }
        };
    }, []);

    useEffect(() => {
        // Handle WebSocket messages
        if (!socket || !students) return;

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // if (data.name != params.name)
                //     throw new Error(`${data.name} != ${params.name}`);
                if (!data.id || !data.imageData)
                    throw new Error(JSON.stringify(data));

                console.log(`update image for id: ${data.id}`);
                setStudents(
                    students.map((s: Student) => {
                        if (data.id == s.id) s.src = data.imageData;
                        return s;
                    })
                );
            } catch (err) {
                console.error("Error processing WebSocket message:", err);
            }
        };
    }, [socket, students]);

    return (
        <div>
            <h1>{params.name}</h1>
            <Flex wrap gap="small">
                <Image.PreviewGroup
                    preview={{
                        onChange: (current, prev) =>
                            console.log(
                                `current index: ${current}, prev index: ${prev}`
                            ),
                    }}
                >
                    {students.map((student) => (
                        <Card
                            key={student.id}
                            hoverable
                            style={cardStyle}
                            styles={{
                                body: { padding: 5, overflow: "hidden" },
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
        </div>
    );
}
