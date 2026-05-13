// app/api/links/[id]/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Link from "@/models/Link";

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const updated = await Link.findByIdAndUpdate(id, body, { returnDocument: "after" });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    await Link.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}