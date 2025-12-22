/// <reference types="vite/client" />
import { Message, Role, GeminiResponse, DocumentTemplate, Attachment } from '../types';
import {
  generateJsonWithGemini,
  chatWithGemini,
  isGeminiConfigured,
  type GeminiModelKey,
} from './geminiClient';

// --- TYPES ---

export type AIProvider = 'gemini-flash' | 'gemini-pro' | 'deepseek';

export interface AIModelConfig {
  id: AIProvider;
  name: string;
  description: string;
  provider: 'gemini' | 'openrouter';
}

export const AI_MODELS: AIModelConfig[] = [
  {
    id: 'gemini-flash',
    name: 'Gemini 3 Flash',
    description: 'Fast responses, great for quick documentation',
    provider: 'gemini',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini 3 Pro',
    description: 'Advanced reasoning for complex medical analysis',
    provider: 'gemini',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Alternative model via OpenRouter',
    provider: 'openrouter',
  },
];

interface IntentResult {
  command: string;
  reason: string;
}

// --- CONSTANTS ---

const ROUTER_SYSTEM_INSTRUCTION = `
You are an intent router for a medical documentation assistant.
Classify the user's request into exactly one of these commands:
- rounds – wants a concise rounding summary or one-liner for presenting to attending.
- poc – wants a problem-oriented Assessment & Plan.
- progress – wants a full or partial daily progress note.
- labs – wants lab summarization or interpretation.
- plan – wants a focused plan for a specific problem.
- census – wants to add a list of patients or a census (multiple names/rooms) to the document.
- summary – wants a TL;DR or quick synthesis of the patient.
- none – anything else (general conversation, simple edits, clarifications, medical questions).

Also extract a brief \`reason\` describing why you chose that command.

Respond ONLY with a single JSON object.
`;

const INTENT_MAPPINGS: Record<string, string> = {
  rounds: `TASK: Generate a CONCISE rounding summary like a resident presenting to an attending.
FORMAT:
- Start with a punchy TL;DR one-liner (<15 words) capturing diagnosis + trajectory
- Include: Overnight events (1 line), Key abnormal data only, Active problems with TODAY's plan
- End with Dispo + Barriers
- Use arrows (↗↘→) for trends
- NO fluff phrases like "continue to monitor" or "patient tolerated well"
- Be specific: "Cr 1.8→1.4↘" not "improving kidney function"`,
  poc: 'TASK: Reformulate the input/context into a concise, problem-oriented Assessment and Plan. Group by "# Problem". Focus on active issues. Start each problem with status + action + rationale.',
  progress:
    'TASK: Draft a daily progress note update. Focus on overnight events, new objective data (labs/vitals), and plan updates. Be concise - fragments OK.',
  labs: 'TASK: Analyze and summarize the provided lab values. Highlight critical abnormalities (bold them) and significant trends (use arrows ↗↘). Skip normal values. Group by system if multiple.',
  plan: 'TASK: Create a focused, actionable plan for a specific problem mentioned. Use "If/Then" contingencies and specific targets. Include drug doses.',
  summary: `TASK: Generate a quick TL;DR synthesis of this patient in 1-2 sentences. Format: "[Age][Sex] with [key PMH] admitted for [diagnosis], [current status/trajectory]." Be punchy and clinical.`,
  census:
    'TASK: The user has provided a patient list or census. Create a new, distinct entry for EACH patient mentioned. Use the available details (Name, Room, Age, Reason) to populate the Header and a brief Assessment. Leave missing sections (HPI, Exam, Labs) as "[Pending]" or blank placeholders. Do NOT refuse to generate the document. Create skeleton entries.',
  none: '',
};

// --- OPENROUTER/DEEPSEEK CONFIGURATION ---

const getOpenRouterKey = () => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn('VITE_OPENROUTER_API_KEY is missing.');
  }
  return apiKey;
};

export const isDeepSeekConfigured = (): boolean => {
  return !!getOpenRouterKey();
};

// --- DEEPSEEK HELPERS ---

async function callDeepSeekJSON(messages: any[], systemInstruction: string): Promise<any> {
  const apiKey = getOpenRouterKey();
  if (!apiKey) throw new Error('OpenRouter API Key not configured');

  console.log(
    '[OpenRouter] Fetching /api/deepseek/chat/completions (model: deepseek/deepseek-chat)'
  );

  const response = await fetch('/api/deepseek/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3006',
      'X-Title': 'SuperScribe Emulation',
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat',
      messages: [{ role: 'system', content: systemInstruction }, ...messages],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek API Error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  try {
    return JSON.parse(content);
  } catch {
    console.warn('DeepSeek JSON parse failed', content);
    return {};
  }
}

async function callDeepSeekChat(
  messages: any[],
  systemInstruction: string,
  temperature = 0.7,
  model = 'deepseek/deepseek-chat'
): Promise<string> {
  const apiKey = getOpenRouterKey();
  if (!apiKey) throw new Error('OpenRouter API Key not configured');

  console.log(`[OpenRouter] Fetching Chat (model: ${model})`);

  const response = await fetch('/api/deepseek/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3006',
      'X-Title': 'SuperScribe Emulation',
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'system', content: systemInstruction }, ...messages],
      temperature: temperature,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek API Error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateWithDeepSeek(
  messages: any[],
  systemInstruction: string,
  isReasoning: boolean,
  onChunk?: (text: string) => void
): Promise<any> {
  const apiKey = getOpenRouterKey();
  if (!apiKey) throw new Error('OpenRouter API Key not configured');

  const model = isReasoning ? 'deepseek/deepseek-r1' : 'deepseek/deepseek-chat';

  let effectiveSystem = systemInstruction;
  if (!isReasoning) {
    effectiveSystem += '\n\nCRITICAL: You MUST respond with valid JSON matching the schema.';
  } else {
    effectiveSystem += '\n\nCRITICAL: Respond ONLY with a JSON object wrapped in ```json ... ```.';
  }

  console.log(`[OpenRouter] Streaming (model: ${model})`);

  const response = await fetch('/api/deepseek/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3006',
      'X-Title': 'SuperScribe Emulation',
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'system', content: effectiveSystem }, ...messages],
      stream: true,
      temperature: isReasoning ? 0.6 : 0.1,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek API Error: ${response.status} ${errText}`);
  }

  if (!response.body) throw new Error('No response body for streaming');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulatedText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6));
          const delta = data.choices[0].delta.content || '';
          if (delta) {
            accumulatedText += delta;
            if (onChunk) onChunk(accumulatedText);
          }
        } catch {
          // Ignore parse errors for incomplete chunks
        }
      }
    }
  }

  const cleanJson = (accumulatedText || '{}')
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();
  try {
    return JSON.parse(cleanJson);
  } catch {
    return {
      conversationalResponse: accumulatedText,
      explanation: `(Raw Output) ${isReasoning ? 'R1' : 'DeepSeek'}`,
      updatedDocument: null,
    };
  }
}

// --- INTENT CLASSIFICATION ---

const classifyUserIntent = async (text: string, provider: AIProvider): Promise<IntentResult> => {
  try {
    // Use Gemini for intent classification if available, otherwise DeepSeek
    if (provider.startsWith('gemini') && isGeminiConfigured()) {
      try {
        const response = await chatWithGemini(
          `Classify this request and respond with JSON only: ${text}`,
          ROUTER_SYSTEM_INSTRUCTION,
          'flash'
        );
        const parsed = JSON.parse(response);
        return {
          command: parsed.command || 'none',
          reason: parsed.reason || 'gemini router',
        };
      } catch (geminiError) {
        console.warn('Router (Gemini) failed:', geminiError);
      }
    }

    // Fallback to DeepSeek
    if (isDeepSeekConfigured()) {
      const result = await callDeepSeekJSON(
        [{ role: 'user', content: text }],
        ROUTER_SYSTEM_INSTRUCTION
      );
      return {
        command: result.command || 'none',
        reason: result.reason || 'deepseek router',
      };
    }

    return { command: 'none', reason: 'no provider available' };
  } catch (e) {
    console.warn('Intent classification failed:', e);
    return { command: 'none', reason: 'error' };
  }
};

// --- SYSTEM INSTRUCTION BUILDER ---

const buildSystemInstruction = (
  currentDocumentContext: string,
  activeTemplate: DocumentTemplate
) => {
  const styleInstruction = activeTemplate.styleGuide
    ? `\n### CRITICAL STYLE & PERSONA RULES\nYou are acting as a specific "Scribe Persona". You must NOT write like a generic AI.\n${activeTemplate.styleGuide}`
    : `\n### STYLE GUIDE\n- Use professional medical terminology.\n- Be concise.`;

  return `
You are "SuperScribe", an expert AI medical scribe trained by hospitalists. You write like a PHYSICIAN, not an AI.

### PHYSICIAN WRITING STYLE (CRITICAL)
- **Be terse**: Use fragments. "Stable overnight. Cr improving." NOT "The patient remained stable..."
- **Lead with synthesis**: "Sepsis improving on abx" NOT "65yo M with history of diabetes..."
- **Specifics over vague**: "Cr 1.8→1.4" NOT "kidney function improving"
- **Action over observation**: "Repeat BMP AM" NOT "will continue to monitor"
- **Arrows for trends**: ↗ up, ↘ down, → stable
- **Bold abnormals**: **K 5.8**, **Cr 2.1**

### FORBIDDEN PHRASES (Never use these)
- "continue current management" → list specific meds
- "will monitor" → specify what/when (e.g., "lactates q4h")
- "patient tolerated well" → delete or be specific
- "stable" alone → add context ("hemodynamically stable", "afebrile")
- "as needed" → specify parameters

### OUTPUT RULES
1. **Chat-only** (questions, clarifications): Set "updatedDocument": null
2. **Document edits**: Return ONLY modified content, keep existing unchanged
3. **New patient**: Clean skeleton, placeholders for missing data
4. **Rounding summary**: TL;DR first, then overnight, key data, plan by problem, dispo

### CURRENT DOCUMENT
"""
${currentDocumentContext || '(Empty - ready for new content)'}
"""

### FORMATTING
- Headers: '### [Initials] — [Room]' (required for indexing)
- Problems: #1, #2 (no bold on numbers)
- Plans: Bullet points, not paragraphs
- Labs: Table or inline with units

${styleInstruction}

### TEMPLATE REFERENCE
${activeTemplate.structure}

### JSON RESPONSE FORMAT
{
  "conversationalResponse": "Brief response",
  "explanation": "1 sentence max",
  "updatedDocument": "Full doc with changes, or null"
}
`;
};

// --- MAIN SEND MESSAGE FUNCTION (MULTI-PROVIDER) ---

export const sendMessageToAI = async (
  history: Message[],
  newMessage: string,
  _attachments: Attachment[],
  currentDocumentContext: string,
  activeTemplate: DocumentTemplate,
  isReasoning: boolean = false,
  onChunk?: (text: string) => void,
  selectedModel: AIProvider = 'gemini-flash'
): Promise<GeminiResponse> => {
  // 1. Classify Intent
  const { command, reason } = await classifyUserIntent(newMessage, selectedModel);
  const intentInstruction = INTENT_MAPPINGS[command];
  const finalPrompt = `${intentInstruction ? `[COMMAND: ${command.toUpperCase()}]\n${intentInstruction}\n\n` : ''}${newMessage}`;

  // 2. Build System Instruction
  const systemInstruction = buildSystemInstruction(currentDocumentContext, activeTemplate);

  // 3. Route to appropriate provider
  const modelConfig = AI_MODELS.find(m => m.id === selectedModel);

  if (modelConfig?.provider === 'gemini' && isGeminiConfigured()) {
    // --- GEMINI PATH ---
    console.log(`[AI Service] Using Gemini provider: ${selectedModel}`);

    const geminiModelKey: GeminiModelKey = selectedModel === 'gemini-pro' ? 'pro' : 'flash';

    const geminiMessages = [
      ...history
        .filter(m => !m.isInternal)
        .map(m => ({
          role: (m.role === Role.USER ? 'user' : 'model') as 'user' | 'model',
          parts: [{ text: m.text }],
        })),
      { role: 'user' as const, parts: [{ text: finalPrompt }] },
    ];

    try {
      const result = await generateJsonWithGemini(
        geminiMessages,
        systemInstruction,
        geminiModelKey,
        onChunk
      );
      return {
        text: result.text,
        explanation: `${reason}. ${result.explanation || ''}`,
        updatedDocument: result.updatedDocument,
      };
    } catch (err: any) {
      console.error('Gemini failed:', err);
      if (onChunk) onChunk(`⚠️ Gemini Error: ${err.message}`);
      return { text: `Gemini Error: ${err.message}` };
    }
  } else {
    // --- DEEPSEEK PATH (OpenRouter) ---
    console.log('[AI Service] Using DeepSeek provider via OpenRouter');

    const deepseekMessages = [
      ...history
        .filter(m => !m.isInternal)
        .map(m => ({
          role: m.role === Role.USER ? 'user' : 'assistant',
          content: m.text,
        })),
      { role: 'user', content: finalPrompt },
    ];

    try {
      const result = await generateWithDeepSeek(
        deepseekMessages,
        systemInstruction,
        isReasoning,
        onChunk
      );
      return {
        text: result.conversationalResponse,
        explanation: `${reason}. ${result.explanation}`,
        updatedDocument: result.updatedDocument,
      };
    } catch (err: any) {
      console.error('DeepSeek failed:', err);
      if (onChunk) onChunk(`⚠️ DeepSeek Error: ${err.message}`);
      return { text: `DeepSeek Error: ${err.message}` };
    }
  }
};

// --- UTILITY FUNCTIONS ---

export const proofreadWithPro = async (
  content: string,
  template: DocumentTemplate,
  selectedModel: AIProvider = 'gemini-flash'
): Promise<string> => {
  const systemInstruction = `You are a meticulous medical proofreader. Your only job is to correct grammar, spelling, formatting, and ensure the document strictly adheres to the provided style guide. DO NOT add new clinical information. Preserve the existing content as much as possible.\n\n${template.styleGuide}`;
  const userPrompt = `Proofread and format this document:\n\n---\n\n${content}`;

  try {
    if (selectedModel.startsWith('gemini') && isGeminiConfigured()) {
      const geminiModelKey: GeminiModelKey = selectedModel === 'gemini-pro' ? 'pro' : 'flash';
      return await chatWithGemini(userPrompt, systemInstruction, geminiModelKey);
    }
    return await callDeepSeekChat([{ role: 'user', content: userPrompt }], systemInstruction, 0.1);
  } catch (e) {
    console.error('Proofreading failed:', e);
    return `Error: Could not proofread the document.`;
  }
};

export const generateHandoff = async (
  content: string,
  selectedModel: AIProvider = 'gemini-flash'
): Promise<string> => {
  const systemInstruction =
    'You are a hospitalist creating a sign-out document. Your task is to synthesize the provided patient notes into a concise, action-oriented handoff list for the covering night team. Focus on active issues, overnight to-dos, and specific "if-then" contingency plans. Use the Sign-Out template format. Be brief and direct.';
  const userPrompt = `Generate a handoff from these notes:\n\n${content}`;

  try {
    if (selectedModel.startsWith('gemini') && isGeminiConfigured()) {
      const geminiModelKey: GeminiModelKey = selectedModel === 'gemini-pro' ? 'pro' : 'flash';
      return await chatWithGemini(userPrompt, systemInstruction, geminiModelKey);
    }
    return await callDeepSeekChat([{ role: 'user', content: userPrompt }], systemInstruction, 0.5);
  } catch (e) {
    console.error('Handoff generation failed:', e);
    return 'Error generating handoff.';
  }
};

// --- PROVIDER AVAILABILITY ---

export const getAvailableModels = (): AIModelConfig[] => {
  return AI_MODELS.filter(model => {
    if (model.provider === 'gemini') return isGeminiConfigured();
    if (model.provider === 'openrouter') return isDeepSeekConfigured();
    return false;
  });
};

export const getDefaultModel = (): AIProvider => {
  if (isGeminiConfigured()) return 'gemini-flash';
  if (isDeepSeekConfigured()) return 'deepseek';
  return 'gemini-flash'; // Default even if not configured
};
