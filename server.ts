import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("Starting server in", process.env.NODE_ENV || "development", "mode");
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
  });

  // API Route for Hugging Face Proxy
  app.post("/api/hf", async (req, res) => {
    try {
      const { modelId, inputs, options } = req.body;
      const token = process.env.HUGGING_FACE_TOKEN;

      if (!token) {
        return res.status(500).json({ error: "HUGGING_FACE_TOKEN is not configured on the server." });
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
        return res.status(response.status).json({ error: errorText || "Hugging Face API error" });
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      res.json({ imageUrl: `data:${contentType};base64,${base64}` });
    } catch (error: any) {
      console.error("Hugging Face Proxy Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // API Route for Pollinations Proxy
  app.post("/api/pollinations", async (req, res) => {
    try {
      const { prompt, model, width, height, seed, nologo, enhance } = req.body;
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
      
      // We can just return the URL or fetch it to check if it's alive
      // For speed, let's just return the URL after light validation
      res.json({ imageUrl });
    } catch (error: any) {
      console.error("Pollinations Proxy Error:", error);
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

      if (type === 'text') {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: model || "gemini-3-flash-preview",
          contents: [{ parts: [{ text: prompt }] }]
        });
        return res.json({ text: response.text });
      }

      // For image generation, Gemini direct API with @google/genai doesn't support Imagen 3 yet in standard SDK easily
      // Usually it's Vertex AI. But if the user refers to text-to-image via a specific multimodal model, 
      // we handle it. However, most free 'Gemini' image gen is via Pollinations or HF anyway.
      // Let's implement a placeholder for text responses if they use it for enhancing prompts.
      res.status(400).json({ error: "Image generation via direct Gemini SDK is not yet supported in this proxy. Use Pollinations or Hugging Face." });
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
      appType: "custom", // Use custom to handle SPA manually
    });
    console.log("Vite dev server initialized.");
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
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
