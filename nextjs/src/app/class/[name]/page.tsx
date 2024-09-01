"use client";

import React from "react";
import { Button, Image, Card, Flex, Typography, Space } from "antd";
const { Title, Text } = Typography;
import { useEffect, useState, useCallback } from "react";
import { BaseType } from "antd/es/typography/Base";

const CARD_WIDTH = 500;
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

interface Log {
    type: BaseType | undefined;
    text: string;
}

export default function Home({ params }: { params: { name: string } }) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(
        null
    );
    const [logs, setLogs] = useState<Log[]>([]);

    useEffect(() => {
        fetch("/api/get-class-students?class=" + params.name)
            .then((response) => response.json())
            .then((data) => {
                setStudents(data);
            })
            .catch((error) => {
                console.error("Error fetching students:", error);
            });
    }, []);

    function logSuccess(msg: string) {
        console.log(msg);
        setLogs(logs.concat({ type: "success", text: msg }));
    }
    function logError(msg: string) {
        console.log(msg);
        setLogs(logs.concat({ type: "danger", text: msg }));
    }
    function handleClick(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        // Create WebSocket connection
        // const endpoint = process.env.NEXT_PUBLIC_WS_ENDPOINT! + "/" + params.name;
        const endpoint = process.env.NEXT_PUBLIC_WS_ENDPOINT_STUDENT!;
        logSuccess(`ws connect. endpoint: ${endpoint}`);
        const ws = new WebSocket(endpoint);
        ws.onerror = (error) => {
            logError("WebSocket error:" + error);
        };

        ws.onclose = () => {
            logError("WebSocket connection closed");
        };
        setSocket(ws);

        const id = event.currentTarget.getAttribute("data-id")!;
        const name = event.currentTarget.innerText;
        setSelectedStudent({ id, name, src: "/placeholder.svg" });
    }

    function handlePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
        const studentId = event.currentTarget.getAttribute("data-id");
        logSuccess(`paste image. id=${studentId}`);
        const items = event.clipboardData.items;
        let blob: Blob | null = null;

        // Find pasted image among pasted items
        for (let i = 0; i < items.length; i++) {
            console.log(items[i].type);
            if (items[i].type.indexOf("image") === 0) {
                blob = items[i].getAsFile();
                break;
            }
        }
        if (!blob) {
            logError("no image.");
            return;
        }
        if (!socket) {
            logError("no socket.");
            return;
        }

        // Load and display the image, and send it via WebSocket
        const reader = new FileReader();
        reader.onload = (event) => {
            setSelectedStudent({
                id: selectedStudent?.id as string,
                name: selectedStudent?.name as string,
                src: event.target?.result as string,
            });
            socket.send(
                JSON.stringify({
                    name: params.name,
                    id: studentId,
                    imageData: event.target?.result as string,
                })
            );
            logSuccess(`update image for id: ${studentId}`);
        };
        reader.readAsDataURL(blob);
    }

    if (!selectedStudent)
        return (
            <div>
                <h1>{params.name}</h1>
                <Flex gap="small" wrap>
                    {students.map((student) => (
                        <Button
                            key={student.id}
                            data-id={student.id}
                            onClick={handleClick}
                        >
                            {student.name}
                        </Button>
                    ))}
                </Flex>
            </div>
        );
    else
        return (
            <div>
                <h1>{params.name}</h1>
                <Flex wrap gap="small">
                    <Card
                        id="card"
                        hoverable
                        style={cardStyle}
                        styles={{
                            body: { padding: 5, overflow: "hidden" },
                        }}
                    >
                        <Flex vertical={true}>
                            <Typography>
                                <Title level={2}>{selectedStudent.name}</Title>
                            </Typography>
                            <textarea
                                data-id={selectedStudent.id}
                                placeholder="在这里粘贴图片"
                                style={textareaPasteImgStyle}
                                onPaste={handlePaste}
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
                            body: { padding: 5, overflow: "hidden" },
                        }}
                    >
                        <Flex vertical={true}>
                            <Typography>
                                <Title level={2}>操作日志</Title>
                            </Typography>
                            <Typography>
                                <Title level={2}>
                                    <Space direction="vertical">
                                        {logs.map((log, index) => (
                                            <Text
                                                key={`text-${index}`}
                                                type={log.type}
                                            >
                                                {log.text}
                                            </Text>
                                        ))}
                                    </Space>
                                </Title>
                            </Typography>
                        </Flex>
                    </Card>
                </Flex>
            </div>
        );
}
