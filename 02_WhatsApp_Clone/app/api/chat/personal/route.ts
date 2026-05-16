// app/api/chat/personal/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/serverAuth"

export async function POST(req: NextRequest) {
  try {
    const user = verifyToken(req)

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { targetUserId } = await req.json()

    if (!targetUserId) {
      return NextResponse.json(
        { message: "targetUserId required" },
        { status: 400 }
      )
    }

    // ✅ ADD THIS HERE
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!targetUser) {
      return NextResponse.json(
        { message: "Target user not found" },
        { status: 404 }
      )
    }

    // 🔎 check if chat already exists
    const existing = await prisma.chat.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: user.id } } },
          { members: { some: { userId: targetUserId } } }
        ]
      },
      include: {
        members: { include: { user: true } }
      }
    })

    if (existing) {
      return NextResponse.json(existing)
    }

    // 🔥 create chat
    const chat = await prisma.chat.create({
      data: {
        isGroup: false,
        members: {
          create: [
            { userId: user.id },
            { userId: targetUserId }
          ]
        }
      },
      include: {
        members: { include: { user: true } }
      }
    })

    return NextResponse.json(chat, { status: 201 })

  } catch (error) {
    console.error("PERSONAL CHAT ERROR:", error)

    return NextResponse.json(
      { message: "Server error", error: String(error) },
      { status: 500 }
    )
  }
}