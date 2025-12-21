/// <reference types="vite/client" />
import { Message, Role, GeminiResponse, DocumentTemplate, Attachment } from "../types";

// --- CLIENT FACTORY ---
// (DeepSeek key getter removed - using OpenRouter)

// --- TYPES ---

interface IntentResult {
    command: string;
    reason: string;
}

// --- CONSTANTS ---

const ROUTER_SYSTEM_INSTRUCTION = `
You are an intent router for a medical documentation assistant.
Classify the user’s request into exactly one of these commands:
- poc – wants a problem - oriented Assessment & Plan.
- progress – wants a full or partial daily progress note.
- labs – wants lab summarization or interpretation.
- plan – wants a focused plan for a specific problem.
- census - wants to add a list of patients or a census(multiple names / rooms) to the document.
- none – anything else (general conversation, simple edits, clarifications, medical questions).

Also extract a brief \`reason\` describing why you chose that command.

Respond ONLY with a single JSON object.
`;

// --- CONFIGURATION ---
const getOpenRouterKey = () => {
    // OpenRouter Key
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
        console.warn("VITE_OPENROUTER_API_KEY is missing.");
    }
    return apiKey;
};

const INTENT_MAPPINGS: Record<string, string> = {
    poc: "TASK: Reformulate the input/context into a concise, problem-oriented Assessment and Plan. Group by '# Problem'. Focus on active issues.",
    progress: "TASK: Draft a daily progress note update. Focus on overnight events, new objective data (labs/vitals), and plan updates.",
    labs: "TASK: Analyze and summarize the provided lab values. Highlight critical abnormalities (bold them) and significant trends (use arrows ↗↘). Do not list normal values unless relevant.",
    plan: "TASK: Create a focused, actionable plan for a specific problem mentioned. Use 'If/Then' contingencies and specific targets.",
    census: "TASK: The user has provided a patient list or census. Create a new, distinct entry for EACH patient mentioned. Use the available details (Name, Room, Age, Reason) to populate the Header and a brief Assessment. Leave missing sections (HPI, Exam, Labs) as '[Pending]' or blank placeholders. Do NOT refuse to generate the document. Create skeleton entries.",
    none: ""
};

// --- DEEPSEEK HELPERS ---

async function callDeepSeekJSON(messages: any[], systemInstruction: string): Promise<any> {
    const apiKey = getOpenRouterKey();
    if (!apiKey) throw new Error("OpenRouter API Key not configured");

    console.log("[OpenRouter] Fetching /api/deepseek/chat/completions (model: deepseek/deepseek-chat)");

    const response = await fetch("/api/deepseek/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "http://localhost:3006", // Required by OpenRouter
            "X-Title": "SuperScribe Emulation"       // Optional
        },
        body: JSON.stringify({
            model: "deepseek/deepseek-chat", // OpenRouter Model ID
            messages: [
                { role: "system", content: systemInstruction },
                ...messages
            ],
            response_format: { type: "json_object" },
            temperature: 0.1
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`DeepSeek API Error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    try {
        return JSON.parse(content);
    } catch (e) {
        console.warn("DeepSeek JSON parse failed", content);
        return {};
    }
}

async function callDeepSeekChat(messages: any[], systemInstruction: string, temperature = 0.7, model = "deepseek/deepseek-chat"): Promise<string> {
    const apiKey = getOpenRouterKey();
    if (!apiKey) throw new Error("OpenRouter API Key not configured");

    console.log(`[OpenRouter] Fetching Chat (model: ${model})`);

    const response = await fetch("/api/deepseek/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "http://localhost:3006",
            "X-Title": "SuperScribe Emulation"
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: "system", content: systemInstruction },
                ...messages
            ],
            temperature: temperature,
            stream: false
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`DeepSeek API Error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// --- CORE FUNCTIONS ---

const classifyUserIntent = async (text: string): Promise<IntentResult> => {
    try {
        const dsKey = getOpenRouterKey();
        if (!dsKey) throw new Error("OpenRouter API Key missing");

        try {
            const result = await callDeepSeekJSON(
                [{ role: "user", content: text }],
                ROUTER_SYSTEM_INSTRUCTION
            );
            return {
                command: result.command || 'none',
                reason: result.reason || 'deepseek router'
            };
        } catch (dsError) {
            console.warn("Router (DeepSeek) failed:", dsError);
            return { command: 'none', reason: 'error' };
        }
    } catch (e) {
        console.warn("Intent classification failed:", e);
        return { command: 'none', reason: 'error' };
    }
};

const buildSystemInstruction = (currentDocumentContext: string, activeTemplate: DocumentTemplate) => {
    const styleInstruction = activeTemplate.styleGuide
        ? `\n    ### 🚨 CRITICAL STYLE & PERSONA RULES 🚨\n    You are acting as a specific "Scribe Persona". You must NOT write like a generic AI. \n    ${activeTemplate.styleGuide}`
        : `\n    ### STYLE GUIDE\n    - Use professional medical terminology.\n    - Be concise.`;

    return `
    You are "SuperScribe", an expert AI medical scribe and clinical assistant for a hospitalist.
    Your identity is Dr. Joey Swisher's AI documentation partner.

    ### CORE OBJECTIVES
    1. **Fast, Precise, Clinically Intelligent Notes**: Reflect real attending physician thinking.
    2. **Minimal Diff Philosophy**: Preserve existing text ruthlessly.
    3. **Context Snapshot Awareness**: Always capture and prioritize the user's immediate focus.
    4. **Task Management**: Automatically extract actionable items into a "- [ ] Task" format.

    ### CURRENT DOCUMENT CONTEXT
    """
    ${currentDocumentContext}
    """

    ### RULES FOR DOCUMENT GENERATION
    1. **Full Regeneration**: You MUST return the ENTIRE document content.
    2. **Minimal Diff**: Do NOT rephrase parts of the document that were not modified.
    3. **Data Integrity**: NEVER hallucinate.
    4. **Formatting**: Each patient MUST start with a header "### [Number]. [Name]".
    5. **Hard Numbers**: Only use hard numbers for critical values.

    ### NEW ADVANCED OUTPUT FEATURES (SuperScribe PRO Enhancements):
    - **Semantic Bolding**: Bold critical labs.
    - **Trend Indicators**: Use arrows ↗↘.
    - **One-Liner 'TL;DR'**: Start Assessment with **TL;DR:**.
    - **Medication-Indication Linking**: Link meds to problems.

    ${styleInstruction}

    ### TARGET TEMPLATE STRUCTURE
    """
    ${activeTemplate.structure}
    """

    ### RESPONSE FORMAT
    You must always respond in JSON with:
    {
      "conversationalResponse": "string",
      "explanation": "string",
      "updatedDocument": "string | null"
    }
    `;
};

// --- HELPER: STREAMING GENERATORS ---

async function generateWithDeepSeek(
    messages: any[],
    systemInstruction: string,
    isReasoning: boolean,
    onChunk?: (text: string) => void
): Promise<any> {
    const apiKey = getOpenRouterKey();
    if (!apiKey) throw new Error("OpenRouter API Key not configured");

    const model = isReasoning ? "deepseek/deepseek-r1" : "deepseek/deepseek-chat";

    // Adjust system instruction for R1 if needed
    let effectiveSystem = systemInstruction;
    if (!isReasoning) {
        effectiveSystem += "\n\nCRITICAL: You MUST respond with valid JSON matching the schema.";
    } else {
        effectiveSystem += "\n\nCRITICAL: Respond ONLY with a JSON object wrapped in ```json ... ```.";
    }

    console.log(`[OpenRouter] Streaming (model: ${model})`);

    const response = await fetch("/api/deepseek/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "http://localhost:3006",
            "X-Title": "SuperScribe Emulation"
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: "system", content: effectiveSystem },
                ...messages
            ],
            stream: true,
            temperature: isReasoning ? 0.6 : 0.1
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`DeepSeek API Error: ${response.status} ${errText}`);
    }

    if (!response.body) throw new Error("No response body for streaming");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                    const data = JSON.parse(line.slice(6));
                    const delta = data.choices[(0)].delta.content || "";
                    if (delta) {
                        accumulatedText += delta;
                        if (onChunk) onChunk(accumulatedText);
                    }
                } catch (e) { }
            }
        }
    }

    const cleanJson = (accumulatedText || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
    try {
        return JSON.parse(cleanJson);
    } catch (e) {
        return {
            conversationalResponse: accumulatedText,
            explanation: `(Raw Output) ${isReasoning ? 'R1' : 'DeepSeek'}`,
            updatedDocument: null
        };
    }
}

// --- REFACTORED SEND MESSAGE (DEEPSEEK ONLY) ---

export const sendMessageToAI = async (
    history: Message[],
    newMessage: string,
    attachments: Attachment[],
    currentDocumentContext: string,
    activeTemplate: DocumentTemplate,
    isReasoning: boolean = false,
    onChunk?: (text: string) => void
): Promise<GeminiResponse> => {

    // 1. Classify Intent
    const { command, reason } = await classifyUserIntent(newMessage);
    const intentInstruction = INTENT_MAPPINGS[command];
    const finalPrompt = `${intentInstruction ? `[COMMAND: ${command.toUpperCase()}]\n${intentInstruction}\n\n` : ''}${newMessage}`;

    // 2. Build System Instruction
    const systemInstruction = buildSystemInstruction(currentDocumentContext, activeTemplate);

    // 3. Prepare DeepSeek Messages
    const deepseekMessages = [
        ...history.filter(m => !m.isInternal).map(m => ({ role: m.role === Role.USER ? 'user' : 'assistant', content: m.text })),
        { role: 'user', content: finalPrompt }
    ];

    // 4. Execution (DeepSeek Only)
    try {
        const result = await generateWithDeepSeek(deepseekMessages, systemInstruction, isReasoning, onChunk);
        return {
            text: result.conversationalResponse,
            explanation: `${reason}. ${result.explanation}`,
            updatedDocument: result.updatedDocument
        };
    } catch (err: any) {
        console.error("DeepSeek failed:", err);
        if (onChunk) onChunk(`⚠️ System Error: DeepSeek failed. ${err.message}`);
        return { text: `System Error: DeepSeek failed. ${err.message}` };
    }
};

export const proofreadWithPro = async (content: string, template: DocumentTemplate): Promise<string> => {
    const systemInstruction = `You are a meticulous medical proofreader. Your only job is to correct grammar, spelling, formatting, and ensure the document strictly adheres to the provided style guide. DO NOT add new clinical information. Preserve the existing content as much as possible.\n\n ${template.styleGuide}`;
    const userPrompt = `Proofread and format this document:\n\n---\n\n${content}`;

    try {
        return await callDeepSeekChat([{ role: "user", content: userPrompt }], systemInstruction, 0.1);
    } catch (e) {
        console.error("Proofreading failed:", e);
        return `Error: Could not proofread the document.`;
    }
};

export const generateHandoff = async (content: string): Promise<string> => {
    const systemInstruction = "You are a hospitalist creating a sign-out document. Your task is to synthesize the provided patient notes into a concise, action-oriented handoff list for the covering night team. Focus on active issues, overnight to-dos, and specific 'if-then' contingency plans. Use the Sign-Out template format. Be brief and direct.";
    const userPrompt = `Generate a handoff from these notes:\n\n${content}`;

    try {
        return await callDeepSeekChat([{ role: "user", content: userPrompt }], systemInstruction, 0.5);
    } catch (e) {
        console.error("Handoff generation failed:", e);
        return "Error generating handoff.";
    }
};
