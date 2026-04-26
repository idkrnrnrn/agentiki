import {
  CandidateAnswersSchema,
  CandidateProfileSchema,
  VacancySchema,
  parseWithSchema
} from "./schemas.ts";
import {
  extractCandidateSignals,
  generateScreeningQuestions,
  parseResumeWithGemini
} from "./gemini.ts";
import { rankCandidate } from "./ranker.ts";
import type {
  CandidateAnswer,
  CandidateProfile,
  PipelineQuestionResult,
  PipelineRankResult,
  Vacancy
} from "./types.ts";

export async function prepareScreeningQuestions({
  vacancy,
  pdfText
}: {
  vacancy: Vacancy;
  pdfText: string;
}): Promise<PipelineQuestionResult> {
  const validVacancy = parseWithSchema(VacancySchema, vacancy, "Vacancy");
  const profile = await parseResumeWithGemini(pdfText);
  const validProfile = parseWithSchema(CandidateProfileSchema, profile, "CandidateProfile");
  const questions = await generateScreeningQuestions(validVacancy, validProfile);

  return {
    profile: validProfile,
    questions
  };
}

export async function rankScreenedCandidate({
  vacancy,
  profile,
  answers
}: {
  vacancy: Vacancy;
  profile: CandidateProfile;
  answers: CandidateAnswer[];
}): Promise<PipelineRankResult> {
  const validVacancy = parseWithSchema(VacancySchema, vacancy, "Vacancy");
  const validProfile = parseWithSchema(CandidateProfileSchema, profile, "CandidateProfile");
  const validAnswers = parseWithSchema(CandidateAnswersSchema, answers, "CandidateAnswer[]");
  const questions = await generateScreeningQuestions(validVacancy, validProfile);
  const signals = await extractCandidateSignals(validVacancy, validProfile, validAnswers);
  const rankResult = rankCandidate(validVacancy, signals);

  return {
    profile: validProfile,
    questions,
    signals,
    rankResult
  };
}
