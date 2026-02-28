import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  requireRole(req, ["ADMIN"]);

  const body = await req.json();

  const user = await prisma.user.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(user);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  requireRole(req, ["ADMIN"]);

  await prisma.user.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Deleted" });
}