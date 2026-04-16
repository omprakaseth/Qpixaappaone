export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, model, width, height, seed, nologo, enhance } = req.body;
    
    const baseUrl = "https://image.pollinations.ai/prompt/";
    const params = new URLSearchParams();
    
    if (seed) params.append('seed', seed.toString());
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    if (nologo) params.append('nologo', 'true');
    if (enhance) params.append('enhance', 'true');
    if (model && model !== 'pollinations') params.append('model', model);

    const url = `${baseUrl}${encodeURIComponent(prompt)}?${params.toString()}`;
    
    console.log(`Calling Pollinations: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Pollinations API error: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    res.json({ imageUrl: `data:${contentType};base64,${base64}` });
  } catch (error: any) {
    console.error("Pollinations Proxy Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
