import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("Starting server in", process.env.NODE_ENV || "development", "mode");
  const app = express();
  const PORT = 3000;

  // Security Middlewares
  app.set('trust proxy', 1);
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Debug Logging Middleware
  app.use("/api/", (req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
  });

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per minute (increased from 30)
    message: { error: "Too many requests, please try again later." }
  });
  app.use("/api/", limiter);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
  });

  // Reusable image gen logic to avoid localhost fetch loops
  async function generatePollinationsImage(prompt: string, model: string, width: number, height: number, seed: number, nologo: boolean, enhance: boolean) {
    const queryParams = new URLSearchParams({
      prompt,
      width: width.toString(),
      height: height.toString(),
      seed: seed.toString(),
      nologo: nologo ? 'true' : 'false',
      enhance: enhance ? 'true' : 'false',
      model: model || 'flux'
    });

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${queryParams.toString()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout
    
    try {
      const response = await fetch(imageUrl, { signal: controller.signal });
      if (!response.ok) throw new Error(`Pollinations returned ${response.status}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      return `data:${contentType};base64,${base64}`;
    } finally {
      clearTimeout(timeout);
    }
  }

  // API Route for Hugging Face Proxy
  app.post("/api/hf", async (req, res) => {
    try {
      const { modelId, inputs, options } = req.body;
      
      // Strict validation for modelId and inputs
      if (!modelId || typeof modelId !== 'string' || modelId.length > 255) {
        return res.status(400).json({ error: "Invalid modelId" });
      }
      if (!inputs || (typeof inputs !== 'string' && typeof inputs !== 'object')) {
        return res.status(400).json({ error: "Inputs are required and must be valid" });
      }

      const token = process.env.HF_TOKEN || process.env.HUGGING_FACE_TOKEN;
      if (!token) {
        return res.status(500).json({ error: "HF_TOKEN is not configured on the server." });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000); // 90s timeout for HF

      try {
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
            signal: controller.signal
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          return res.status(response.status).json({ error: errorText || "Hugging Face API error" });
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        res.json({ imageUrl: `data:${contentType};base64,${base64}` });
      } finally {
        clearTimeout(timeout);
      }
    } catch (error: any) {
      console.error("Hugging Face Proxy Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // API Route for Pollinations Proxy
  app.post("/api/pollinations", async (req, res) => {
    try {
      const { prompt, model, width, height, seed, nologo, enhance } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const imageUrl = await generatePollinationsImage(
        prompt, 
        model || 'flux', 
        width || 1024, 
        height || 1024, 
        seed || Math.floor(Math.random() * 1000000), 
        nologo, 
        enhance
      );

      res.json({ imageUrl });
    } catch (error: any) {
      console.error("Pollinations Proxy Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // API Route for Pollinations Text Proxy
  app.post("/api/pollinations/text", async (req, res) => {
    try {
      const { prompt, model } = req.body;
      if (!prompt) return res.status(400).json({ error: "Prompt is required" });

      const url = `https://text.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=${model || 'openai'}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch from Pollinations Text");
      
      const text = await response.text();
      res.json({ text });
    } catch (error: any) {
      console.error("Pollinations Text Proxy Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // API Route for Gemini Proxy
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, model, image, type, config } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      if (type === 'text') {
        const modelName = model || "gemini-1.5-flash";
        
        let contents: any[] = [];
        if (image) {
          const base64Data = image.split(',')[1];
          const mimeType = image.split(';')[0].split(':')[1] || 'image/png';
          contents = [
            {
              parts: [
                { inlineData: { data: base64Data, mimeType } },
                { text: prompt }
              ]
            }
          ];
        } else {
          contents = [{ parts: [{ text: prompt }] }];
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: config?.config
        });

        return res.json({ text: response.text });
      }

      // For image generation: Direct Google Gemini SDK doesn't support Imagen 3 easily yet.
      // We map "gemini-*-image" requests to our advanced Pollinations/HF models for the best results.
      console.log('Redirecting Gemini image request to internal generator for quality');
      try {
        const imageUrl = await generatePollinationsImage(
          prompt,
          'flux-realism', // Default to high-end flux for Gemini image requests
          1024,
          1024,
          Math.floor(Math.random() * 1000000),
          true,
          true
        );
        return res.json({ imageUrl });
      } catch (err: any) {
        return res.status(500).json({ error: "Could not fulfill image request via fallback: " + err.message });
      }
    } catch (error: any) {
      console.error("Gemini Proxy Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing Vite dev server...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    console.log("Vite dev server initialized.");
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
