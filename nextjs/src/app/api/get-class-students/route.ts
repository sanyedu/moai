import { NextResponse, NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { join } from "path";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const className = searchParams.get("class");
        // Construct the file path
        const filePath = join(process.cwd(), "data", `${className}.xlsx`);

        // Create a new workbook and read the file
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        // Get the first worksheet
        const worksheet = workbook.worksheets[0];

        // Extract the headers
        const headers: string[] = [];
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            headers.push(cell.text);
        });

        const idIndex = headers.indexOf("学号") + 1;
        const nameIndex = headers.indexOf("姓名") + 1;

        if (idIndex === 0 || nameIndex === 0) {
            return NextResponse.json(
                { error: "Invalid Excel file format" },
                { status: 400 }
            );
        }

        // Process the rows and extract student data
        const students: any[] = [];
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1) return; // Skip the header row

            const student = {
                id: row.getCell(idIndex).text,
                name: row.getCell(nameIndex).text,
            };

            students.push(student);
        });

        // Return the JSON response
        return NextResponse.json(students);
    } catch (error) {
        console.error("Error reading Excel file:", error);
        return NextResponse.json(
            { error: "Failed to read Excel file" },
            { status: 500 }
        );
    }
}
