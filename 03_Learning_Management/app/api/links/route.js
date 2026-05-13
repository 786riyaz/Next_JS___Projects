// app/api/links/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Link from "@/models/Link";

export async function GET() {
  try {
    await connectDB();
    const links = await Link.find().sort({ category: 1, topic: 1 });
    return NextResponse.json(links);
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const newLink = await Link.create(body);
    return NextResponse.json(newLink);
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}