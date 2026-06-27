# Smart Resume Analyzer 🚀

> An AI-powered full-stack web app that analyzes a resume PDF against a job description using NLP and keyword matching — built with **FastAPI**, **Python**, **pdfplumber**, **NLTK**, and a pure **HTML/CSS/JS** frontend.

---

## ✨ Features

- 📄 **PDF Resume Upload** — drag-and-drop or click to upload
- 💼 **Job Description Analysis** — paste any JD text
- 📊 **Match Score** — animated SVG ring showing 0–100% compatibility
- ✅ **Matched Skills** — skills found in both resume and JD
- ❌ **Missing Skills** — gaps to fill before applying
- 💡 **Improvement Suggestions** — personalized, actionable tips
- 🔍 **200+ Skills Tracked** — Python, AWS, Docker, SQL, React, ML, and more
- 🌐 **Premium Dark UI** — glassmorphism, gradient animations, fully responsive

---

## 🛠️ Tech Stack

| Layer        | Technology                          |
|-------------|--------------------------------------|
| Backend      | FastAPI (Python)                    |
| PDF Parsing  | pdfplumber                          |
| NLP Engine   | NLTK + custom keyword matching      |
| API Protocol | REST (JSON over HTTP)               |
| Frontend     | Vanilla HTML5 + CSS3 + JavaScript   |
| Fonts        | Google Fonts (Inter + JetBrains Mono)|

---

## 📁 Project Structure

```
smart-resume-analyzer/
├── backend/
│   ├── main.py             # FastAPI app — /analyze endpoint
│   ├── analyzer.py         # PDF parsing + NLP analysis logic
│   ├── skill_keywords.py   # 200+ curated tech & soft skills
│   └── requirements.txt
├── frontend/
│   ├── index.html          # Main UI
│   ├── style.css           # Dark theme, animations
│   └── script.js           # Fetch API + dynamic rendering
└── README.md
```

---

## 🚀 Getting Started

### 1. Install Python dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the backend API

```bash
python main.py
```

The API will start at `http://127.0.0.1:8000`
- Swagger docs: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/health

### 3. Open the frontend

Simply open `frontend/index.html` in your browser (double-click it).

> **Note:** Make sure the backend is running first before using the frontend.

---

## 🔌 API Reference

### `POST /analyze`

Analyzes a resume against a job description.

**Request:** `multipart/form-data`

| Field             | Type   | Description                    |
|------------------|--------|--------------------------------|
| `resume`          | File   | PDF resume file                |
| `job_description` | string | Full text of job description   |

**Response:** JSON

```json
{
  "score": 72,
  "score_label": "Good Match",
  "score_color": "good",
  "matched_skills": ["python", "fastapi", "postgresql", "git"],
  "missing_skills": ["docker", "kubernetes", "aws"],
  "resume_tech_skills": ["python", "fastapi", "sql", ...],
  "resume_soft_skills": ["communication", "teamwork"],
  "jd_tech_skills": ["python", "docker", "aws", ...],
  "sections_found": ["experience", "education", "skills", "projects"],
  "suggestions": [
    "Add Docker containerization experience — it's highly sought after.",
    ...
  ],
  "resume_word_count": 450,
  "jd_word_count": 280
}
```

---

## 🎯 How It Works

1. **PDF Parsing** — `pdfplumber` extracts raw text from the uploaded resume
2. **Keyword Extraction** — NLTK tokenizes and filters stopwords; n-grams (1–3) are matched against a curated skill dictionary
3. **Scoring** — Weighted formula: 70% skill match (Jaccard similarity) + 30% general keyword overlap
4. **Suggestions** — Contextual tips generated based on missing skills and overall score

---

## 📸 Screenshots

*Upload your resume → Get instant results with score, skill gaps & suggestions*

---

## 📝 License

MIT License — free to use, fork, and modify.

---

*Built as a portfolio project to showcase Python backend + frontend integration skills.*
