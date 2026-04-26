import test from "node:test";
import assert from "node:assert/strict";
import { rankCandidate } from "../src/ml/ranker.js";

test("rankCandidate returns high fit for strong must-have evidence", () => {
  const ranking = rankCandidate({
    vacancy: {
      mustHave: ["javascript", "react"],
      niceToHave: ["typescript"],
      stopFactors: []
    },
    candidateProfile: {
      experienceYears: 2,
      skills: ["JavaScript", "React", "TypeScript"],
      relevantExperience: ["React project"],
      risks: [],
      missingInfo: []
    },
    candidateSignals: {
      mustHaveEvidence: ["Worked with JavaScript and React"],
      niceToHaveEvidence: ["Used TypeScript"],
      motivation: "Wants internship",
      availability: "Ready now",
      riskFlags: []
    }
  });

  assert.equal(ranking.category, "high_fit");
  assert.ok(ranking.score >= 80);
});

test("rankCandidate returns low fit when must-have evidence is absent", () => {
  const ranking = rankCandidate({
    vacancy: {
      mustHave: ["react"],
      niceToHave: [],
      stopFactors: []
    },
    candidateProfile: {
      experienceYears: null,
      skills: ["Excel"],
      relevantExperience: [],
      risks: [],
      missingInfo: []
    },
    candidateSignals: {
      mustHaveEvidence: [],
      niceToHaveEvidence: [],
      motivation: null,
      availability: null,
      riskFlags: []
    }
  });

  assert.equal(ranking.category, "low_fit");
});
