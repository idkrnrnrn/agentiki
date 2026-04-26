export const candidateProfileSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    fullName: { type: ["string", "null"] },
    location: { type: ["string", "null"] },
    education: { type: ["string", "null"] },
    experienceYears: { type: ["number", "null"] },
    relevantExperience: {
      type: "array",
      items: { type: "string" }
    },
    skills: {
      type: "array",
      items: { type: "string" }
    },
    previousRoles: {
      type: "array",
      items: { type: "string" }
    },
    availability: { type: ["string", "null"] },
    salaryExpectation: { type: ["string", "null"] },
    motivationSignals: {
      type: "array",
      items: { type: "string" }
    },
    risks: {
      type: "array",
      items: { type: "string" }
    },
    missingInfo: {
      type: "array",
      items: { type: "string" }
    },
    discriminatorySignalsIgnored: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: [
    "fullName",
    "location",
    "education",
    "experienceYears",
    "relevantExperience",
    "skills",
    "previousRoles",
    "availability",
    "salaryExpectation",
    "motivationSignals",
    "risks",
    "missingInfo",
    "discriminatorySignalsIgnored"
  ]
};

export const questionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    text: { type: "string" },
    reason: { type: "string" },
    expectedSignal: {
      type: "string",
      enum: [
        "must_have",
        "nice_to_have",
        "availability",
        "motivation",
        "risk_check",
        "missing_info"
      ]
    },
    answerType: {
      type: "string",
      enum: ["short_text", "long_text", "single_choice", "multi_choice"]
    },
    options: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["id", "text", "reason", "expectedSignal", "answerType", "options"]
};

export const questionsResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    questions: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: questionSchema
    }
  },
  required: ["questions"]
};

export const candidateSignalsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    mustHaveEvidence: {
      type: "array",
      items: { type: "string" }
    },
    niceToHaveEvidence: {
      type: "array",
      items: { type: "string" }
    },
    availability: { type: ["string", "null"] },
    motivation: { type: ["string", "null"] },
    riskFlags: {
      type: "array",
      items: { type: "string" }
    },
    missingInfoResolved: {
      type: "array",
      items: { type: "string" }
    },
    summaryForRecruiter: { type: "string" }
  },
  required: [
    "mustHaveEvidence",
    "niceToHaveEvidence",
    "availability",
    "motivation",
    "riskFlags",
    "missingInfoResolved",
    "summaryForRecruiter"
  ]
};

export const recruiterExplanationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    strengths: {
      type: "array",
      items: { type: "string" }
    },
    risks: {
      type: "array",
      items: { type: "string" }
    },
    suggestedNextStep: {
      type: "string",
      enum: ["invite", "manual_review", "clarify", "reject_after_review"]
    },
    clarifyQuestions: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: [
    "summary",
    "strengths",
    "risks",
    "suggestedNextStep",
    "clarifyQuestions"
  ]
};
