import { GoogleGenerativeAI } from '@google/generative-ai';
import { ReleasePackage } from '@/types';
import { AIResponse, validateAIResponse } from '@/lib/validation/aiResponseSchema';
import { buildReleaseContext, AI_SYSTEM_PROMPT } from './prompts';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('[AI] GEMINI_API_KEY is not set. AI analysis will fail.');
}

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
}

export type AIWorkflowResult =
  | {
      success: true;
      data: AIResponse;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Runs the AI analysis workflow.
 * 
 * 1. Builds structured context from release package
 * 2. Sends to Gemini with system prompt
 * 3. Parses JSON response
 * 4. Validates with Zod schema
 * 5. Returns typed result or controlled error
 * 
 * The AI CANNOT approve a release. That is a human-only action.
 */
export async function analyzeRelease(
  version: string,
  releasePackage: ReleasePackage,
  missingFields: string[]
): Promise<{ success: true; data: AIResponse } | { success: false; error: string }> {
  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
      systemInstruction: AI_SYSTEM_PROMPT,
    });

    const context = buildReleaseContext(version, releasePackage, missingFields);
    const userPrompt = `Analyze the following release package and return your analysis as JSON:\n\n${context}`;

    const result = await model.generateContent(userPrompt);
    const responseText = result.response.text();

    if (!responseText || responseText.trim().length === 0) {
      return { success: false, error: 'AI returned an empty response' };
    }

    // Parse JSON
    let parsed: unknown;
    try {
      // Strip markdown code blocks if present
      const cleaned = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return {
        success: false,
        error: 'AI returned invalid JSON. Please try again.',
      };
    }

    // Validate with Zod schema — NEVER trust raw AI output
    const validation = validateAIResponse(parsed);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    return { success: true, data: validation.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown AI error';

    if (message.includes('API_KEY')) {
      return { success: false, error: 'AI API key is not configured or invalid' };
    }
    if (message.includes('timeout') || message.includes('DEADLINE_EXCEEDED')) {
      return { success: false, error: 'AI request timed out. Please try again.' };
    }
    if (message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
      return { success: false, error: 'AI quota exceeded. Please try again later.' };
    }

    return { success: false, error: `AI analysis failed: ${message}` };
  }
}
