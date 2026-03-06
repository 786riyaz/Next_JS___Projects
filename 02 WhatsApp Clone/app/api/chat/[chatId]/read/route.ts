// app/api/chat/[chatId]/read/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/serverAuth"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ chatId: string }> }
) {

  const user = verifyToken(req)

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { chatId } = await context.params

  await prisma.chatMember.update({
    where: {
      chatId_userId: {
        chatId,
        userId: user.id
      }
    },
    data: {
      unreadCount: 0
    }
  })

  return NextResponse.json({ success: true })

}