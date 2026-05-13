// app\api\videos\route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Video from "@/models/Video";
import Priority from "@/models/Priority";

// =========================
// GET ALL VIDEOS
// =========================
export async function GET() {
try {
await connectDB();
const [videos, priorities] = await Promise.all([
Video.find().sort({ priority: 1 }),
Priority.find(),
]);
// Build domain::topic → learnPriority map
const prioMap = {};
priorities.forEach((p) => {
if (p.domain && p.topic) prioMap[`${p.domain}::${p.topic}`] = p.learnPriority;
});
// Always return live priority derived from Priority collection
const merged = videos.map((v) => {
const obj = v.toObject();
const key = `${obj.domain || ""}::${obj.topic}`;
obj.priority = prioMap[key] ?? obj.priority ?? 0;
return obj;
});
return NextResponse.json(merged);
} catch (error) {
return NextResponse.json({ success: false, message: error.message }, { status: 500 });
}
}

// =========================
// CREATE VIDEO
// =========================
export async function POST(request) {
try {
await connectDB();
const body = await request.json();
// Never trust the priority sent from client — always derive from Priority collection
const priority = await getLivePriority(body.domain, body.topic);
const newVideo = await Video.create({ ...body, priority });
return NextResponse.json(newVideo);
} catch (error) {
return NextResponse.json({ success: false, message: error.message }, { status: 500 });
}
}

async function getLivePriority(domain, topic) {
if (!domain || !topic) return 0;
const p = await Priority.findOne({
domain: new RegExp(`^${domain.trim()}$`, "i"),
topic:  new RegExp(`^${topic.trim()}$`,  "i"),
});
return p?.learnPriority ?? 0;
}