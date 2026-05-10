import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";

import Priority from "@/models/Priority";


// =========================
// GET ALL PRIORITIES
// =========================

export async function GET() {
  try {
    await connectDB();

    const priorities =
      await Priority.find().sort({
        learnPriority: 1,
      });

    return NextResponse.json(
      priorities
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
}


// =========================
// CREATE PRIORITY
// =========================

export async function POST(
  request
) {
  try {
    await connectDB();

    const body =
      await request.json();

    const newPriority =
      await Priority.create(body);

    return NextResponse.json(
      newPriority
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
}