import type {
  CandidateAnswer,
  CandidateProfile,
  CandidateSignals,
  ScreeningQuestion,
  Vacancy
} from "./types.ts";
import {
  demoAnswers,
  demoCandidateProfile,
  demoCandidateSignals,
  demoVacancy
} from "./demoData.ts";

export const neutralCandidateReply =
  "Спасибо за ответы! Мы передали вашу анкету рекрутеру. Если профиль подойдёт под требования вакансии, с вами свяжутся для следующего этапа.";

export function createMockCandidateProfile(pdfText: string): CandidateProfile {
  const text = pdfText.trim();
  if (!text) {
    return demoCandidateProfile;
  }

  const normalized = text.toLowerCase();
  const skills = [
    "общение с клиентами",
    "касса",
    "продажи",
    "розница",
    "аккуратность",
    "выкладка товара",
    "консультации покупателей"
  ].filter((skill) => normalized.includes(skill));

  return {
    candidateId: "candidate_1",
    name: extractName(text),
    contacts: {
      phone: extractPhone(text),
      email: extractEmail(text),
      telegram: extractTelegram(text)
    },
    location: normalized.includes("москва") ? "Москва" : null,
    workExperience: [
      {
        company: null,
        position: normalized.includes("продав") ? "Продавец-консультант" : "Не указано",
        durationMonths: extractMonths(text),
        responsibilities: skills.length ? skills : []
      }
    ],
    totalExperienceMonths: extractMonths(text),
    skills,
    education: null,
    certificates: [],
    languages: normalized.includes("англий") ? ["русский", "английский"] : ["русский"],
    schedulePreferences: normalized.includes("2/2") || normalized.includes("смен")
      ? "Готовность к сменному графику"
      : null,
    salaryExpectations: null,
    availability: normalized.includes("сразу") || normalized.includes("недел")
      ? "Готов выйти в ближайшее время"
      : null,
    rawSummary: text.slice(0, 700),
    missingFields: [
      ...(!skills.includes("касса") ? ["подтвержденный опыт работы с кассой"] : []),
      "зарплатные ожидания"
    ]
  };
}

export function createMockQuestions(
  vacancy: Vacancy = demoVacancy,
  profile: CandidateProfile = demoCandidateProfile
): ScreeningQuestion[] {
  const questions: ScreeningQuestion[] = [
    {
      id: "q1",
      text: `Подходит ли вам ${vacancy.schedule ?? "указанный график"}?`,
      signal: "schedule_match",
      type: "single_choice",
      options: ["Да, подходит", "Скорее подходит", "Нет, не подходит"]
    },
    {
      id: "q2",
      text: "Есть ли у вас опыт работы с кассой или готовность быстро обучиться?",
      signal: "skills_match",
      type: "free_text"
    },
    {
      id: "q3",
      text: "Когда вы готовы выйти на работу?",
      signal: "availability",
      type: "free_text"
    },
    {
      id: "q4",
      text: "Почему вам интересна эта вакансия?",
      signal: "motivation",
      type: "free_text"
    }
  ];

  if (!profile.location) {
    questions.push({
      id: "q5",
      text: "Сколько времени вам удобно добираться до места работы?",
      signal: "location_match",
      type: "free_text"
    });
  }

  return questions.slice(0, 5);
}

export function createMockCandidateSignals(
  vacancy: Vacancy = demoVacancy,
  profile: CandidateProfile = demoCandidateProfile,
  answers: CandidateAnswer[] = demoAnswers
): CandidateSignals {
  const answerText = answers.map((item) => item.answer).join(" ").toLowerCase();
  const hasCustomerExperience = hasAny(profile, ["клиент", "покупател", "консульт"]);
  const hasCashier = hasAny(profile, ["касс"]) || answerText.includes("касс");
  const readyForSchedule = hasAny(profile, ["2/2", "смен"]) || answerText.includes("2/2") || answerText.includes("смен");
  const availableSoon = hasAny(profile, ["недел", "сразу", "ближай"]) || answerText.includes("недел") || answerText.includes("сразу");

  const failedReasons = [];
  if (!hasCustomerExperience) {
    failedReasons.push("Нет подтвержденного опыта общения с клиентами");
  }
  if (!readyForSchedule) {
    failedReasons.push("Не подтверждена готовность к сменному графику");
  }

  return {
    candidateId: profile.candidateId,
    mustHave: {
      passed: failedReasons.length === 0,
      failedReasons
    },
    signals: {
      experience_match: {
        score: hasCustomerExperience ? 0.8 : 0.3,
        evidence: hasCustomerExperience
          ? "В профиле или ответах есть опыт общения с клиентами."
          : "Опыт общения с клиентами не подтвержден."
      },
      skills_match: {
        score: hasCashier ? 0.7 : 0.5,
        evidence: hasCashier
          ? "Кандидат упомянул кассу или готовность обучиться."
          : "Опыт кассы не подтвержден, но может быть обучаемость."
      },
      schedule_match: {
        score: readyForSchedule ? 0.9 : 0.3,
        evidence: readyForSchedule
          ? "Подтверждена готовность к сменному графику."
          : "График требует уточнения."
      },
      location_match: {
        score: profile.location ? 0.8 : 0.5,
        evidence: profile.location
          ? `Локация указана: ${profile.location}.`
          : "Локация или время дороги не указаны."
      },
      motivation: {
        score: answerText.length > 40 ? 0.75 : 0.4,
        evidence: answerText.length > 40
          ? "Кандидат дал развернутый ответ о мотивации."
          : "Мотивация описана слабо или отсутствует."
      },
      availability: {
        score: availableSoon ? 0.9 : 0.4,
        evidence: availableSoon
          ? "Кандидат готов выйти в ближайшее время."
          : "Дата выхода неясна."
      },
      communication_quality: {
        score: answerText.length > 60 ? 0.8 : 0.5,
        evidence: answerText.length > 60
          ? "Ответы понятные и достаточно конкретные."
          : "Ответы короткие, коммуникацию лучше проверить вручную."
      }
    },
    strengths: [
      ...(hasCustomerExperience ? ["Есть опыт работы с клиентами"] : []),
      ...(readyForSchedule ? ["Подходит сменный график"] : []),
      ...(hasCashier ? ["Есть опыт или готовность обучиться работе с кассой"] : []),
      ...(availableSoon ? ["Может выйти в ближайшее время"] : []),
      ...(profile.location ? ["Локация кандидата понятна"] : [])
    ].slice(0, 5),
    concerns: [
      ...(!hasCashier ? ["Нет подтвержденного опыта работы с кассой"] : []),
      ...(!profile.salaryExpectations ? ["Не до конца понятны зарплатные ожидания"] : []),
      ...(!profile.location ? ["Не указана локация или удобное время дороги"] : [])
    ].slice(0, 5),
    missingInfo: profile.missingFields,
    possibleAlternativeRoles: failedReasons.length
      ? [{ role: "Помощник торгового зала", reason: "Меньше требований к кассе и первичной коммуникации." }]
      : [],
    modelRecommendation: failedReasons.length ? "manual_review" : "invite_to_interview",
    neutralCandidateReply
  };
}

function hasAny(profile: CandidateProfile, needles: string[]): boolean {
  const haystack = JSON.stringify(profile).toLowerCase();
  return needles.some((needle) => haystack.includes(needle));
}

function extractName(text: string): string | null {
  const line = text.split(/\r?\n/).map((item) => item.trim()).find(Boolean);
  return line && line.length < 80 ? line : null;
}

function extractEmail(text: string): string | null {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
}

function extractPhone(text: string): string | null {
  return text.match(/(?:\+7|8)[\s(.-]*\d{3}[\s).-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}/)?.[0] ?? null;
}

function extractTelegram(text: string): string | null {
  return text.match(/@[a-zA-Z0-9_]{4,}/)?.[0] ?? null;
}

function extractMonths(text: string): number | null {
  const years = text.match(/(\d+)\s*(?:год|года|лет)/i);
  if (years) {
    return Number(years[1]) * 12;
  }

  const months = text.match(/(\d+)\s*(?:месяц|месяца|месяцев)/i);
  return months ? Number(months[1]) : null;
}
