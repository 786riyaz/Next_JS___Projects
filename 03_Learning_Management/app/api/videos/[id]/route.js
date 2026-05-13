// app\api\videos\[id]\route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Video from "@/models/Video";
import Priority from "@/models/Priority";

async function getLivePriority(domain, topic) {
if (!domain || !topic) return 0;
const p = await Priority.findOne({
domain: new RegExp(`^${domain.trim()}$`, "i"),
topic:  new RegExp(`^${topic.trim()}$`,  "i"),
});
return p?.learnPriority ?? 0;
}

// ======================
// DELETE VIDEO
// ======================
export async function DELETE(request, { params }) {
try {
await connectDB();
const { id } = await params;
await Video.findByIdAndDelete(id);
return NextResponse.json({ success: true, message: "Video deleted successfully" });
} catch (error) {
return NextResponse.json({ success: false, message: error.message }, { status: 500 });
}
}

// ======================
// UPDATE VIDEO
// ======================
export async function PUT(request, { params }) {
try {
await connectDB();
const { id } = await params;
const body = await request.json();
// Always re-derive priority from Priority collection — ignore client-sent value
const priority = await getLivePriority(body.domain, body.topic);
const updatedVideo = await Video.findByIdAndUpdate(
id,
{ ...body, priority },
{ returnDocument: "after" }
);
return NextResponse.json(updatedVideo);
} catch (error) {
return NextResponse.json({ success: false, message: error.message }, { status: 500 });
}
}