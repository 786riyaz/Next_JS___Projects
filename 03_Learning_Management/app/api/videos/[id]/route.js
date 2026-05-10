import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";

import Video from "@/models/Video";


// ======================
// DELETE VIDEO
// ======================

export async function DELETE(
  request,
  { params }
) {
  try {
    await connectDB();

    const resolvedParams =
      await params;

    const id =
      resolvedParams.id;

    await Video.findByIdAndDelete(
      id
    );

    return NextResponse.json({
      success: true,
      message:
        "Video deleted successfully",
    });
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


// ======================
// UPDATE VIDEO
// ======================

export async function PUT(
  request,
  { params }
) {
  try {
    await connectDB();

    const resolvedParams =
      await params;

    const id =
      resolvedParams.id;

    const body =
      await request.json();

    const updatedVideo =
      await Video.findByIdAndUpdate(
        id,
        body,
        {
          returnDocument:
            "after",
        }
      );

    return NextResponse.json(
      updatedVideo
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