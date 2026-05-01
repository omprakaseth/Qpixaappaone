import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { modelId, inputs, options } = await req.json();
    const token = process.env.HUGGING_FACE_TOKEN;

    if (!token) {
      return NextResponse.json({ error: "HUGGING_FACE_TOKEN is not configured on the server." }, { status: 500 });
    }

    const response = await fetch(
      `https://router.huggingface.co/models/${modelId}`,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify({ 
          inputs,
          options: options || { wait_for_model: true }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText || "Hugging Face API error" }, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return NextResponse.json({ imageUrl: `data:${contentType};base64,${base64}` });
  } catch (error: any) {
    console.error("Hugging Face Proxy Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
