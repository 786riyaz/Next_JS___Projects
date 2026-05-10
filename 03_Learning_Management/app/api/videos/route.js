import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Video from "@/models/Video";

// =========================
// GET ALL VIDEOS
// =========================
export async function GET() {
  try {
    await connectDB();
    const videos = await Video.find().sort({ priority: 1 });
    return NextResponse.json(videos);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// =========================
// CREATE VIDEO
// =========================
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const newVideo = await Video.create(body);
    return NextResponse.json(newVideo);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}