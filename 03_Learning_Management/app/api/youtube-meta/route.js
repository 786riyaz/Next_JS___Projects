// app/api/youtube-meta/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    // Normalize YouTube Shorts URL to a standard watch URL for oEmbed compatibility
    // oEmbed doesn't support /shorts/ URLs directly
    let normalizedUrl = url;
    const shortsMatch = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]+)/);
    if (shortsMatch) {
      normalizedUrl = `https://www.youtube.com/watch?v=${shortsMatch[1]}`;
    }

    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(normalizedUrl)}&format=json`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const data = await res.json();
    return NextResponse.json({ title: data.title, channel: data.author_name });
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}