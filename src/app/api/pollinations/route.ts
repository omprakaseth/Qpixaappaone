import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, model, width, height, seed, nologo, enhance } = await req.json();
    const queryParams = new URLSearchParams({
      prompt,
      width: width?.toString() || '1024',
      height: height?.toString() || '1024',
      seed: seed?.toString() || Math.floor(Math.random() * 1000000).toString(),
      nologo: nologo ? 'true' : 'false',
      enhance: enhance ? 'true' : 'false',
      model: model || 'flux'
    });

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${queryParams.toString()}`;
    
    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error("Pollinations Proxy Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
