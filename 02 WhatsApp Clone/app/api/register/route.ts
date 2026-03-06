// app/api/register/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  const { mobile, password, name } = await req.json()

  const existing = await prisma.user.findUnique({
    where: { mobile }
  })

  if (existing) {
    return NextResponse.json(
      { message: "User already exists" },
      { status: 400 }
    )
  }

  const hashed = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { mobile, password: hashed, name }
  })

  return NextResponse.json(
    { id: user.id, mobile: user.mobile },
    { status: 201 }
  )
}