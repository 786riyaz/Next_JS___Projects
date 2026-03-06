// app/api/chat/personal/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/serverAuth"

export async function GET(req: NextRequest) {
  try {

    const user = verifyToken(req)

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const chats = await prisma.chat.findMany({
      where: {
        members: {
          some: { userId: user.id }
        }
      },
      include: {
        members: {
          include: {
            user: true
          }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    })

    return NextResponse.json(chats)

  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    )
  }
}