const CATEGORY = {
  HIGH: "high_fit",
  MEDIUM: "medium_fit",
  LOW: "low_fit",
  REVIEW: "needs_manual_review"
};

export function rankCandidate({ vacancy, candidateProfile, candidateSignals }) {
  const mustHave = normalizeList(vacancy?.mustHave);
  const niceToHave = normalizeList(vacancy?.niceToHave);
  const stopFactors = normalizeList(vacancy?.stopFactors);

  const evidenceText = normalizeText([
    candidateProfile?.skills,
    candidateProfile?.relevantExperience,
    candidateProfile?.previousRoles,
    candidateSignals?.mustHaveEvidence,
    candidateSignals?.niceToHaveEvidence,
    candidateSignals?.availability,
    candidateSignals?.motivation,
    candidateSignals?.summaryForRecruiter
  ]);

  const stopHits = stopFactors.filter((factor) => evidenceText.includes(factor));
  const mustHits = mustHave.filter((item) => evidenceText.includes(item));
  const niceHits = niceToHave.filter((item) => evidenceText.includes(item));

  const mustScore = ratioScore(mustHits.length, mustHave.length, mustHave.length ? 45 : 30);
  const niceScore = ratioScore(niceHits.length, niceToHave.length, niceToHave.length ? 20 : 10);
  const experienceScore = candidateProfile?.experienceYears ? Math.min(15, candidateProfile.experienceYears * 5) : 5;
  const motivationScore = candidateSignals?.motivation ? 10 : 3;
  const availabilityScore = candidateSignals?.availability ? 10 : 3;
  const riskPenalty = 8 * normalizeList(candidateProfile?.risks).length
    + 10 * normalizeList(candidateSignals?.riskFlags).length
    + 25 * stopHits.length;

  const score = clamp(
    Math.round(mustScore + niceScore + experienceScore + motivationScore + availabilityScore - riskPenalty),
    0,
    100
  );

  const category = chooseCategory({
    score,
    mustHaveCount: mustHave.length,
    mustHitsCount: mustHits.length,
    stopHitsCount: stopHits.length
  });

  return {
    score,
    category,
    reasons: buildReasons({ mustHits, niceHits, candidateProfile, candidateSignals }),
    risks: buildRisks({ stopHits, candidateProfile, candidateSignals }),
    matchedMustHave: mustHits,
    matchedNiceToHave: niceHits,
    modelVersion: "rules-v0.1"
  };
}

function chooseCategory({ score, mustHaveCount, mustHitsCount, stopHitsCount }) {
  if (stopHitsCount > 0) {
    return CATEGORY.REVIEW;
  }
  if (mustHaveCount > 0 && mustHitsCount === 0) {
    return score >= 50 ? CATEGORY.REVIEW : CATEGORY.LOW;
  }
  if (score >= 80) {
    return CATEGORY.HIGH;
  }
  if (score >= 50) {
    return CATEGORY.MEDIUM;
  }
  return CATEGORY.LOW;
}

function buildReasons({ mustHits, niceHits, candidateProfile, candidateSignals }) {
  const reasons = [];
  if (mustHits.length) {
    reasons.push(`Есть совпадения по must-have: ${mustHits.join(", ")}`);
  }
  if (niceHits.length) {
    reasons.push(`Есть совпадения по nice-to-have: ${niceHits.join(", ")}`);
  }
  if (candidateProfile?.experienceYears) {
    reasons.push(`Опыт: ${candidateProfile.experienceYears} лет`);
  }
  if (candidateSignals?.motivation) {
    reasons.push("Мотивация кандидата уточнена");
  }
  if (candidateSignals?.availability) {
    reasons.push("Доступность кандидата уточнена");
  }
  return reasons.length ? reasons : ["Недостаточно подтвержденных сильных сигналов"];
}

function buildRisks({ stopHits, candidateProfile, candidateSignals }) {
  return [
    ...stopHits.map((hit) => `Возможный стоп-фактор: ${hit}`),
    ...normalizeList(candidateProfile?.risks),
    ...normalizeList(candidateSignals?.riskFlags),
    ...normalizeList(candidateProfile?.missingInfo).map((item) => `Не уточнено: ${item}`)
  ];
}

function ratioScore(hits, total, maxScore) {
  if (!total) {
    return maxScore;
  }
  return (hits / total) * maxScore;
}

function normalizeList(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [String(value)];
}

function normalizeText(value) {
  return normalizeList(value)
    .flatMap((item) => Array.isArray(item) ? item : [item])
    .join(" ")
    .toLowerCase();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
