"use client";

import React from "react";
import { Divider, Typography } from "antd";

const { Title, Paragraph, Text, Link } = Typography;

export default function Home() {
    return (
        <Typography>
            <Title>班级列表</Title>

            <Paragraph>
                <ul>
                    <li>
                        <Link href="/class/software-2304">软件技术2304班</Link>
                    </li>
                </ul>
            </Paragraph>
        </Typography>
    );
}
