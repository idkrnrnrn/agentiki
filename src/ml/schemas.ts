import { z } from "zod";

export const SignalNameSchema = z.enum([
  "experience_match",
  "skills_match",
  "schedule_match",
  "location_match",
  "motivation",
  "availability",
  "communication_quality"
]);

export const VacancySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  mustHave: z.array(z.string()),
  niceToHave: z.array(z.string()),
  responsibilities: z.array(z.string()),
  schedule: z.string().optional(),
  location: z.string().optional(),
  salary: z.string().optional(),
  weights: z.object({
    experience: z.number(),
    skills: z.number(),
    schedule: z.number(),
    motivation: z.number()
  }),
  dealBreakers: z.array(z.string())
});

export const CandidateProfileSchema = z.object({
  candidateId: z.string(),
  name: z.string().nullable(),
  contacts: z.object({
    phone: z.string().nullable(),
    email: z.string().nullable(),
    telegram: z.string().nullable()
  }),
  location: z.string().nullable(),
  workExperience: z.array(
    z.object({
      company: z.string().nullable(),
      position: z.string(),
      durationMonths: z.number().nullable(),
      responsibilities: z.array(z.string())
    })
  ),
  totalExperienceMonths: z.number().nullable(),
  skills: z.array(z.string()),
  education: z.string().nullable(),
  certificates: z.array(z.string()),
  languages: z.array(z.string()),
  schedulePreferences: z.string().nullable(),
  salaryExpectations: z.string().nullable(),
  availability: z.string().nullable(),
  rawSummary: z.string(),
  missingFields: z.array(z.string())
});

export const ScreeningQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  signal: SignalNameSchema,
  type: z.enum(["single_choice", "free_text"]),
  options: z.array(z.string()).optional()
});

export const ScreeningQuestionsSchema = z
  .array(ScreeningQuestionSchema)
  .min(3)
  .max(5);

export const CandidateAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.string()
});

export const CandidateAnswersSchema = z.array(CandidateAnswerSchema);

export const SignalScoreSchema = z.object({
  score: z.number().min(0).max(1),
  evidence: z.string()
});

export const CandidateSignalsSchema = z.object({
  candidateId: z.string(),
  mustHave: z.object({
    passed: z.boolean(),
    failedReasons: z.array(z.string())
  }),
  signals: z.object({
    experience_match: SignalScoreSchema,
    skills_match: SignalScoreSchema,
    schedule_match: SignalScoreSchema,
    location_match: SignalScoreSchema,
    motivation: SignalScoreSchema,
    availability: SignalScoreSchema,
    communication_quality: SignalScoreSchema
  }),
  strengths: z.array(z.string()).min(3).max(5),
  concerns: z.array(z.string()).min(2).max(5),
  missingInfo: z.array(z.string()),
  possibleAlternativeRoles: z.array(
    z.object({
      role: z.string(),
      reason: z.string()
    })
  ),
  modelRecommendation: z.enum([
    "invite_to_interview",
    "manual_review",
    "reject_or_route_elsewhere"
  ]),
  neutralCandidateReply: z.string()
});

export const GeminiCandidateSignalsSchema = CandidateSignalsSchema.omit({
  neutralCandidateReply: true
});

export const RankResultSchema = z.object({
  candidateId: z.string(),
  finalScore: z.number().min(0).max(100),
  tier: z.enum([
    "top_candidate",
    "good_match",
    "manual_review",
    "weak_match",
    "not_fit"
  ]),
  recommendedAction: z.enum([
    "invite_to_interview",
    "manual_review",
    "reject_or_route_elsewhere"
  ]),
  fitSummary: z.string(),
  topAdvantages: z.array(z.string()),
  topConcerns: z.array(z.string()),
  evidence: z.array(
    z.object({
      label: z.string(),
      score: z.number().min(0).max(1),
      evidence: z.string()
    })
  ),
  missingInfo: z.array(z.string()),
  possibleAlternativeRoles: z.array(
    z.object({
      role: z.string(),
      reason: z.string()
    })
  ),
  hrExplanation: z.string(),
  neutralCandidateReply: z.string()
});

export function toGeminiJsonSchema(schema: z.ZodType) {
  return sanitizeJsonSchema(z.toJSONSchema(schema, { target: "draft-7" }));
}

export function parseWithSchema<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    console.error(`${label} validation failed`, z.treeifyError(parsed.error));
    throw new Error(`${label} не прошел валидацию`);
  }
  return parsed.data;
}

function sanitizeJsonSchema(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeJsonSchema);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  for (const [key, child] of Object.entries(input)) {
    if (key === "$schema" || key === "$id") {
      continue;
    }

    output[key] = sanitizeJsonSchema(child);
  }

  if (Array.isArray(input.anyOf) && input.anyOf.every(isSimpleTypeSchema)) {
    output.type = input.anyOf.map((item) => (item as { type: string }).type);
    delete output.anyOf;
  }

  return output;
}

function isSimpleTypeSchema(value: unknown): boolean {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as { type?: unknown }).type === "string" &&
      Object.keys(value).length === 1
  );
}
