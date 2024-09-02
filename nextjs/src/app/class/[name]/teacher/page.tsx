"use client";

import React from "react";
import { Image, Card, Flex, Typography, Input, Button } from "antd";
const { Title, Paragraph, Text, Link } = Typography;
import { useEffect, useState, useCallback } from "react";
const { TextArea } = Input;

const CARD_WIDTH = 90;
const BROADCAST_CARD_WIDTH = 500;
const cardStyle: React.CSSProperties = {
    width: CARD_WIDTH,
};

const broadcastCardStyle: React.CSSProperties = {
    width: BROADCAST_CARD_WIDTH,
};

const textareaPasteImgStyle: React.CSSProperties = {
    display: "block",
    width: BROADCAST_CARD_WIDTH - 20,
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

    const [placeHolderText, setPlaceHolderText] = useState<string>("");
    const [broadcastImage, setBroadcastImage] =
        useState<string>("/placeholder.svg");
    const [broadcastText, setBroadcastText] = useState<string>("");

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
                if (data.type == "UPDATE_SINGLE_IMAGE") {
                    if (!data.id || !data.data)
                        throw new Error(JSON.stringify(data));

                    console.log(`update single image for id: ${data.id}`);
                    setStudents(
                        students.map((s: Student) => {
                            if (data.id == s.id) s.src = data.data;
                            return s;
                        })
                    );
                }
            } catch (err) {
                console.error("Error processing WebSocket message:", err);
            }
        };
    }, [socket, students]);

    function handlePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
        const studentId = event.currentTarget.getAttribute("data-id");
        console.log(`paste image. id=${studentId}`);
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
            console.log("no image.");
            return;
        }
        if (!socket) {
            console.log("no socket.");
            return;
        }

        // Load and display the image, and send it via WebSocket
        const reader = new FileReader();
        reader.onload = (event) => {
            setBroadcastImage(event.target?.result as string);
            socket.send(
                JSON.stringify({
                    type: "BROADCAST_IMAGE",
                    name: params.name,
                    data: event.target?.result as string,
                })
            );
            console.log(`send broadcast image`);
        };
        reader.readAsDataURL(blob);
    }

    function handleClick(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        const text = document.getElementById("textAreaBroadcast")?.textContent;
        console.log(text);
        if (!text) {
            console.log("no text.");
            return;
        }
        if (!socket) {
            console.log("no socket.");
            return;
        }
        socket.send(
            JSON.stringify({
                type: "BROADCAST_TEXT",
                name: params.name,
                data: text,
            })
        );
        console.log(`send broadcast image`);
    }

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
            <Flex wrap gap="small">
                <Card
                    id="card"
                    hoverable
                    style={broadcastCardStyle}
                    styles={{
                        body: { padding: 5, overflow: "hidden" },
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
                            onChange={(e) => setPlaceHolderText("")}
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
                        body: { padding: 5, overflow: "hidden" },
                    }}
                >
                    <Flex vertical={true}>
                        <Typography>
                            <Title level={2}>文本广播</Title>
                        </Typography>
                        <Button type="primary" onClick={handleClick}>
                            Send Broadcast
                        </Button>
                        <TextArea
                            id="textAreaBroadcast"
                            rows={23}
                            style={{ resize: "none" }}
                        />
                    </Flex>
                </Card>
            </Flex>
        </div>
    );
}
