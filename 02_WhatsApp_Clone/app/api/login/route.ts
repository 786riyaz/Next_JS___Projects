// app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET as string

export async function POST(req: NextRequest) {
  const { mobile, password } = await req.json()

  const user = await prisma.user.findUnique({
    where: { mobile }
  })

  if (!user) {
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 400 }
    )
  }

  const isValid = await bcrypt.compare(password, user.password)

  if (!isValid) {
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 400 }
    )
  }

  const token = jwt.sign(
    { id: user.id, mobile: user.mobile, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  )

  return NextResponse.json({ token })
}