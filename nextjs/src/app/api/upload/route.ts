// src/app/api/upload/route.ts

import { NextResponse, NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import fs from 'node:fs/promises'

export async function POST(req: NextRequest, res: NextResponse) {
    try {
        const formData = await req.formData()

        const file = formData.get('file') as File
        const arrayBuffer = await file.arrayBuffer()
        const buffer = new Uint8Array(arrayBuffer)
        if (!file.name.endsWith('.xlsx')) throw new Error('not excel file')

        await fs.writeFile(`./data/${file.name}`, buffer)

        revalidatePath('/')

        return NextResponse.json({ status: 'success' })
    } catch (error) {
        console.error('Error during file upload:', error)
        return NextResponse.json({ error: 'Failed to upload Excel file', status: 500 })
    }
}
