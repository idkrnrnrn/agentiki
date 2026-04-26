import type {
  CandidateSignals,
  RankResult,
  SignalName,
  SignalScore,
  Vacancy
} from "./types.ts";

const signalLabels: Record<SignalName, string> = {
  experience_match: "Опыт",
  skills_match: "Навыки",
  schedule_match: "График",
  location_match: "Локация",
  motivation: "Мотивация",
  availability: "Доступность",
  communication_quality: "Коммуникация"
};

const rankerLabels = {
  experience: "Опыт",
  skills: "Навыки",
  schedule: "График",
  motivation: "Мотивация"
} as const;

export function rankCandidate(vacancy: Vacancy, signals: CandidateSignals): RankResult {
  const components = buildWeightedComponents(signals);
  const evidence = buildEvidence(components);

  // Hard gate: если must-have не пройден, кандидат не должен получать высокий score
  // даже при хороших вторичных сигналах. Это делает ранжирование объяснимым для HR.
  if (!signals.mustHave.passed) {
    const weighted = calculateWeightedScore(vacancy, signals);
    const finalScore = clamp(Math.min(35, weighted), 0, 35);
    const topConcerns = compactUnique([
      ...signals.mustHave.failedReasons,
      ...signals.concerns,
      ...weakSignalConcerns(signals)
    ]).slice(0, 5);

    return {
      candidateId: signals.candidateId,
      finalScore,
      tier: "not_fit",
      recommendedAction: "reject_or_route_elsewhere",
      fitSummary:
        "Кандидат не проходит ключевые требования вакансии: есть блокирующие несоответствия по must-have критериям.",
      topAdvantages: buildTopAdvantages(signals),
      topConcerns,
      evidence,
      missingInfo: signals.missingInfo,
      possibleAlternativeRoles: signals.possibleAlternativeRoles,
      hrExplanation: buildHrExplanation({
        score: finalScore,
        tier: "not_fit",
        action: "reject_or_route_elsewhere",
        advantages: buildTopAdvantages(signals),
        concerns: topConcerns
      }),
      neutralCandidateReply: signals.neutralCandidateReply
    };
  }

  const weightedScore = calculateWeightedScore(vacancy, signals);
  const concernPenalty = Math.min(signals.concerns.length * 3, 12);
  const missingPenalty = Math.min(signals.missingInfo.length * 2, 8);
  const finalScore = clamp(Math.round(weightedScore - concernPenalty - missingPenalty), 0, 100);
  const tier = chooseTier(finalScore);
  const recommendedAction = chooseAction(tier);
  const topAdvantages = buildTopAdvantages(signals);
  const topConcerns = compactUnique([
    ...signals.concerns,
    ...signals.mustHave.failedReasons,
    ...weakSignalConcerns(signals)
  ]).slice(0, 5);

  return {
    candidateId: signals.candidateId,
    finalScore,
    tier,
    recommendedAction,
    fitSummary: buildFitSummary(tier, topAdvantages, topConcerns),
    topAdvantages,
    topConcerns,
    evidence,
    missingInfo: signals.missingInfo,
    possibleAlternativeRoles: signals.possibleAlternativeRoles,
    hrExplanation: buildHrExplanation({
      score: finalScore,
      tier,
      action: recommendedAction,
      advantages: topAdvantages,
      concerns: topConcerns
    }),
    neutralCandidateReply: signals.neutralCandidateReply
  };
}

function calculateWeightedScore(vacancy: Vacancy, signals: CandidateSignals): number {
  const weights = vacancy.weights;
  const components = buildWeightedComponents(signals);
  const weighted =
    weights.experience * components.experience.score +
    weights.skills * components.skills.score +
    weights.schedule * components.schedule.score +
    weights.motivation * components.motivation.score;

  const totalWeight =
    weights.experience +
    weights.skills +
    weights.schedule +
    weights.motivation;

  if (totalWeight <= 0) {
    return 0;
  }

  return Math.round((weighted / totalWeight) * 100);
}

function buildWeightedComponents(signals: CandidateSignals): Record<keyof Vacancy["weights"], SignalScore> {
  const s = signals.signals;

  return {
    experience: s.experience_match,
    skills: {
      score: roundScore(s.skills_match.score * 0.8 + s.communication_quality.score * 0.2),
      evidence: [
        s.skills_match.evidence,
        `Коммуникация учтена как часть навыков: ${s.communication_quality.evidence}`
      ].join(" ")
    },
    schedule: {
      score: roundScore(
        s.schedule_match.score * 0.45 +
          s.availability.score * 0.35 +
          s.location_match.score * 0.2
      ),
      evidence: [
        s.schedule_match.evidence,
        `Доступность: ${s.availability.evidence}`,
        `Локация: ${s.location_match.evidence}`
      ].join(" ")
    },
    motivation: s.motivation
  };
}

function chooseTier(score: number): RankResult["tier"] {
  if (score >= 85) return "top_candidate";
  if (score >= 70) return "good_match";
  if (score >= 50) return "manual_review";
  if (score >= 35) return "weak_match";
  return "not_fit";
}

function chooseAction(tier: RankResult["tier"]): RankResult["recommendedAction"] {
  if (tier === "top_candidate" || tier === "good_match") {
    return "invite_to_interview";
  }
  if (tier === "manual_review") {
    return "manual_review";
  }
  return "reject_or_route_elsewhere";
}

function buildTopAdvantages(signals: CandidateSignals): string[] {
  const fromStrengths = compactUnique(signals.strengths).slice(0, 5);
  if (fromStrengths.length) {
    return fromStrengths;
  }

  return Object.entries(signals.signals)
    .filter(([, signal]) => signal.score >= 0.7)
    .map(([name, signal]) => `${signalLabels[name as SignalName]}: ${signal.evidence}`)
    .slice(0, 5);
}

function weakSignalConcerns(signals: CandidateSignals): string[] {
  return Object.entries(signals.signals)
    .filter(([, signal]) => signal.score < 0.5)
    .map(([name, signal]) => `${signalLabels[name as SignalName]}: ${signal.evidence}`);
}

function buildEvidence(signals: Record<keyof Vacancy["weights"], SignalScore>): RankResult["evidence"] {
  return Object.entries(signals).map(([name, signal]) => ({
    label: rankerLabels[name as keyof Vacancy["weights"]],
    score: signal.score,
    evidence: signal.evidence
  }));
}

function buildFitSummary(
  tier: RankResult["tier"],
  advantages: string[],
  concerns: string[]
): string {
  const mainAdvantages = advantages.slice(0, 3).join(", ");
  const mainConcerns = concerns.slice(0, 2).join(", ");

  if (tier === "top_candidate" || tier === "good_match") {
    return `Кандидат хорошо подходит на вакансию: ${mainAdvantages || "есть несколько сильных сигналов соответствия"}.`;
  }

  if (tier === "manual_review") {
    return `Кандидат требует ручной проверки: ${mainConcerns || "часть сигналов требует уточнения"}.`;
  }

  return `Кандидат слабо подходит на вакансию: ${mainConcerns || "есть существенные риски соответствия"}.`;
}

function buildHrExplanation({
  score,
  tier,
  action,
  advantages,
  concerns
}: {
  score: number;
  tier: RankResult["tier"];
  action: RankResult["recommendedAction"];
  advantages: string[];
  concerns: string[];
}): string {
  const strong = advantages.slice(0, 2).join("; ") || "сильные стороны выражены слабо";
  const check = concerns.slice(0, 2).join("; ") || "критичных рисков не выявлено";
  const actionText =
    action === "invite_to_interview"
      ? "Рекомендуется пригласить кандидата на следующий этап."
      : action === "manual_review"
        ? "Рекомендуется ручная проверка рекрутером."
        : "Рекомендуется отклонить или направить на другую роль после проверки HR.";

  return `Score ${score}, tier ${tier}: результат сформирован по взвешенным сигналам вакансии и штрафам за риски/пробелы. Сильное: ${strong}. Что проверить: ${check}. ${actionText}`;
}

function compactUnique(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}
