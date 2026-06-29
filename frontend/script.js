/**
 * Smart Resume Analyzer — Frontend Script
 * Handles: drag-and-drop upload, API calls, animated results rendering
 */

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// 🚀 Deployed backend on Render
const API_BASE = "https://smart-resume-analyzer-1fhc.onrender.com";
const ANALYZE_URL = `${API_BASE}/analyze`;

// ─── DOM REFS ─────────────────────────────────────────────────────────────────
const form          = document.getElementById("analyzeForm");
const dropZone      = document.getElementById("dropZone");
const fileInput     = document.getElementById("resumeFile");
const filePreview   = document.getElementById("filePreview");
const fileName      = document.getElementById("fileName");
const fileSize      = document.getElementById("fileSize");
const fileRemove    = document.getElementById("fileRemove");

const jdTextarea    = document.getElementById("jobDescription");
const jdCounter     = document.getElementById("jd-counter");
const clearJD       = document.getElementById("clearJD");

const analyzeBtn    = document.getElementById("analyzeBtn");
const btnText       = analyzeBtn.querySelector(".btn-text");

const errorBanner   = document.getElementById("errorBanner");
const errorMsg      = document.getElementById("errorMessage");
const errorClose    = document.getElementById("errorClose");

const loadingState  = document.getElementById("loadingState");
const loadingStep   = document.getElementById("loadingStep");

const resultsSection= document.getElementById("resultsSection");

// Score elements
const scoreNumber   = document.getElementById("scoreNumber");
const scoreLabel    = document.getElementById("scoreLabel");
const scoreMeta     = document.getElementById("scoreMeta");
const ringFill      = document.getElementById("ringFill");
const matchedCount  = document.getElementById("matchedCount");
const missingCount  = document.getElementById("missingCount");
const matchedBadge  = document.getElementById("matchedBadge");
const missingBadge  = document.getElementById("missingBadge");

// Skills lists
const matchedList   = document.getElementById("matchedSkillsList");
const missingList   = document.getElementById("missingSkillsList");
const resumeTechList= document.getElementById("resumeTechList");
const resumeSoftList= document.getElementById("resumeSoftList");
const sectionsList  = document.getElementById("sectionsList");
const suggestionsList= document.getElementById("suggestionsList");

const reanalyzeBtn  = document.getElementById("reanalyzeBtn");

// ─── STATE ────────────────────────────────────────────────────────────────────
let selectedFile = null;

// SVG gradient already defined inline in HTML

// ─── FILE UPLOAD HANDLING ─────────────────────────────────────────────────────

// Keyboard support for drop zone (click handled natively by the invisible file input)
dropZone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") fileInput.click();
});

// Drag events
["dragenter", "dragover"].forEach(evt =>
  dropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  })
);
["dragleave", "dragend", "drop"].forEach(evt =>
  dropZone.addEventListener(evt, () => dropZone.classList.remove("dragover"))
);
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  if (files.length > 0) handleFileSelect(files[0]);
});

// File input change
fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) handleFileSelect(fileInput.files[0]);
});

function handleFileSelect(file) {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    showError("Please select a PDF file.");
    return;
  }
  selectedFile = file;
  fileName.textContent = file.name;
  fileSize.textContent = formatBytes(file.size);
  filePreview.classList.remove("hidden");
  hideError();
}

fileRemove.addEventListener("click", (e) => {
  e.stopPropagation();
  selectedFile = null;
  fileInput.value = "";
  filePreview.classList.add("hidden");
});

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── JD WORD COUNTER ─────────────────────────────────────────────────────────
jdTextarea.addEventListener("input", () => {
  const words = jdTextarea.value.trim().split(/\s+/).filter(Boolean).length;
  jdCounter.textContent = `${words} word${words !== 1 ? "s" : ""}`;
});

clearJD.addEventListener("click", () => {
  jdTextarea.value = "";
  jdCounter.textContent = "0 words";
});

// ─── ERROR HANDLING ───────────────────────────────────────────────────────────
function showError(msg) {
  errorMsg.textContent = msg;
  errorBanner.classList.remove("hidden");
  errorBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function hideError() {
  errorBanner.classList.add("hidden");
}
errorClose.addEventListener("click", hideError);

// ─── LOADING STEPS ────────────────────────────────────────────────────────────
const loadingSteps = [
  "Parsing PDF content…",
  "Extracting keywords & skills…",
  "Comparing with job description…",
  "Computing match score…",
  "Generating suggestions…",
];
let stepInterval = null;

function startLoading() {
  loadingState.classList.remove("hidden");
  let i = 0;
  loadingStep.textContent = loadingSteps[0];
  stepInterval = setInterval(() => {
    i = (i + 1) % loadingSteps.length;
    loadingStep.textContent = loadingSteps[i];
  }, 900);
}
function stopLoading() {
  clearInterval(stepInterval);
  loadingState.classList.add("hidden");
}

// ─── FORM SUBMIT ──────────────────────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError();

  // Validate
  if (!selectedFile) {
    showError("Please upload your resume PDF.");
    return;
  }
  const jd = jdTextarea.value.trim();
  if (jd.length < 50) {
    showError("Please paste a complete job description (at least 50 characters).");
    return;
  }

  // UI: enter loading state
  analyzeBtn.disabled = true;
  btnText.textContent = "Analyzing…";
  resultsSection.classList.add("hidden");
  startLoading();

  // Build FormData
  const formData = new FormData();
  formData.append("resume", selectedFile);
  formData.append("job_description", jd);

  try {
    const res = await fetch(ANALYZE_URL, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      let detail = `Server error (${res.status})`;
      try {
        const errData = await res.json();
        detail = errData.detail || detail;
      } catch (_) {}
      throw new Error(detail);
    }

    const data = await res.json();
    stopLoading();
    renderResults(data);

  } catch (err) {
    stopLoading();
    let msg = err.message || "Failed to connect to the API.";
    if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed to fetch")) {
      msg = "Cannot connect to the API. Make sure the backend server is running on http://127.0.0.1:8000";
    }
    showError(msg);
  } finally {
    analyzeBtn.disabled = false;
    btnText.textContent = "Run Analysis";
  }
});

// ─── RENDER RESULTS ───────────────────────────────────────────────────────────
function renderResults(data) {
  // Scroll to results
  resultsSection.classList.remove("hidden");
  setTimeout(() => {
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);

  // Score ring animation
  animateScore(data.score, data.score_label, data.score_color);

  // Counts
  matchedCount.textContent = data.matched_skills.length;
  missingCount.textContent = data.missing_skills.length;
  matchedBadge.textContent = data.matched_skills.length;
  missingBadge.textContent = data.missing_skills.length;

  // Meta
  scoreMeta.textContent = `Resume: ${data.resume_word_count} words · JD: ${data.jd_word_count} words`;

  // Skills chips
  renderChips(matchedList, data.matched_skills, "chip-matched", "No matched skills found.");
  renderChips(missingList, data.missing_skills, "chip-missing", "🎉 No missing skills — great match!");
  renderChips(resumeTechList, data.resume_tech_skills, "chip-tech", "No technical skills detected.");
  renderChips(resumeSoftList, data.resume_soft_skills, "chip-soft", "No soft skills detected.");

  // Resume sections
  renderSections(data.sections_found);

  // Suggestions
  renderSuggestions(data.suggestions);
}

// Animate score number + bar + ring
function animateScore(targetScore, label, colorClass) {
  const circumference = 301.59; // 2π × 48 (new ring radius)
  const duration = 1500;
  const start = performance.now();

  // Set verdict label
  scoreLabel.textContent = label;
  scoreLabel.className = `rsp-verdict ${colorClass}`;

  // Score bar element
  const scoreBar = document.getElementById("scoreBar");
  // Ring pct text
  const ringPct = document.getElementById("ringPct");

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);

    const current = Math.round(eased * targetScore);
    scoreNumber.textContent = current;
    if (ringPct) ringPct.textContent = `${current}%`;

    // Animate score bar
    if (scoreBar) scoreBar.style.width = `${eased * targetScore}%`;

    // Animate ring
    const offset = circumference - (eased * targetScore / 100) * circumference;
    ringFill.style.strokeDashoffset = offset;

    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Render skill chips
function renderChips(container, skills, chipClass, emptyMsg) {
  container.innerHTML = "";
  if (!skills || skills.length === 0) {
    const el = document.createElement("span");
    el.className = "chip chip-empty";
    el.textContent = emptyMsg;
    container.appendChild(el);
    return;
  }
  skills.forEach((skill, i) => {
    const chip = document.createElement("span");
    chip.className = `chip ${chipClass}`;
    chip.textContent = skill;
    chip.style.animationDelay = `${i * 40}ms`;
    chip.setAttribute("role", "listitem");
    container.appendChild(chip);
  });
}

// Render section items
function renderSections(sections) {
  sectionsList.innerHTML = "";
  if (!sections || sections.length === 0) {
    sectionsList.innerHTML = `<span class="chip chip-empty">No sections detected.</span>`;
    return;
  }
  sections.forEach((sec, i) => {
    const item = document.createElement("div");
    item.className = "section-item";
    item.style.animationDelay = `${i * 60}ms`;
    item.setAttribute("role", "listitem");
    item.innerHTML = `
      <span class="section-check">OK</span>
      <span>${sec.charAt(0).toUpperCase() + sec.slice(1)}</span>
    `;
    sectionsList.appendChild(item);
  });
}

// Render suggestions
function renderSuggestions(suggestions) {
  suggestionsList.innerHTML = "";
  if (!suggestions || suggestions.length === 0) {
    suggestionsList.innerHTML = `<li class="chip chip-empty">No suggestions — your resume looks great!</li>`;
    return;
  }
  suggestions.forEach((tip, i) => {
    const li = document.createElement("li");
    li.className = "suggestion-item";
    li.style.animationDelay = `${i * 70}ms`;
    li.innerHTML = `
      <span class="suggestion-num">${i + 1}</span>
      <span>${tip}</span>
    `;
    suggestionsList.appendChild(li);
  });
}

// ─── RE-ANALYZE ───────────────────────────────────────────────────────────────
reanalyzeBtn.addEventListener("click", () => {
  resultsSection.classList.add("hidden");
  // Reset file
  selectedFile = null;
  fileInput.value = "";
  filePreview.classList.add("hidden");
  // Reset JD
  jdTextarea.value = "";
  jdCounter.textContent = "0 words";
  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ─── SMOOTH SCROLL ON LOAD ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Smart Resume Analyzer loaded");
  console.log("📡 API endpoint:", ANALYZE_URL);
});
