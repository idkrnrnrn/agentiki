# Agentiki Screening MVP

MVP AI-скрининга резюме для массового подбора. Gemini извлекает факты и scoring-сигналы, а финальный score считает детерминированный ranker в коде. Модель не принимает решение о найме.

## Запуск

```bash
npm install
cp .env.example .env
npm run dev
```

Dashboard: http://127.0.0.1:3000

Для работы с Gemini:

```bash
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3-flash-preview
```

Без `GEMINI_API_KEY` приложение работает на mock/demo-логике, чтобы можно было показывать продукт на хакатоне.

## Команды

```bash
npm run dev   # HR dashboard + API
npm run demo  # печатает RankResult demo-кандидата
npm test      # unit tests для rankCandidate
```

## Что реализовано

- PDF upload и извлечение текста через `pdf-parse`.
- `parseResumeWithGemini(pdfText)` -> `CandidateProfile`.
- `generateScreeningQuestions(vacancy, profile)` -> 3-5 вопросов.
- `extractCandidateSignals(vacancy, profile, answers)` -> `CandidateSignals`.
- Zod-валидация всех ответов Gemini.
- Детерминированный `rankCandidate(vacancy, signals)` -> `RankResult`.
- HR dashboard с заметными блоками:
  - "Почему подходит"
  - "Что проверить"
  - evidence breakdown
  - neutral candidate reply

## Файлы

- `src/ml/types.ts` — TypeScript-контракты.
- `src/ml/schemas.ts` — Zod-схемы и валидация.
- `src/ml/prompts.ts` — Gemini prompts.
- `src/ml/gemini.ts` — вызовы Gemini и validation guard.
- `src/ml/ranker.ts` — deterministic ranker.
- `src/ml/demoData.ts` — demo vacancy/profile/answers/signals.
- `src/ml/pdf.ts` — извлечение текста из PDF.
- `src/server.ts` — локальный API + static UI.
- `public/` — простой HR Dashboard.

## API

`GET /api/vacancy`

Возвращает demo vacancy.

`POST /api/prepare-screening`

```json
{
  "vacancy": {},
  "pdfBase64": "...",
  "pdfText": "optional text instead of PDF"
}
```

Возвращает `CandidateProfile` и `ScreeningQuestion[]`.

`POST /api/rank-candidate`

```json
{
  "vacancy": {},
  "profile": {},
  "answers": [
    { "questionId": "q1", "answer": "..." }
  ]
}
```

Возвращает `signals` и `rankResult`.

`POST /api/demo`

Возвращает готовый demo `RankResult` без Gemini и PDF.

## Product Guardrails

- Не используем возраст, пол, фото, внешность, национальность, религию, семейное положение, здоровье и похожие protected attributes.
- Gemini только извлекает факты, сигналы, преимущества, риски и нейтральный ответ.
- Финальный score и tier считает обычная функция.
- Кандидату не показываются score, tier и причины ранжирования.
- Финальное решение всегда остается за HR.
