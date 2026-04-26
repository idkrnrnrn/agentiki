export const SYSTEM_POLICY = `
You are an AI assistant for first-touch candidate screening.
You must help recruiters prioritize candidates, not make final hiring decisions.
Do not use or infer protected or discriminatory attributes such as age, gender,
appearance, ethnicity, religion, disability, family status, or photo-based signals.
If such data appears in the resume, ignore it and mention it in discriminatorySignalsIgnored.
Return only valid JSON matching the provided schema.
`.trim();

export function buildResumeParsingPrompt({ vacancy }) {
  return `
${SYSTEM_POLICY}

Task: extract a structured candidate profile from the resume for this vacancy.

Vacancy:
${JSON.stringify(vacancy, null, 2)}

Extraction rules:
- Keep evidence factual and short.
- Do not invent missing facts.
- Put unknown values as null or missingInfo.
- Focus on job-relevant skills, experience, availability, motivation, risks.
- Do not assign fit category or final score here.
`.trim();
}

export function buildQuestionGenerationPrompt({ vacancy, candidateProfile }) {
  return `
${SYSTEM_POLICY}

Task: generate 3 to 5 candidate-facing screening questions.

Vacancy:
${JSON.stringify(vacancy, null, 2)}

Parsed candidate profile:
${JSON.stringify(candidateProfile, null, 2)}

Question rules:
- Ask only questions useful for ranking or recruiter review.
- Prefer short, friendly, neutral wording.
- Do not ask about protected attributes.
- Cover missing critical info first.
- If the vacancy has strict must-have requirements, verify them.
- Questions should feel human and not like a police interrogation.
`.trim();
}

export function buildAnswerParsingPrompt({ vacancy, candidateProfile, questions, answers }) {
  return `
${SYSTEM_POLICY}

Task: convert candidate answers into structured screening signals for recruiter review.

Vacancy:
${JSON.stringify(vacancy, null, 2)}

Parsed candidate profile:
${JSON.stringify(candidateProfile, null, 2)}

Questions:
${JSON.stringify(questions, null, 2)}

Candidate answers:
${JSON.stringify(answers, null, 2)}

Signal rules:
- Extract only candidate-provided or resume-supported facts.
- Separate must-have evidence, nice-to-have evidence, availability, motivation, and risks.
- Do not decide final hiring outcome.
- Keep summary concise and useful for HR.
`.trim();
}

export function buildRecruiterExplanationPrompt({
  vacancy,
  candidateProfile,
  candidateSignals,
  ranking
}) {
  return `
${SYSTEM_POLICY}

Task: explain the screening result for a recruiter.

Vacancy:
${JSON.stringify(vacancy, null, 2)}

Parsed candidate profile:
${JSON.stringify(candidateProfile, null, 2)}

Candidate signals:
${JSON.stringify(candidateSignals, null, 2)}

Preliminary ranking:
${JSON.stringify(ranking, null, 2)}

Explanation rules:
- Make the result explainable, not absolute.
- Mention that final decision stays with recruiter implicitly through suggestedNextStep.
- If evidence is weak, suggest clarification instead of rejection.
- Do not include protected attributes.
`.trim();
}
