import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";

export async function GET(req: NextRequest) {
  try {
    const user = requireRole(req, [
      "ADMIN",
      "MANAGER",
      "USER",
    ]);

    const baseFilter =
      user.role === "USER"
        ? { assignedToId: user.id }
        : {};

    const total = await prisma.task.count({
      where: baseFilter,
    });

    const pending = await prisma.task.count({
      where: { ...baseFilter, status: "PENDING" },
    });

    const inProgress = await prisma.task.count({
      where: { ...baseFilter, status: "IN_PROGRESS" },
    });

    const completed = await prisma.task.count({
      where: { ...baseFilter, status: "COMPLETED" },
    });

    const tasks = await prisma.task.findMany({
      where: baseFilter,
      include: {
        assignedTo: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      stats: { total, pending, inProgress, completed },
      recentTasks: tasks,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }
}