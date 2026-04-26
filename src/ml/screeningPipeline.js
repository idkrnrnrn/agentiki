import { GeminiClient } from "./geminiClient.js";
import {
  candidateProfileSchema,
  candidateSignalsSchema,
  questionsResponseSchema,
  recruiterExplanationSchema
} from "./schemas.js";
import {
  buildAnswerParsingPrompt,
  buildQuestionGenerationPrompt,
  buildRecruiterExplanationPrompt,
  buildResumeParsingPrompt
} from "./prompts.js";
import {
  mockCandidateProfile,
  mockCandidateSignals,
  mockQuestions,
  mockRecruiterExplanation
} from "./mockGemini.js";
import { rankCandidate } from "./ranker.js";

export class ScreeningPipeline {
  constructor({ llm = new GeminiClient(), allowMocks = true } = {}) {
    this.llm = llm;
    this.allowMocks = allowMocks;
  }

  async parseResume({ vacancy, resume }) {
    if (this.llm.isConfigured && resume?.file) {
      return this.llm.generateJson({
        prompt: buildResumeParsingPrompt({ vacancy }),
        schema: candidateProfileSchema,
        file: resume.file,
        thinkingLevel: "low"
      });
    }

    if (this.llm.isConfigured && resume?.text) {
      return this.llm.generateJson({
        prompt: `${buildResumeParsingPrompt({ vacancy })}\n\nResume text:\n${resume.text}`,
        schema: candidateProfileSchema,
        thinkingLevel: "low"
      });
    }

    return this.withMock(() => mockCandidateProfile({ resumeText: resume?.text }));
  }

  async generateQuestions({ vacancy, candidateProfile }) {
    if (this.llm.isConfigured) {
      return this.llm.generateJson({
        prompt: buildQuestionGenerationPrompt({ vacancy, candidateProfile }),
        schema: questionsResponseSchema,
        thinkingLevel: "low"
      });
    }

    return this.withMock(() => mockQuestions({ vacancy, candidateProfile }));
  }

  async parseAnswers({ vacancy, candidateProfile, questions, answers }) {
    if (this.llm.isConfigured) {
      return this.llm.generateJson({
        prompt: buildAnswerParsingPrompt({ vacancy, candidateProfile, questions, answers }),
        schema: candidateSignalsSchema,
        thinkingLevel: "low"
      });
    }

    return this.withMock(() => mockCandidateSignals({ answers }));
  }

  async explainForRecruiter({ vacancy, candidateProfile, candidateSignals, ranking }) {
    if (this.llm.isConfigured) {
      return this.llm.generateJson({
        prompt: buildRecruiterExplanationPrompt({
          vacancy,
          candidateProfile,
          candidateSignals,
          ranking
        }),
        schema: recruiterExplanationSchema,
        thinkingLevel: "low"
      });
    }

    return this.withMock(() => mockRecruiterExplanation({ ranking }));
  }

  async run({ vacancy, resume, answers = null }) {
    const candidateProfile = await this.parseResume({ vacancy, resume });
    const questionResult = await this.generateQuestions({ vacancy, candidateProfile });
    const questions = questionResult.questions;

    if (!answers) {
      return {
        status: "questions_ready",
        candidateProfile,
        questions
      };
    }

    const candidateSignals = await this.parseAnswers({
      vacancy,
      candidateProfile,
      questions,
      answers
    });
    const ranking = rankCandidate({ vacancy, candidateProfile, candidateSignals });
    const recruiterExplanation = await this.explainForRecruiter({
      vacancy,
      candidateProfile,
      candidateSignals,
      ranking
    });

    return {
      status: "screening_completed",
      candidateProfile,
      questions,
      candidateSignals,
      ranking,
      recruiterExplanation,
      candidateReply: buildNeutralCandidateReply()
    };
  }

  withMock(factory) {
    if (!this.allowMocks) {
      throw new Error("Gemini is not configured and mocks are disabled");
    }
    return factory();
  }
}

export function buildNeutralCandidateReply() {
  return {
    title: "Спасибо, ответы получены",
    message: "Рекрутер изучит анкету и свяжется с вами по дальнейшим шагам.",
    exposeScore: false
  };
}

export async function runScreeningPipeline(input, options) {
  const pipeline = new ScreeningPipeline(options);
  return pipeline.run(input);
}
