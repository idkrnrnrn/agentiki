import type { z } from "zod";
import {
  CandidateProfileSchema,
  CandidateSignalsSchema,
  ScreeningQuestionsSchema,
  parseWithSchema,
  toGeminiJsonSchema
} from "./schemas.ts";
import {
  candidateSignalsPrompt,
  parseResumePrompt,
  screeningQuestionsPrompt
} from "./prompts.ts";
import {
  createMockCandidateProfile,
  createMockCandidateSignals,
  createMockQuestions,
  neutralCandidateReply
} from "./mock.ts";
import type {
  CandidateAnswer,
  CandidateProfile,
  CandidateSignals,
  ScreeningQuestion,
  Vacancy
} from "./types.ts";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export class GeminiValidationError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "GeminiValidationError";
  }
}

async function generateValidatedJson<T>({
  prompt,
  schema,
  label
}: {
  prompt: string;
  schema: z.ZodType<T>;
  label: string;
}): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await fetch(`${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema: toGeminiJsonSchema(schema),
        thinkingConfig: {
          thinkingLevel: "low"
        }
      }
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${details}`);
  }

  const payload = await response.json();
  const text = extractText(payload);

  try {
    const raw = parseJsonText(text);
    return parseWithSchema(schema, raw, label);
  } catch (error) {
    console.error(`${label} invalid Gemini JSON`, error, text.slice(0, 600));
    throw new GeminiValidationError(`${label}: Gemini вернул невалидный JSON`, error);
  }
}

export async function parseResumeWithGemini(pdfText: string): Promise<CandidateProfile> {
  if (!process.env.GEMINI_API_KEY) {
    return createMockCandidateProfile(pdfText);
  }

  return generateValidatedJson({
    prompt: parseResumePrompt(pdfText),
    schema: CandidateProfileSchema,
    label: "CandidateProfile"
  });
}

export async function generateScreeningQuestions(
  vacancy: Vacancy,
  profile: CandidateProfile
): Promise<ScreeningQuestion[]> {
  if (!process.env.GEMINI_API_KEY) {
    return createMockQuestions(vacancy, profile);
  }

  return generateValidatedJson({
    prompt: screeningQuestionsPrompt(vacancy, profile),
    schema: ScreeningQuestionsSchema,
    label: "ScreeningQuestion[]"
  });
}

export async function extractCandidateSignals(
  vacancy: Vacancy,
  profile: CandidateProfile,
  answers: CandidateAnswer[]
): Promise<CandidateSignals> {
  if (!process.env.GEMINI_API_KEY) {
    return createMockCandidateSignals(vacancy, profile, answers);
  }

  const signals = await generateValidatedJson({
    prompt: candidateSignalsPrompt(vacancy, profile, answers),
    schema: CandidateSignalsSchema,
    label: "CandidateSignals"
  });

  return {
    ...signals,
    neutralCandidateReply
  };
}

function extractText(payload: unknown): string {
  const parts = (payload as any)?.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((part: { text?: string }) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Gemini response does not contain text");
  }

  return text;
}

function parseJsonText(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (!fenced) {
      throw new Error("Model response is not JSON");
    }
    return JSON.parse(fenced[1]);
  }
}
