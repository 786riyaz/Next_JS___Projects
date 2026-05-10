import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";

import Priority from "@/models/Priority";


// ======================
// DELETE PRIORITY
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

    await Priority.findByIdAndDelete(
      id
    );

    return NextResponse.json({
      success: true,
      message:
        "Priority deleted successfully",
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
// UPDATE PRIORITY
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

    const updatedPriority =
      await Priority.findByIdAndUpdate(
        id,
        body,
        {
          returnDocument:
            "after",
        }
      );

    return NextResponse.json(
      updatedPriority
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