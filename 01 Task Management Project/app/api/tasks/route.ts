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

    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const filters: any = {};

    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    if (user.role === "USER") {
      filters.assignedToId = user.id;
    }

    const tasks = await prisma.task.findMany({
      where: filters,
      include: {
        assignedTo: {
          select: { id: true, name: true, role: true },
        },
        assignedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireRole(req, ["ADMIN", "MANAGER"]);

    const body = await req.json();
    const { title, description, priority, assignedToId } = body;

    // ✅ Basic validation
    if (!title || !assignedToId) {
      return NextResponse.json(
        { error: "Title and Assigned User are required" },
        { status: 400 }
      );
    }

    // ✅ Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          title,
          description: description || "",
          priority: priority || "MEDIUM",
          assignedToId,
          assignedById: user.id,
        },
      });

      await tx.activityLog.create({
        data: {
          action: `Task Created: ${task.title}`,
          userId: user.id,
        },
      });

      return task;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    const message = error.message || "Forbidden";

    return NextResponse.json(
      { error: message },
      {
        status:
          message === "Unauthorized"
            ? 401
            : message === "Forbidden"
            ? 403
            : 500,
      }
    );
  }
}