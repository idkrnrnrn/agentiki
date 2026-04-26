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

export function rankCandidate(vacancy: Vacancy, signals: CandidateSignals): RankResult {
  const evidence = buildEvidence(signals.signals);

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
  const weighted =
    weights.experience * signals.signals.experience_match.score +
    weights.skills * signals.signals.skills_match.score +
    weights.schedule * signals.signals.schedule_match.score +
    weights.location * signals.signals.location_match.score +
    weights.motivation * signals.signals.motivation.score +
    weights.availability * signals.signals.availability.score +
    weights.communication * signals.signals.communication_quality.score;

  const totalWeight =
    weights.experience +
    weights.skills +
    weights.schedule +
    weights.location +
    weights.motivation +
    weights.availability +
    weights.communication;

  if (totalWeight <= 0) {
    return 0;
  }

  return Math.round((weighted / totalWeight) * 100);
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

function buildEvidence(signals: Record<SignalName, SignalScore>): RankResult["evidence"] {
  return Object.entries(signals).map(([name, signal]) => ({
    label: signalLabels[name as SignalName],
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
