import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN"]);

    const page = Number(req.nextUrl.searchParams.get("page") || 1);
    const limit = 5;
    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.user.count();

    return NextResponse.json({
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 403 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN"]);

    const body = await req.json();

    const hashed = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashed,
        role: body.role,
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 403 }
    );
  }
}