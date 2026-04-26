export function mockCandidateProfile({ resumeText = "" } = {}) {
  const normalized = resumeText.toLowerCase();
  const skills = [];

  for (const skill of [
    "javascript",
    "typescript",
    "react",
    "node",
    "python",
    "sql",
    "excel",
    "касса",
    "продажи",
    "склад"
  ]) {
    if (normalized.includes(skill)) {
      skills.push(skill);
    }
  }

  return {
    fullName: extractName(resumeText),
    location: normalized.includes("москва") ? "Москва" : null,
    education: null,
    experienceYears: extractYears(resumeText),
    relevantExperience: skills.length ? [`Упомянуты навыки: ${skills.join(", ")}`] : [],
    skills,
    previousRoles: [],
    availability: null,
    salaryExpectation: null,
    motivationSignals: [],
    risks: skills.length ? [] : ["В резюме мало явных релевантных навыков"],
    missingInfo: ["График", "Мотивация", "Дата выхода"],
    discriminatorySignalsIgnored: []
  };
}

export function mockQuestions({ vacancy, candidateProfile }) {
  const title = vacancy?.title || "этой роли";
  const mustHave = vacancy?.mustHave || [];
  const questions = [
    {
      id: "q1",
      text: `Почему вам интересна позиция "${title}"?`,
      reason: "Проверка мотивации кандидата",
      expectedSignal: "motivation",
      answerType: "long_text",
      options: []
    },
    {
      id: "q2",
      text: "Когда вы готовы приступить и какой формат/график вам подходит?",
      reason: "Уточнение доступности",
      expectedSignal: "availability",
      answerType: "short_text",
      options: []
    },
    {
      id: "q3",
      text: mustHave[0]
        ? `Расскажите коротко, какой у вас есть опыт по требованию: ${mustHave[0]}?`
        : "Расскажите о самом релевантном опыте для этой вакансии.",
      reason: "Проверка основного must-have требования",
      expectedSignal: "must_have",
      answerType: "long_text",
      options: []
    }
  ];

  if (candidateProfile?.missingInfo?.length) {
    questions.push({
      id: "q4",
      text: `Уточните, пожалуйста: ${candidateProfile.missingInfo[0]}.`,
      reason: "Закрытие пробела в резюме",
      expectedSignal: "missing_info",
      answerType: "short_text",
      options: []
    });
  }

  return { questions: questions.slice(0, 5) };
}

export function mockCandidateSignals({ answers = {} }) {
  const answerText = Object.values(answers).join(" ").toLowerCase();
  return {
    mustHaveEvidence: answerText ? ["Кандидат дал уточняющие ответы"] : [],
    niceToHaveEvidence: [],
    availability: answerText.includes("завтра") || answerText.includes("сразу")
      ? "Готов быстро приступить"
      : null,
    motivation: answerText ? "Мотивация описана в ответах" : null,
    riskFlags: answerText ? [] : ["Нет ответов на уточняющие вопросы"],
    missingInfoResolved: Object.keys(answers),
    summaryForRecruiter: answerText
      ? "Кандидат прошел первичный скрининг и дал ответы для ручной проверки."
      : "Ответы кандидата отсутствуют, требуется ручная проверка."
  };
}

export function mockRecruiterExplanation({ ranking }) {
  return {
    summary: `Предварительная категория: ${ranking.category}. Score: ${ranking.score}.`,
    strengths: ranking.reasons,
    risks: ranking.risks,
    suggestedNextStep: ranking.category === "high_fit" ? "invite" : "manual_review",
    clarifyQuestions: ranking.category === "medium_fit"
      ? ["Уточнить самый критичный must-have и дату выхода."]
      : []
  };
}

function extractName(text) {
  const firstLine = text.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  return firstLine && firstLine.length < 80 ? firstLine : null;
}

function extractYears(text) {
  const match = text.match(/(\d+)\s*(?:лет|года|год|years?)/i);
  return match ? Number(match[1]) : null;
}
