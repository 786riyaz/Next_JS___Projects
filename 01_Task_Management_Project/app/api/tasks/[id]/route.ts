import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireRole(req, [
      "ADMIN",
      "MANAGER",
      "USER",
    ]);

    const { id } = await context.params;
    const body = await req.json();

    const updated = await prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id },
        data: body,
      });

      await tx.activityLog.create({
        data: {
          action: `Task Updated: ${task.title}`,
          userId: user.id,
        },
      });

      return task;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 403 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireRole(req, ["ADMIN", "MANAGER"]);
    const { id } = await context.params;

    await prisma.$transaction(async (tx) => {
      const task = await tx.task.delete({
        where: { id },
      });

      await tx.activityLog.create({
        data: {
          action: `Task Deleted: ${task.title}`,
          userId: user.id,
        },
      });
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 403 }
    );
  }
}