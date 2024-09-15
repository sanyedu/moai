// src/app/api/download/route.ts

import { NextResponse, NextRequest } from 'next/server'
import fs from 'fs'
import { join } from 'path'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const file = searchParams.get('file')
        // Resolve the file path (make sure the file path is secure)
        const filePath = join(process.cwd(), 'data', `${file}`)

        // Check if the file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`${file} does not exist`)
        }

        // Read the file contents as a byte stream
        const fileBuffer = fs.readFileSync(filePath)

        // Set headers to initiate file download
        const response = new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="${file!}"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        })

        return response
    } catch (error) {
        return NextResponse.json({ error: 'Failed to download Excel file', status: 500 })
    }
}
