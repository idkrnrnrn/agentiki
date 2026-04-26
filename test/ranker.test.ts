import test from "node:test";
import assert from "node:assert/strict";
import { demoCandidateSignals, demoVacancy, rankCandidate } from "../src/ml/index.ts";
import type { CandidateSignals } from "../src/ml/index.ts";

test("rankCandidate returns visible advantages for strong candidate", () => {
  const result = rankCandidate(demoVacancy, demoCandidateSignals);

  assert.equal(result.tier, "good_match");
  assert.equal(result.recommendedAction, "invite_to_interview");
  assert.ok(result.finalScore >= 70);
  assert.ok(result.topAdvantages.includes("Есть опыт работы с клиентами"));
  assert.ok(result.topAdvantages.includes("Готова к сменному графику"));
  assert.ok(result.topConcerns.includes("Нет подтвержденного опыта работы с кассой"));
});

test("rankCandidate caps score and returns not_fit when must-have fails", () => {
  const failedSignals: CandidateSignals = {
    ...demoCandidateSignals,
    mustHave: {
      passed: false,
      failedReasons: [
        "Не подтверждена готовность к сменному графику",
        "Нет подтвержденного опыта общения с клиентами"
      ]
    },
    signals: {
      ...demoCandidateSignals.signals,
      schedule_match: {
        score: 0.0,
        evidence: "Кандидат написал, что сменный график не подходит."
      }
    },
    strengths: ["Готов обучиться кассе"],
    concerns: ["Сменный график не подходит"]
  };

  const result = rankCandidate(demoVacancy, failedSignals);

  assert.equal(result.tier, "not_fit");
  assert.equal(result.recommendedAction, "reject_or_route_elsewhere");
  assert.ok(result.finalScore <= 35);
  assert.ok(result.topConcerns.includes("Не подтверждена готовность к сменному графику"));
});
