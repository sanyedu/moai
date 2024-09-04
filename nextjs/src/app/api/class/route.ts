import path, { join } from 'path'
import fs from 'fs'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
    // Define the directory to search for .xlsx files
    const dataDirectory = path.resolve('data')

    // Read the contents of the public directory
    const files = await fs.readdirSync(dataDirectory)

    // Filter the list to include only .xlsx files
    const xlsxFiles = files.filter((file) => path.extname(file) === '.xlsx').map((name) => name.replace('.xlsx', ''))

    // Respond with the list of .xlsx files as a JSON array
    return NextResponse.json(xlsxFiles)
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const file = searchParams.get('file')

        // Resolve the file path (make sure the file path is secure)
        const filePath = join(process.cwd(), 'data', `${file}`)

        // Check if the file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`${file} does not exist`)
        }

        // delete the file
        await fs.unlinkSync(filePath)

        // Define the directory to search for .xlsx files
        const dataDirectory = path.resolve('data')

        // Read the contents of the public directory
        const files = await fs.readdirSync(dataDirectory)

        // Filter the list to include only .xlsx files
        const xlsxFiles = files
            .filter((file) => path.extname(file) === '.xlsx')
            .map((name) => name.replace('.xlsx', ''))

        // Respond with the list of .xlsx files as a JSON array
        return NextResponse.json(xlsxFiles)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete Excel file', status: 500 })
    }
}
