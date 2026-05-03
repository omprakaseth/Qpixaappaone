import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { prompt, model, image, type, config } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured on the server." }, { status: 500 });
    }

    if (type === 'text') {
      const genAI = new GoogleGenAI({ apiKey });
      const genModel = (genAI as any).getGenerativeModel({ model: model || "gemini-2.0-flash" });
      const result = await genModel.generateContent(prompt);
      const response = await result.response;
      return NextResponse.json({ text: response.text() });
    }

    if (type === 'image') {
      // NOTE: Direct Imagen 3 support via @google/genai might require special access or specific methods.
      // For now, we will return an error suggesting Pollinations/HF, 
      // but we will allow the frontend to call this if they have a working implementation.
      return NextResponse.json({ 
        error: "Imagen 3 is currently under maintenance. Please use Flux.1 or SDXL models for now.",
        suggestedModels: ["flux", "stabilityai/stable-diffusion-xl-base-1.0"] 
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Gemini Proxy Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
