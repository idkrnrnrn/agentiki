export type SignalName =
  | "experience_match"
  | "skills_match"
  | "schedule_match"
  | "location_match"
  | "motivation"
  | "availability"
  | "communication_quality";

export type Vacancy = {
  id: string;
  title: string;
  description: string;
  mustHave: string[];
  niceToHave: string[];
  responsibilities: string[];
  schedule?: string;
  location?: string;
  salary?: string;
  weights: {
    experience: number;
    skills: number;
    schedule: number;
    location: number;
    motivation: number;
    availability: number;
    communication: number;
  };
  dealBreakers: string[];
};

export type CandidateProfile = {
  candidateId: string;
  name: string | null;
  contacts: {
    phone: string | null;
    email: string | null;
    telegram: string | null;
  };
  location: string | null;
  workExperience: Array<{
    company: string | null;
    position: string;
    durationMonths: number | null;
    responsibilities: string[];
  }>;
  totalExperienceMonths: number | null;
  skills: string[];
  education: string | null;
  certificates: string[];
  languages: string[];
  schedulePreferences: string | null;
  salaryExpectations: string | null;
  availability: string | null;
  rawSummary: string;
  missingFields: string[];
};

export type ScreeningQuestion = {
  id: string;
  text: string;
  signal: SignalName;
  type: "single_choice" | "free_text";
  options?: string[];
};

export type CandidateAnswer = {
  questionId: string;
  answer: string;
};

export type SignalScore = {
  score: number;
  evidence: string;
};

export type CandidateSignals = {
  candidateId: string;
  mustHave: {
    passed: boolean;
    failedReasons: string[];
  };
  signals: Record<SignalName, SignalScore>;
  strengths: string[];
  concerns: string[];
  missingInfo: string[];
  possibleAlternativeRoles: Array<{
    role: string;
    reason: string;
  }>;
  modelRecommendation:
    | "invite_to_interview"
    | "manual_review"
    | "reject_or_route_elsewhere";
  neutralCandidateReply: string;
};

export type RankResult = {
  candidateId: string;
  finalScore: number;
  tier:
    | "top_candidate"
    | "good_match"
    | "manual_review"
    | "weak_match"
    | "not_fit";
  recommendedAction:
    | "invite_to_interview"
    | "manual_review"
    | "reject_or_route_elsewhere";
  fitSummary: string;
  topAdvantages: string[];
  topConcerns: string[];
  evidence: Array<{
    label: string;
    score: number;
    evidence: string;
  }>;
  missingInfo: string[];
  possibleAlternativeRoles: Array<{
    role: string;
    reason: string;
  }>;
  hrExplanation: string;
  neutralCandidateReply: string;
};

export type PipelineQuestionResult = {
  profile: CandidateProfile;
  questions: ScreeningQuestion[];
};

export type PipelineRankResult = {
  profile: CandidateProfile;
  questions: ScreeningQuestion[];
  signals: CandidateSignals;
  rankResult: RankResult;
};
