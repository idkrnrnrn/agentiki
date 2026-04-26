import type {
  CandidateAnswer,
  CandidateProfile,
  CandidateSignals,
  Vacancy
} from "./types.ts";

export const demoVacancy: Vacancy = {
  id: "vacancy_cashier_consultant_1",
  title: "Продавец-консультант / кассир",
  description:
    "Массовый подбор в розничную сеть. Нужен кандидат, который умеет общаться с клиентами, готов к сменному графику, аккуратен в работе и готов обучиться кассе.",
  mustHave: [
    "опыт общения с клиентами",
    "готовность к сменному графику",
    "аккуратность",
    "готовность обучиться кассе"
  ],
  niceToHave: [
    "опыт работы с кассой",
    "опыт в рознице",
    "близость к локации",
    "быстрый выход на работу"
  ],
  responsibilities: [
    "консультировать покупателей",
    "помогать с выкладкой товара",
    "работать с кассой после обучения",
    "поддерживать порядок в торговом зале"
  ],
  schedule: "сменный график 2/2",
  location: "Москва, рядом с метро",
  salary: "от 65 000 рублей",
  weights: {
    experience: 0.25,
    skills: 0.3,
    schedule: 0.3,
    motivation: 0.15
  },
  dealBreakers: [
    "не готов к сменному графику",
    "не готов общаться с клиентами",
    "не может выйти в ближайший месяц"
  ]
};

export const demoCandidateProfile: CandidateProfile = {
  candidateId: "candidate_1",
  name: "Анна Смирнова",
  contacts: {
    phone: "+7 999 123-45-67",
    email: "anna@example.com",
    telegram: "@anna_demo"
  },
  location: "Москва, 25 минут до магазина",
  workExperience: [
    {
      company: "Магазин одежды",
      position: "Продавец-консультант",
      durationMonths: 8,
      responsibilities: [
        "консультировала покупателей",
        "помогала с выкладкой товара",
        "работала с возвратами и вопросами клиентов"
      ]
    }
  ],
  totalExperienceMonths: 8,
  skills: [
    "общение с клиентами",
    "консультации покупателей",
    "аккуратность",
    "выкладка товара"
  ],
  education: "Среднее специальное",
  certificates: [],
  languages: ["русский"],
  schedulePreferences: "Готова к графику 2/2",
  salaryExpectations: null,
  availability: "Готова выйти в течение недели",
  rawSummary:
    "Кандидат с опытом продавца-консультанта 8 месяцев, работала с клиентами и товаром. Готова к сменному графику и быстрому выходу.",
  missingFields: ["зарплатные ожидания", "подтвержденный опыт работы с кассой"]
};

export const demoAnswers: CandidateAnswer[] = [
  {
    questionId: "q1",
    answer:
      "С графиком 2/2 все нормально, раньше так работала. Могу выходить в утренние и дневные смены."
  },
  {
    questionId: "q2",
    answer:
      "С кассой напрямую не работала, но готова быстро обучиться, с программами и терминалом обычно разбираюсь быстро."
  },
  {
    questionId: "q3",
    answer:
      "Могу выйти на работу на следующей неделе. Магазин находится недалеко, дорога занимает около 25 минут."
  },
  {
    questionId: "q4",
    answer:
      "Мне нравится общаться с покупателями и помогать им выбрать товар. В конфликтных ситуациях стараюсь спокойно разобраться."
  }
];

export const demoCandidateSignals: CandidateSignals = {
  candidateId: "candidate_1",
  mustHave: {
    passed: true,
    failedReasons: []
  },
  signals: {
    experience_match: {
      score: 0.8,
      evidence: "Работала продавцом-консультантом 8 месяцев и консультировала покупателей."
    },
    skills_match: {
      score: 0.7,
      evidence: "Есть навыки общения с клиентами, консультаций, аккуратности и выкладки товара."
    },
    schedule_match: {
      score: 0.9,
      evidence: "Кандидат готова к сменному графику 2/2 и ранее так работала."
    },
    location_match: {
      score: 0.8,
      evidence: "Дорога до магазина занимает около 25 минут."
    },
    motivation: {
      score: 0.75,
      evidence: "Кандидату нравится общение с покупателями и помощь в выборе товара."
    },
    availability: {
      score: 0.9,
      evidence: "Готова выйти на следующей неделе."
    },
    communication_quality: {
      score: 0.8,
      evidence: "Ответы конкретные, спокойные и по делу."
    }
  },
  strengths: [
    "Есть опыт работы с клиентами",
    "Готова к сменному графику",
    "Готова обучиться работе с кассой",
    "Может выйти в ближайшее время",
    "Локация подходит по времени дороги"
  ],
  concerns: [
    "Нет подтвержденного опыта работы с кассой",
    "Не до конца понятны зарплатные ожидания"
  ],
  missingInfo: ["зарплатные ожидания"],
  possibleAlternativeRoles: [],
  modelRecommendation: "invite_to_interview",
  neutralCandidateReply:
    "Спасибо за ответы! Мы передали вашу анкету рекрутеру. Если профиль подойдёт под требования вакансии, с вами свяжутся для следующего этапа."
};
