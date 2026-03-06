// app/api/messages/[chatId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/serverAuth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ chatId: string }> }
) {
  try {
    const user = verifyToken(req);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ unwrap params correctly
    const { chatId } = await context.params;

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        chat: {
          members: {
            some: {
              userId: user.id
            }
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    return NextResponse.json(messages);

  } catch (error) {
    console.error("GET MESSAGES ERROR:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}