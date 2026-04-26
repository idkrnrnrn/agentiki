import {
  CandidateAnswersSchema,
  CandidateProfileSchema,
  ScreeningQuestionsSchema,
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
  ScreeningQuestion,
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
  questions,
  answers
}: {
  vacancy: Vacancy;
  profile: CandidateProfile;
  questions?: ScreeningQuestion[];
  answers: CandidateAnswer[];
}): Promise<PipelineRankResult> {
  const validVacancy = parseWithSchema(VacancySchema, vacancy, "Vacancy");
  const validProfile = parseWithSchema(CandidateProfileSchema, profile, "CandidateProfile");
  const validAnswers = parseWithSchema(CandidateAnswersSchema, answers, "CandidateAnswer[]");
  const validQuestions = questions
    ? parseWithSchema(ScreeningQuestionsSchema, questions, "ScreeningQuestion[]")
    : [];
  const signals = await extractCandidateSignals(validVacancy, validProfile, validAnswers);
  const rankResult = rankCandidate(validVacancy, signals);

  return {
    profile: validProfile,
    questions: validQuestions,
    signals,
    rankResult
  };
}
