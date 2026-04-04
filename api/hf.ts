export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { modelId, inputs, options } = req.body;
    const token = process.env.HUGGING_FACE_TOKEN;

    if (!token) {
      return res.status(500).json({ error: "HUGGING_FACE_TOKEN is not configured on the server." });
    }

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${modelId}`,
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

    // Hugging Face returns the image as binary data
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    res.json({ imageUrl: `data:${contentType};base64,${base64}` });
  } catch (error: any) {
    console.error("Hugging Face Proxy Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
