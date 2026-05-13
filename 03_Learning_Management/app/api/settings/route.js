// app/api/settings/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Setting from "@/models/Setting";

export async function GET() {
  try {
    await connectDB();
    const settings = await Setting.find();
    const map = {};
    settings.forEach((s) => { map[s.key] = s.value; });
    return NextResponse.json(map);
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json(); // { key, value }
    const setting = await Setting.findOneAndUpdate(
      { key: body.key },
      { value: body.value },
      { upsert: true, new: true }
    );
    return NextResponse.json(setting);
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}