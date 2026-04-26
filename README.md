# Agentiki Screening ML

ML-слой для AI-скрининга кандидатов. Модуль не зависит от фронта и бека: его можно импортировать из Node API или запускать отдельным сервисом.

## Что делает

- парсит резюме в структурированный профиль кандидата;
- генерирует 3-5 уточняющих вопросов под вакансию;
- парсит ответы кандидата в сигналы для ранжирования;
- считает временный rule-based fit score;
- генерирует объяснение для HR;
- возвращает нейтральный ответ для кандидата без раскрытия score.

## Gemini

По умолчанию используется `gemini-3-flash-preview`.

```bash
cp .env.example .env
export GEMINI_API_KEY=...
export GEMINI_MODEL=gemini-3-flash-preview
```

Если `GEMINI_API_KEY` не задан, pipeline работает на mock-логике. Это удобно для фронта и бека, пока нет ключа или интернета.

## Запуск демо

```bash
npm run demo
```

## Тесты

```bash
npm test
```

## Использование из backend

```js
import { runScreeningPipeline } from "./src/ml/index.js";

const result = await runScreeningPipeline({
  vacancy: {
    id: "intern-js-001",
    title: "Стажер frontend-разработчик",
    roleType: "internship",
    mustHave: ["javascript", "react"],
    niceToHave: ["typescript", "node"],
    stopFactors: ["не готов к стажировке"]
  },
  resume: {
    text: "Resume text here"
  },
  answers: {
    q1: "Хочу развиваться во frontend",
    q2: "Готов приступить сразу",
    q3: "Есть проекты на React"
  }
});
```

Если резюме приходит PDF-файлом:

```js
const result = await runScreeningPipeline({
  vacancy,
  resume: {
    file: {
      mimeType: "application/pdf",
      base64: "..."
    }
  }
});
```

Без `answers` pipeline вернет статус `questions_ready` и список вопросов. С `answers` вернет `screening_completed`, `ranking`, `recruiterExplanation` и `candidateReply`.

## Контракт результата

```js
{
  status: "screening_completed",
  candidateProfile: {},
  questions: [],
  candidateSignals: {},
  ranking: {
    score: 87,
    category: "high_fit",
    reasons: [],
    risks: [],
    matchedMustHave: [],
    matchedNiceToHave: [],
    modelVersion: "rules-v0.1"
  },
  recruiterExplanation: {},
  candidateReply: {
    title: "Спасибо, ответы получены",
    message: "Рекрутер изучит анкету и свяжется с вами по дальнейшим шагам.",
    exposeScore: false
  }
}
```

## Важное продуктовое ограничение

Кандидату не показываются score, категория и причины ранжирования. Эти данные доступны только HR, а финальное решение остается за рекрутером.
