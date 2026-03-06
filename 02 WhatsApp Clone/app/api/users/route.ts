// app/api/users/route.ts
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

    const users = await prisma.user.findMany({
      where: {
        NOT: { id: user.id }
      },
      select: {
        id: true,
        name: true,
        mobile: true
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    )
  }
}