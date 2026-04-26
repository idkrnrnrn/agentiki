let vacancy = null;
let currentProfile = null;
let currentQuestions = [];

const els = {
  vacancyCard: document.getElementById("vacancyCard"),
  runDemoBtn: document.getElementById("runDemoBtn"),
  prepareBtn: document.getElementById("prepareBtn"),
  pdfInput: document.getElementById("pdfInput"),
  resumeText: document.getElementById("resumeText"),
  errorBox: document.getElementById("errorBox"),
  questionsPanel: document.getElementById("questionsPanel"),
  questionsList: document.getElementById("questionsList"),
  rankBtn: document.getElementById("rankBtn"),
  resultPanel: document.getElementById("resultPanel"),
  candidateName: document.getElementById("candidateName"),
  finalScore: document.getElementById("finalScore"),
  tierBadge: document.getElementById("tierBadge"),
  actionBadge: document.getElementById("actionBadge"),
  fitSummary: document.getElementById("fitSummary"),
  hrExplanation: document.getElementById("hrExplanation"),
  advantagesList: document.getElementById("advantagesList"),
  concernsList: document.getElementById("concernsList"),
  evidenceList: document.getElementById("evidenceList"),
  missingInfoList: document.getElementById("missingInfoList"),
  alternativeRolesList: document.getElementById("alternativeRolesList"),
  candidateReply: document.getElementById("candidateReply")
};

init();

async function init() {
  vacancy = await apiGet("/api/vacancy");
  renderVacancy(vacancy);
  setPipelineStatus();

  els.runDemoBtn.addEventListener("click", runDemo);
  els.prepareBtn.addEventListener("click", prepareScreening);
  els.rankBtn.addEventListener("click", rankCandidate);
}

async function runDemo() {
  clearError();
  setPipelineStatus("ranking");
  const result = await apiPost("/api/demo", {});
  vacancy = result.vacancy;
  currentProfile = {
    candidateId: result.rankResult.candidateId,
    name: "Анна Смирнова"
  };
  renderVacancy(vacancy);
  renderRankResult(result.rankResult, currentProfile);
  markAllDone();
}

async function prepareScreening() {
  clearError();
  setPipelineStatus("parsing");

  try {
    const pdfBase64 = els.pdfInput.files[0]
      ? await readFileAsBase64(els.pdfInput.files[0])
      : null;
    const pdfText = els.resumeText.value.trim();

    if (!pdfBase64 && !pdfText) {
      throw new Error("Загрузите PDF или вставьте текст резюме");
    }

    setPipelineStatus("questions");
    const result = await apiPost("/api/prepare-screening", {
      vacancy,
      pdfBase64,
      pdfText
    });

    currentProfile = result.profile;
    currentQuestions = result.questions;
    renderQuestions(currentQuestions);
    setPipelineStatus("answers");
  } catch (error) {
    showError(error);
  }
}

async function rankCandidate() {
  clearError();
  setPipelineStatus("signals");

  try {
    const answers = currentQuestions.map((question) => ({
      questionId: question.id,
      answer: document.querySelector(`[data-answer-for="${question.id}"]`).value.trim()
    }));

    setPipelineStatus("ranking");
    const result = await apiPost("/api/rank-candidate", {
      vacancy,
      profile: currentProfile,
      answers
    });

    renderRankResult(result.rankResult, result.profile);
    markAllDone();
  } catch (error) {
    showError(error);
  }
}

function renderVacancy(item) {
  els.vacancyCard.innerHTML = `
    <strong>${escapeHtml(item.title)}</strong>
    <span>${escapeHtml(item.description)}</span>
    <span><strong>График:</strong> ${escapeHtml(item.schedule ?? "не указан")}</span>
    <span><strong>Локация:</strong> ${escapeHtml(item.location ?? "не указана")}</span>
    <span><strong>Must-have:</strong> ${item.mustHave.map(escapeHtml).join(", ")}</span>
  `;
}

function renderQuestions(questions) {
  els.questionsPanel.hidden = false;
  els.questionsList.innerHTML = questions
    .map((question) => `
      <label class="question-item">
        <span>${escapeHtml(question.text)}</span>
        <span class="signal">${escapeHtml(question.signal)}</span>
        ${question.type === "single_choice"
          ? `<select data-answer-for="${escapeHtml(question.id)}">
              ${(question.options ?? []).map((option) => `<option>${escapeHtml(option)}</option>`).join("")}
            </select>`
          : `<textarea data-answer-for="${escapeHtml(question.id)}" placeholder="Ответ кандидата"></textarea>`}
      </label>
    `)
    .join("");
}

function renderRankResult(rankResult, profile) {
  els.resultPanel.hidden = false;
  els.candidateName.textContent = profile?.name || rankResult.candidateId;
  els.finalScore.textContent = String(rankResult.finalScore);
  els.tierBadge.textContent = rankResult.tier;
  els.actionBadge.textContent = rankResult.recommendedAction;
  els.fitSummary.textContent = rankResult.fitSummary;
  els.hrExplanation.textContent = rankResult.hrExplanation;
  els.candidateReply.textContent = rankResult.neutralCandidateReply;

  renderList(els.advantagesList, rankResult.topAdvantages);
  renderList(els.concernsList, rankResult.topConcerns);
  renderList(els.missingInfoList, rankResult.missingInfo);
  renderList(
    els.alternativeRolesList,
    rankResult.possibleAlternativeRoles.map((item) => `${item.role}: ${item.reason}`)
  );

  els.evidenceList.innerHTML = rankResult.evidence.map((item) => `
    <div class="evidence-item">
      <strong>${escapeHtml(item.label)} · ${Math.round(item.score * 100)}%</strong>
      <div class="bar"><span style="width: ${Math.round(item.score * 100)}%"></span></div>
      <span>${escapeHtml(item.evidence)}</span>
    </div>
  `).join("");
}

function renderList(container, items) {
  container.innerHTML = items.length
    ? items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
    : "<li>Нет данных</li>";
}

function setPipelineStatus(activeStep = null) {
  document.querySelectorAll("#statusList li").forEach((item) => {
    item.classList.remove("active", "done");
    if (activeStep && item.dataset.step === activeStep) {
      item.classList.add("active");
    }
  });
}

function markAllDone() {
  document.querySelectorAll("#statusList li").forEach((item) => {
    item.classList.remove("active");
    item.classList.add("done");
  });
}

async function apiGet(url) {
  const response = await fetch(url);
  return parseApiResponse(response);
}

async function apiPost(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  return parseApiResponse(response);
}

async function parseApiResponse(response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.readAsDataURL(file);
  });
}

function showError(error) {
  els.errorBox.hidden = false;
  els.errorBox.textContent = error instanceof Error ? error.message : String(error);
}

function clearError() {
  els.errorBox.hidden = true;
  els.errorBox.textContent = "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
