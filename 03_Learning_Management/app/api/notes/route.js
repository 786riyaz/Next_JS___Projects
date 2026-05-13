// app/api/notes/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Note from "@/models/Note";

export async function GET() {
  try {
    await connectDB();
    const notes = await Note.find().sort({ pinned: -1, updatedAt: -1 });
    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const newNote = await Note.create(body);
    return NextResponse.json(newNote);
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}