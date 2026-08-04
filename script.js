/**
 * ResumeAI — Script
 * Auros design system edition
 * Handles: particle sphere, drag-and-drop, API calls, animated results
 */

// ─── CONFIG ───────────────────────────────────────────────
const API_BASE   = "https://smart-resume-analyzer-1fhc.onrender.com";
const ANALYZE_URL = `${API_BASE}/analyze`;

// ─── DOM REFS ─────────────────────────────────────────────
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

const resultsSection = document.getElementById("resultsSection");

// Score elements
const scoreNumber   = document.getElementById("scoreNumber");
const scoreLabel    = document.getElementById("scoreLabel");
const scoreMeta     = document.getElementById("scoreMeta");
const ringFill      = document.getElementById("ringFill");
const ringPct       = document.getElementById("ringPct");
const matchedCount  = document.getElementById("matchedCount");
const missingCount  = document.getElementById("missingCount");
const matchedBadge  = document.getElementById("matchedBadge");
const missingBadge  = document.getElementById("missingBadge");

// Skills lists
const matchedList    = document.getElementById("matchedSkillsList");
const missingList    = document.getElementById("missingSkillsList");
const resumeTechList = document.getElementById("resumeTechList");
const resumeSoftList = document.getElementById("resumeSoftList");
const sectionsList   = document.getElementById("sectionsList");
const suggestionsList= document.getElementById("suggestionsList");

const reanalyzeBtn  = document.getElementById("reanalyzeBtn");

// ─── STATE ────────────────────────────────────────────────
let selectedFile = null;

// ═══════════════════════════════════════════════════════════
//  PARTICLE SPHERE — 3D rotating bioluminescent orb
// ═══════════════════════════════════════════════════════════
(function initParticleSphere() {
  const canvas = document.getElementById("particleSphere");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const N   = 700;

  // Auros bioluminescent palette
  const COLORS = [
    "#00827c", "#00827c", "#00827c", // teal dominant
    "#cbfffc", "#cbfffc",             // pale aqua
    "#edfffe",                        // mist
    "#ffffff",                        // white
    "#fde9ff",                        // lavender phosphor accent
  ];

  let W, H, particles = [];
  let angle = 0;
  let raf;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function buildParticles() {
    particles = [];
    for (let i = 0; i < N; i++) {
      // Uniform distribution on sphere surface
      const u = Math.random();
      const v = Math.random();
      const theta = Math.acos(2 * u - 1);
      const phi   = 2 * Math.PI * v;
      particles.push({
        theta,
        phi,
        size:  Math.random() * 1.8 + 0.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Sphere center — right side of canvas
    const cx = W * 0.74;
    const cy = H * 0.50;
    const R  = Math.min(W, H) * 0.30;

    // Project particles & sort by Z for painter's algorithm
    const pts = particles.map(p => {
      const sinT = Math.sin(p.theta);
      const cosT = Math.cos(p.theta);
      const sinP = Math.sin(p.phi + angle);
      const cosP = Math.cos(p.phi + angle);

      return {
        px:    cx + R * sinT * cosP,
        py:    cy + R * sinT * sinP,
        pz:    R  * cosT,
        size:  p.size,
        color: p.color,
      };
    }).sort((a, b) => a.pz - b.pz);   // back-to-front

    for (const p of pts) {
      // Depth: 0 (back) → 1 (front)
      const depth = (p.pz + R) / (2 * R);
      if (depth < 0.04) continue;

      const alpha  = 0.12 + depth * 0.88;
      const radius = p.size * (0.3 + depth * 0.7);

      ctx.globalAlpha = alpha;
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.arc(p.px, p.py, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    angle += 0.0028;
    raf = requestAnimationFrame(draw);
  }

  function start() {
    resize();
    buildParticles();
    draw();
  }

  // Pause when not visible (perf)
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      if (!raf) draw();
    } else {
      cancelAnimationFrame(raf);
      raf = null;
    }
  });
  observer.observe(canvas);

  window.addEventListener("resize", () => {
    resize();
  }, { passive: true });

  start();
})();

// ═══════════════════════════════════════════════════════════
//  FILE UPLOAD
// ═══════════════════════════════════════════════════════════

// Keyboard support (click handled natively by the invisible file input)
dropZone.addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") fileInput.click();
});

// Drag events
["dragenter", "dragover"].forEach(evt =>
  dropZone.addEventListener(evt, e => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  })
);
["dragleave", "dragend", "drop"].forEach(evt =>
  dropZone.addEventListener(evt, () => dropZone.classList.remove("dragover"))
);
dropZone.addEventListener("drop", e => {
  e.preventDefault();
  if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files[0]);
});

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) handleFileSelect(fileInput.files[0]);
});

function handleFileSelect(file) {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    showError("Please select a PDF file.");
    return;
  }
  selectedFile   = file;
  fileName.textContent = file.name;
  fileSize.textContent = formatBytes(file.size);
  filePreview.classList.remove("hidden");
  hideError();
}

fileRemove.addEventListener("click", e => {
  e.stopPropagation();
  selectedFile = null;
  fileInput.value = "";
  filePreview.classList.add("hidden");
});

function formatBytes(bytes) {
  if (bytes < 1024)            return `${bytes} B`;
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── JD WORD COUNTER ──────────────────────────────────────
jdTextarea.addEventListener("input", () => {
  const words = jdTextarea.value.trim().split(/\s+/).filter(Boolean).length;
  jdCounter.textContent = `${words} WORD${words !== 1 ? "S" : ""}`;
});

clearJD.addEventListener("click", () => {
  jdTextarea.value = "";
  jdCounter.textContent = "0 WORDS";
});

// ─── ERROR ────────────────────────────────────────────────
function showError(msg) {
  errorMsg.textContent = msg;
  errorBanner.classList.remove("hidden");
  errorBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function hideError() {
  errorBanner.classList.add("hidden");
}
errorClose.addEventListener("click", hideError);

// ─── LOADING STEPS ────────────────────────────────────────
const STEPS = [
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
  loadingStep.textContent = STEPS[0];
  stepInterval = setInterval(() => {
    i = (i + 1) % STEPS.length;
    loadingStep.textContent = STEPS[i];
  }, 900);
}
function stopLoading() {
  clearInterval(stepInterval);
  loadingState.classList.add("hidden");
}

// ─── FORM SUBMIT ──────────────────────────────────────────
form.addEventListener("submit", async e => {
  e.preventDefault();
  hideError();

  if (!selectedFile) {
    showError("Please upload your resume PDF.");
    return;
  }
  const jd = jdTextarea.value.trim();
  if (jd.length < 50) {
    showError("Please paste a complete job description (at least 50 characters).");
    return;
  }

  analyzeBtn.disabled = true;
  btnText.textContent = "Analyzing…";
  resultsSection.classList.add("hidden");
  startLoading();

  const formData = new FormData();
  formData.append("resume", selectedFile);
  formData.append("job_description", jd);

  try {
    const res = await fetch(ANALYZE_URL, { method: "POST", body: formData });

    if (!res.ok) {
      let detail = `Server error (${res.status})`;
      try {
        const err = await res.json();
        detail = err.detail || detail;
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
      msg = "Cannot connect to the API. The backend may be starting up — try again in 30 seconds.";
    }
    showError(msg);
  } finally {
    analyzeBtn.disabled = false;
    btnText.textContent = "Run Analysis";
  }
});

// ─── RENDER RESULTS ───────────────────────────────────────
function renderResults(data) {
  resultsSection.classList.remove("hidden");
  setTimeout(() => {
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);

  // Animate score
  animateScore(data.score, data.score_label, data.score_color);

  // Counts + badges
  matchedCount.textContent  = data.matched_skills.length;
  missingCount.textContent  = data.missing_skills.length;
  matchedBadge.textContent  = data.matched_skills.length;
  missingBadge.textContent  = data.missing_skills.length;

  // Meta
  scoreMeta.textContent = `Resume: ${data.resume_word_count} words · JD: ${data.jd_word_count} words`;

  // Chips
  renderChips(matchedList,    data.matched_skills,    "chip-matched", "No matched skills found.");
  renderChips(missingList,    data.missing_skills,    "chip-missing", "🎉 No missing skills — perfect match!");
  renderChips(resumeTechList, data.resume_tech_skills,"chip-tech",    "No technical skills detected.");
  renderChips(resumeSoftList, data.resume_soft_skills,"chip-soft",    "No soft skills detected.");

  renderSections(data.sections_found);
  renderSuggestions(data.suggestions);
}

// ─── SCORE ANIMATION ──────────────────────────────────────
function animateScore(target, label, colorClass) {
  const circumference = 402.12; // 2π × 64
  const duration      = 1500;
  const start         = performance.now();

  // Verdict label
  scoreLabel.textContent = label;
  scoreLabel.className   = `score-stat-verdict ${colorClass}`;

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = easeOutCubic(progress);
    const current  = Math.round(eased * target);

    scoreNumber.textContent = current;
    if (ringPct) ringPct.textContent = `${current}%`;

    ringFill.style.strokeDashoffset =
      circumference - (eased * target / 100) * circumference;

    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// ─── CHIPS ────────────────────────────────────────────────
function renderChips(container, skills, cls, emptyMsg) {
  container.innerHTML = "";
  if (!skills || skills.length === 0) {
    const el = document.createElement("span");
    el.className   = "chip chip-empty";
    el.textContent = emptyMsg;
    container.appendChild(el);
    return;
  }
  skills.forEach((skill, i) => {
    const chip = document.createElement("span");
    chip.className = `chip ${cls}`;
    chip.textContent = skill;
    chip.style.animationDelay = `${i * 35}ms`;
    chip.setAttribute("role", "listitem");
    container.appendChild(chip);
  });
}

// ─── SECTIONS ─────────────────────────────────────────────
function renderSections(sections) {
  sectionsList.innerHTML = "";
  if (!sections || sections.length === 0) {
    sectionsList.innerHTML = `<span class="chip chip-empty">No sections detected.</span>`;
    return;
  }
  sections.forEach((sec, i) => {
    const item = document.createElement("div");
    item.className = "section-item";
    item.style.animationDelay = `${i * 55}ms`;
    item.setAttribute("role", "listitem");
    item.innerHTML = `
      <span class="section-check">OK</span>
      <span>${sec.charAt(0).toUpperCase() + sec.slice(1)}</span>
    `;
    sectionsList.appendChild(item);
  });
}

// ─── SUGGESTIONS ──────────────────────────────────────────
function renderSuggestions(suggestions) {
  suggestionsList.innerHTML = "";
  if (!suggestions || suggestions.length === 0) {
    suggestionsList.innerHTML = `<li class="chip chip-empty">No suggestions — your resume looks great!</li>`;
    return;
  }
  suggestions.forEach((tip, i) => {
    const li = document.createElement("li");
    li.className = "suggestion-item";
    li.style.animationDelay = `${i * 65}ms`;
    li.innerHTML = `
      <span class="suggestion-num">${String(i + 1).padStart(2, "0")}</span>
      <span>${tip}</span>
    `;
    suggestionsList.appendChild(li);
  });
}

// ─── RE-ANALYZE ───────────────────────────────────────────
reanalyzeBtn.addEventListener("click", () => {
  resultsSection.classList.add("hidden");
  selectedFile = null;
  fileInput.value = "";
  filePreview.classList.add("hidden");
  jdTextarea.value = "";
  jdCounter.textContent = "0 WORDS";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  console.log("🌊 ResumeAI — Auros Edition loaded");
  console.log("📡 API:", ANALYZE_URL);
});
