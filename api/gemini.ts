import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GEMINI_API_KEY) {
    return res
      .status(500)
      .json({ error: 'GEMINI_API_KEY not configured in Vercel environment variables' });
  }

  try {
    const { model, contents, config, stream } = req.body;

    const endpoint = stream
      ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`
      : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: config?.systemInstruction
          ? { parts: [{ text: config.systemInstruction }] }
          : undefined,
        generationConfig: config?.responseMimeType
          ? { responseMimeType: config.responseMimeType }
          : undefined,
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('[API] Gemini error:', errorText);
      return res.status(geminiResponse.status).json({ error: errorText });
    }

    if (stream) {
      // Stream response back to client
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = geminiResponse.body?.getReader();
      if (!reader) {
        return res.status(500).json({ error: 'No response body' });
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
      }
      res.end();
    } else {
      const data = await geminiResponse.json();
      return res.status(200).json(data);
    }
  } catch (error: any) {
    console.error('[API] Proxy error:', error);
    return res.status(500).json({ error: error.message });
  }
}
