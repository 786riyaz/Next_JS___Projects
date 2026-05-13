// app\api\priorities\[id]\route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Priority from "@/models/Priority";
import Video from "@/models/Video";

// ======================
// DELETE PRIORITY
// ======================
export async function DELETE(request, { params }) {
try {
await connectDB();
const { id } = await params;
await Priority.findByIdAndDelete(id);
return NextResponse.json({ success: true, message: "Priority deleted successfully" });
} catch (error) {
return NextResponse.json({ success: false, message: error.message }, { status: 500 });
}
}

// ======================
// UPDATE PRIORITY
// ======================
export async function PUT(request, { params }) {
try {
await connectDB();
const { id } = await params;
const body = await request.json();
const updatedPriority = await Priority.findByIdAndUpdate(id, body, { returnDocument: "after" });
// Sync new learnPriority to all videos with the same domain+topic
if (updatedPriority) {
await Video.updateMany(
{
domain: new RegExp(`^${updatedPriority.domain.trim()}$`, "i"),
topic:  new RegExp(`^${updatedPriority.topic.trim()}$`,  "i"),
},
{ priority: updatedPriority.learnPriority }
);
}
return NextResponse.json(updatedPriority);
} catch (error) {
return NextResponse.json({ success: false, message: error.message }, { status: 500 });
}
}