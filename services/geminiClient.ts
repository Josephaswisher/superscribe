/// <reference types="vite/client" />
import { GoogleGenAI } from '@google/genai';
import type { GeminiResponse } from '../types';

// --- MODEL DEFINITIONS ---
export const GEMINI_MODELS = {
  flash: 'gemini-3-flash-preview',
  pro: 'gemini-3-pro-preview',
} as const;

export type GeminiModelKey = keyof typeof GEMINI_MODELS;

export const MODEL_INFO: Record<GeminiModelKey, { name: string; description: string }> = {
  flash: {
    name: 'Gemini 3 Flash',
    description: 'Fast responses, great for quick documentation',
  },
  pro: {
    name: 'Gemini 3 Pro',
    description: 'Advanced reasoning for complex medical analysis',
  },
};

// --- CLIENT FACTORY ---
let geminiClient: GoogleGenAI | null = null;

// Fallback API key for personal use
const FALLBACK_API_KEY = 'AIzaSyCxzbB3cPk7_GCnzFPRUBfdP1zVnq7DNko';

export const getGeminiClient = (): GoogleGenAI => {
  if (geminiClient) return geminiClient;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || FALLBACK_API_KEY;
  geminiClient = new GoogleGenAI({ apiKey });
  return geminiClient;
};

export const isGeminiConfigured = (): boolean => {
  return !!(import.meta.env.VITE_GEMINI_API_KEY || FALLBACK_API_KEY);
};

// --- CONTENT GENERATION ---
interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export async function generateWithGemini(
  messages: GeminiMessage[],
  systemInstruction: string,
  modelKey: GeminiModelKey = 'flash',
  onChunk?: (text: string) => void
): Promise<GeminiResponse> {
  const ai = getGeminiClient();
  const modelId = GEMINI_MODELS[modelKey];

  console.log(`[Gemini] Generating with model: ${modelId}`);

  try {
    // Build the contents array with system instruction prepended
    const contents = messages.map(m => ({
      role: m.role,
      parts: m.parts,
    }));

    if (onChunk) {
      // Streaming mode
      const response = await ai.models.generateContentStream({
        model: modelId,
        contents,
        config: {
          systemInstruction,
        },
      });

      let accumulated = '';
      for await (const chunk of response) {
        const text = chunk.text || '';
        accumulated += text;
        onChunk(accumulated);
      }

      return parseGeminiResponse(accumulated);
    } else {
      // Non-streaming mode
      const response = await ai.models.generateContent({
        model: modelId,
        contents,
        config: {
          systemInstruction,
        },
      });

      const text = response.text || '';
      return parseGeminiResponse(text);
    }
  } catch (error: any) {
    console.error('[Gemini] Generation failed:', error);
    throw new Error(`Gemini API Error: ${error.message}`);
  }
}

// --- JSON GENERATION (for structured outputs) ---
export async function generateJsonWithGemini(
  messages: GeminiMessage[],
  systemInstruction: string,
  modelKey: GeminiModelKey = 'flash',
  onChunk?: (text: string) => void
): Promise<GeminiResponse> {
  const ai = getGeminiClient();
  const modelId = GEMINI_MODELS[modelKey];

  console.log(`[Gemini] Generating JSON with model: ${modelId}`);

  try {
    const contents = messages.map(m => ({
      role: m.role,
      parts: m.parts,
    }));

    // Add JSON instruction to system prompt
    const jsonSystemInstruction = `${systemInstruction}

CRITICAL: You MUST respond with valid JSON matching this schema:
{
  "conversationalResponse": "string - your chat response",
  "explanation": "string - brief explanation of changes",
  "updatedDocument": "string | null - full updated document or null if no changes"
}`;

    if (onChunk) {
      const response = await ai.models.generateContentStream({
        model: modelId,
        contents,
        config: {
          systemInstruction: jsonSystemInstruction,
          responseMimeType: 'application/json',
        },
      });

      let accumulated = '';
      for await (const chunk of response) {
        const text = chunk.text || '';
        accumulated += text;
        onChunk(accumulated);
      }

      return parseGeminiJsonResponse(accumulated);
    } else {
      const response = await ai.models.generateContent({
        model: modelId,
        contents,
        config: {
          systemInstruction: jsonSystemInstruction,
          responseMimeType: 'application/json',
        },
      });

      return parseGeminiJsonResponse(response.text || '{}');
    }
  } catch (error: any) {
    console.error('[Gemini] JSON generation failed:', error);
    throw new Error(`Gemini API Error: ${error.message}`);
  }
}

// --- RESPONSE PARSERS ---
function parseGeminiResponse(text: string): GeminiResponse {
  // Try to parse as JSON first
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
    // Return as plain text response
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
  const ai = getGeminiClient();
  const modelId = GEMINI_MODELS[modelKey];

  console.log(`[Gemini] Simple chat with model: ${modelId}`);

  const response = await ai.models.generateContent({
    model: modelId,
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction,
    },
  });

  return response.text || '';
}
