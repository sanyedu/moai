"use client";

import React from "react";
import { Button, Image, Card, Flex, Typography, Space, Input } from "antd";
const { Title, Text } = Typography;
import { useEffect, useState, useRef } from "react";
const { TextArea } = Input;

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

export default function Home({ params }: { params: { name: string } }) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(
        null
    );
    const [placeHolderText, setPlaceHolderText] = useState<string>("");
    const [logs, setLogs] = useState<string[]>([]);
    const [broadcastImage, setBroadcastImage] =
        useState<string>("/placeholder.svg");
    const [broadcastText, setBroadcastText] = useState<string>("");

    const stateRef = useRef<string[]>();
    stateRef.current = logs;

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
        msg = new Date().toLocaleString() + " ok: " + msg;
        console.log(msg);
        setLogs(stateRef.current!.concat([msg]));
    }
    function logError(msg: string) {
        msg = new Date().toLocaleString() + " error: " + msg;
        console.log(msg);
        setLogs(stateRef.current!.concat([msg]));
    }
    function handleClick(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        // Create WebSocket connection
        // const endpoint = process.env.NEXT_PUBLIC_WS_ENDPOINT! + "/" + params.name;
        const endpoint = process.env.NEXT_PUBLIC_WS_ENDPOINT_STUDENT!;
        logSuccess(`服务器连接成功: ${endpoint}`);
        const ws = new WebSocket(endpoint);
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // if (data.name != params.name)
                //     throw new Error(`${data.name} != ${params.name}`);
                if (data.type == "BROADCAST_IMAGE") {
                    if (!data.data) throw new Error(JSON.stringify(data));
                    setBroadcastImage(data.data);
                    logSuccess("收到广播图片");
                }
                if (data.type == "BROADCAST_TEXT") {
                    if (!data.data) throw new Error(JSON.stringify(data));
                    setBroadcastText(data.data);
                    logSuccess("收到广播文字");
                }
            } catch (err) {
                console.error("Error processing WebSocket message:", err);
            }
        };
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
            logError("剪贴板中没有图片");
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
                    type: "UPDATE_SINGLE_IMAGE",
                    name: params.name,
                    id: studentId,
                    data: event.target?.result as string,
                })
            );
            logSuccess(`发送图片成功 id: ${studentId}`);
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
                                placeholder="使用Ctrl+V在这里粘贴图片"
                                style={textareaPasteImgStyle}
                                onPaste={handlePaste}
                                onChange={(e) => setPlaceHolderText("")}
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
                            body: { padding: 5, overflow: "hidden" },
                        }}
                    >
                        <Flex vertical={true}>
                            <Typography>
                                <Title level={3}>操作日志</Title>
                            </Typography>
                            <TextArea
                                readOnly
                                rows={25}
                                style={{ resize: "none" }}
                                value={logs.join("\n")}
                            />
                        </Flex>
                    </Card>
                </Flex>
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
                                <Title level={2}>图片广播</Title>
                            </Typography>
                            <Image
                                alt="图片广播"
                                src={broadcastImage}
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
                                <Title level={2}>文本广播</Title>
                            </Typography>
                            <TextArea
                                readOnly
                                rows={25}
                                style={{ resize: "none" }}
                                value={broadcastText}
                            />
                        </Flex>
                    </Card>
                </Flex>
            </div>
        );
}
