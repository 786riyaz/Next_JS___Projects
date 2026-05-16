import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const total = await prisma.task.count();
  const pending = await prisma.task.count({
    where: { status: "PENDING" },
  });
  const inProgress = await prisma.task.count({
    where: { status: "IN_PROGRESS" },
  });
  const completed = await prisma.task.count({
    where: { status: "COMPLETED" },
  });

  return NextResponse.json({
    total,
    pending,
    inProgress,
    completed,
  });
}