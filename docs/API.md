# API агента AI-скрининга

Базовый URL локально:

```text
http://127.0.0.1:3000
```

Агент работает в два шага:

1. `prepare-screening`: PDF/text резюме -> профиль кандидата + вопросы.
2. `rank-candidate`: профиль + вопросы + ответы -> сигналы + итоговая карточка HR.

Важно: после первого шага backend должен сохранить `profile` и `questions`. На втором шаге их нужно передать обратно, чтобы не генерировать вопросы повторно.

## Vacancy

HR задает только 4 веса:

```ts
weights: {
  experience: number;  // опыт
  skills: number;      // навыки
  schedule: number;    // график / доступность / локация
  motivation: number;  // мотивация
}
```

Рекомендуемая сумма весов: `1.0`.

Для массового подбора продавца/кассира сейчас demo-веса:

```json
{
  "experience": 0.25,
  "skills": 0.30,
  "schedule": 0.30,
  "motivation": 0.15
}
```

Внутри ранкера дополнительные LLM-сигналы не теряются:

- `communication_quality` входит в `skills`;
- `availability` и `location_match` входят в `schedule`;
- HR их отдельно не настраивает.

Минимальная vacancy:

```json
{
  "id": "vacancy_cashier_1",
  "title": "Продавец-консультант / кассир",
  "description": "Работа в торговом зале, консультация покупателей, обучение кассе.",
  "mustHave": [
    "опыт общения с клиентами",
    "готовность к сменному графику",
    "аккуратность",
    "готовность обучиться кассе"
  ],
  "niceToHave": [
    "опыт работы с кассой",
    "опыт в рознице",
    "близость к локации",
    "быстрый выход на работу"
  ],
  "responsibilities": [
    "консультировать покупателей",
    "работать с товаром",
    "поддерживать порядок в торговом зале"
  ],
  "schedule": "2/2",
  "location": "Москва",
  "salary": "от 65 000 рублей",
  "weights": {
    "experience": 0.25,
    "skills": 0.30,
    "schedule": 0.30,
    "motivation": 0.15
  },
  "dealBreakers": [
    "не готов к сменному графику",
    "не готов общаться с клиентами",
    "не может выйти в ближайший месяц"
  ]
}
```

## POST /api/prepare-screening

Первый шаг. Парсит резюме и генерирует вопросы.

Request:

```json
{
  "vacancy": {},
  "pdfBase64": "base64_pdf_without_data_url_prefix",
  "pdfText": "optional text instead of PDF"
}
```

Можно передать либо `pdfBase64`, либо `pdfText`. Для прода используется `pdfBase64`, для тестов удобно `pdfText`.

Response:

```json
{
  "profile": {
    "candidateId": "candidate_1",
    "name": "Анна Смирнова",
    "contacts": {
      "phone": null,
      "email": null,
      "telegram": null
    },
    "location": "Москва",
    "workExperience": [],
    "totalExperienceMonths": 8,
    "skills": [],
    "education": null,
    "certificates": [],
    "languages": [],
    "schedulePreferences": "2/2",
    "salaryExpectations": null,
    "availability": "со следующей недели",
    "rawSummary": "Краткое summary резюме",
    "missingFields": []
  },
  "questions": [
    {
      "id": "cashier_experience_check",
      "text": "Есть ли у вас опыт работы с кассой?",
      "signal": "skills_match",
      "type": "single_choice",
      "options": [
        "Да",
        "Нет, но готов(а) обучиться"
      ]
    }
  ],
  "pdfTextPreview": "..."
}
```

Backend должен сохранить:

- `profile`;
- `questions`;
- связь с `vacancy.id` и кандидатом.

## POST /api/rank-candidate

Второй шаг. Принимает ответы кандидата, извлекает scoring-сигналы и считает итоговый результат.

Request:

```json
{
  "vacancy": {},
  "profile": {},
  "questions": [],
  "answers": [
    {
      "questionId": "cashier_experience_check",
      "answer": "Опыта с кассой нет, но готова обучиться"
    }
  ]
}
```

Response:

```json
{
  "profile": {},
  "questions": [],
  "signals": {
    "candidateId": "candidate_1",
    "mustHave": {
      "passed": true,
      "failedReasons": []
    },
    "signals": {
      "experience_match": {
        "score": 0.8,
        "evidence": "Есть опыт работы с клиентами"
      },
      "skills_match": {
        "score": 0.7,
        "evidence": "Готова обучиться кассе"
      },
      "schedule_match": {
        "score": 0.9,
        "evidence": "Готова к графику 2/2"
      },
      "location_match": {
        "score": 0.8,
        "evidence": "Дорога занимает около 25 минут"
      },
      "motivation": {
        "score": 0.75,
        "evidence": "Интересна работа с покупателями"
      },
      "availability": {
        "score": 0.9,
        "evidence": "Готова выйти на следующей неделе"
      },
      "communication_quality": {
        "score": 0.8,
        "evidence": "Ответы конкретные и вежливые"
      }
    },
    "strengths": [],
    "concerns": [],
    "missingInfo": [],
    "possibleAlternativeRoles": [],
    "modelRecommendation": "invite_to_interview",
    "neutralCandidateReply": "Спасибо за ответы! Мы передали вашу анкету рекрутеру..."
  },
  "rankResult": {
    "candidateId": "candidate_1",
    "finalScore": 74,
    "tier": "good_match",
    "recommendedAction": "invite_to_interview",
    "fitSummary": "Кандидат хорошо подходит...",
    "topAdvantages": [
      "Есть опыт работы с клиентами",
      "Готова к сменному графику"
    ],
    "topConcerns": [
      "Нет подтвержденного опыта работы с кассой"
    ],
    "evidence": [
      {
        "label": "Опыт",
        "score": 0.8,
        "evidence": "..."
      },
      {
        "label": "Навыки",
        "score": 0.72,
        "evidence": "..."
      },
      {
        "label": "График",
        "score": 0.88,
        "evidence": "..."
      },
      {
        "label": "Мотивация",
        "score": 0.75,
        "evidence": "..."
      }
    ],
    "missingInfo": [],
    "possibleAlternativeRoles": [],
    "hrExplanation": "Score 74...",
    "neutralCandidateReply": "Спасибо за ответы! Мы передали вашу анкету рекрутеру..."
  }
}
```

Frontend/HR в первую очередь показывает:

- `rankResult.finalScore`;
- `rankResult.tier`;
- `rankResult.recommendedAction`;
- `rankResult.topAdvantages`;
- `rankResult.topConcerns`;
- `rankResult.evidence`;
- `rankResult.hrExplanation`.

## Tier

```text
85-100  top_candidate
70-84   good_match
50-69   manual_review
35-49   weak_match
0-34    not_fit
```

## Must-have логика

Если `signals.mustHave.passed === false`:

```text
finalScore <= 35
tier = not_fit
recommendedAction = reject_or_route_elsewhere
```

## Ошибки

Ошибка приходит так:

```json
{
  "error": "CandidateSignals не прошел валидацию"
}
```

Типовые причины:

- невалидный `vacancy`;
- невалидные `answers`;
- Gemini вернул JSON не по схеме;
- из PDF не удалось извлечь текст.

## Локальная проверка

```bash
curl -X POST http://127.0.0.1:3000/api/demo \
  -H "content-type: application/json" \
  -d '{}'
```
