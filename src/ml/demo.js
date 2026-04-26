import { runScreeningPipeline } from "./index.js";

const vacancy = {
  id: "intern-js-001",
  title: "Стажер frontend-разработчик",
  roleType: "internship",
  mustHave: ["javascript", "react"],
  niceToHave: ["typescript", "node", "sql"],
  stopFactors: ["не готов к стажировке"],
  conditions: {
    format: "hybrid",
    location: "Москва",
    schedule: "20 часов в неделю"
  }
};

const resume = {
  text: `
Иван Петров
Москва
Frontend intern
Опыт 1 год: учебные проекты на JavaScript, React, TypeScript.
Делал pet-проект с Node API и SQL базой.
`
};

const answers = {
  q1: "Интересна стажировка, хочу расти во frontend и работать с реальным продуктом.",
  q2: "Готов приступить сразу, удобно 20 часов в неделю, гибрид в Москве подходит.",
  q3: "React использовал в учебных проектах, понимаю компоненты, состояние и работу с API."
};

const result = await runScreeningPipeline({ vacancy, resume, answers });
console.log(JSON.stringify(result, null, 2));
