/// <reference types="vite/client" />
import type { GeminiResponse } from '../types';

// --- MODEL DEFINITIONS ---
export const GEMINI_MODELS = {
  flash: 'gemini-2.0-flash',
  pro: 'gemini-1.5-pro',
} as const;

export type GeminiModelKey = keyof typeof GEMINI_MODELS;

export const MODEL_INFO: Record<GeminiModelKey, { name: string; description: string }> = {
  flash: {
    name: 'Gemini 2.0 Flash',
    description: 'Fast responses, great for quick documentation',
  },
  pro: {
    name: 'Gemini 1.5 Pro',
    description: 'Advanced reasoning for complex medical analysis',
  },
};

// --- PROXY CONFIGURATION ---
// Use deployed Vercel endpoint to bypass hospital network blocks
const PROXY_BASE_URL = import.meta.env.DEV 
  ? 'https://superscribe-emulation.vercel.app'
  : '';

const getProxyEndpoint = () => `${PROXY_BASE_URL}/api/gemini`;

export const isGeminiConfigured = (): boolean => true;

// --- PROXY CALL ---
interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

async function callGeminiProxy(
  model: string,
  contents: GeminiMessage[],
  config: { systemInstruction?: string; responseMimeType?: string }
): Promise<string> {
  const response = await fetch(getProxyEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, contents, config, stream: false }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 0 || errorText.includes('blocked') || errorText.includes('CORS')) {
      throw new Error('Network blocked: Your hospital network may be blocking API requests. Try:\n1. Switch to mobile hotspot\n2. Use hospital VPN if available\n3. Ask IT to whitelist *.vercel.app');
    }
    throw new Error(`API Error: ${errorText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// --- CONTENT GENERATION ---
export async function generateWithGemini(
  messages: GeminiMessage[],
  systemInstruction: string,
  modelKey: GeminiModelKey = 'flash',
  onChunk?: (text: string) => void
): Promise<GeminiResponse> {
  const modelId = GEMINI_MODELS[modelKey];
  console.log(`[Gemini] Generating with model: ${modelId} via proxy`);

  try {
    const contents = messages.map(m => ({ role: m.role, parts: m.parts }));
    const text = await callGeminiProxy(modelId, contents, { systemInstruction });
    
    if (onChunk) {
      onChunk(text);
    }
    
    return parseGeminiResponse(text);
  } catch (error: any) {
    console.error('[Gemini] Generation failed:', error);
    throw new Error(error.message || 'Gemini API Error');
  }
}

// --- JSON GENERATION (for structured outputs) ---
export async function generateJsonWithGemini(
  messages: GeminiMessage[],
  systemInstruction: string,
  modelKey: GeminiModelKey = 'flash',
  onChunk?: (text: string) => void
): Promise<GeminiResponse> {
  const modelId = GEMINI_MODELS[modelKey];
  console.log(`[Gemini] Generating JSON with model: ${modelId} via proxy`);

  try {
    const contents = messages.map(m => ({ role: m.role, parts: m.parts }));
    
    const jsonSystemInstruction = `${systemInstruction}

CRITICAL: You MUST respond with valid JSON matching this schema:
{
  "conversationalResponse": "string - your chat response",
  "explanation": "string - brief explanation of changes",
  "updatedDocument": "string | null - full updated document or null if no changes"
}`;

    const text = await callGeminiProxy(modelId, contents, { 
      systemInstruction: jsonSystemInstruction,
      responseMimeType: 'application/json'
    });
    
    if (onChunk) {
      onChunk(text);
    }
    
    return parseGeminiJsonResponse(text);
  } catch (error: any) {
    console.error('[Gemini] JSON generation failed:', error);
    throw new Error(error.message || 'Gemini API Error');
  }
}

// --- RESPONSE PARSERS ---
function parseGeminiResponse(text: string): GeminiResponse {
  try {
    const cleaned = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      text: parsed.conversationalResponse || parsed.text || text,
      explanation: parsed.explanation,
      updatedDocument: parsed.updatedDocument,
    };
  } catch {
    return { text };
  }
}

function parseGeminiJsonResponse(text: string): GeminiResponse {
  try {
    const cleaned = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      text: parsed.conversationalResponse || '',
      explanation: parsed.explanation || '',
      updatedDocument: parsed.updatedDocument ?? null,
    };
  } catch (e) {
    console.warn('[Gemini] JSON parse failed, returning raw text:', e);
    return {
      text,
      explanation: '(Raw output - JSON parse failed)',
      updatedDocument: null,
    };
  }
}

// --- SIMPLE CHAT (for proofreading, handoff, etc.) ---
export async function chatWithGemini(
  userPrompt: string,
  systemInstruction: string,
  modelKey: GeminiModelKey = 'flash'
): Promise<string> {
  const modelId = GEMINI_MODELS[modelKey];
  console.log(`[Gemini] Simple chat with model: ${modelId} via proxy`);

  const contents = [{ role: 'user' as const, parts: [{ text: userPrompt }] }];
  return callGeminiProxy(modelId, contents, { systemInstruction });
}
