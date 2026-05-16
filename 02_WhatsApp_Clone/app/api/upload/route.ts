import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(req: NextRequest) {

  try {

    const data = await req.formData()
    const file = data.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), "public", "uploads")

    // create folder if missing
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const fileName = Date.now() + "-" + file.name.replace(/\s/g, "_")

    const filePath = path.join(uploadDir, fileName)

    fs.writeFileSync(filePath, buffer)

    return NextResponse.json({
      url: `/uploads/${fileName}`
    })

  } catch (error) {

    console.error("Upload error:", error)

    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    )

  }

}