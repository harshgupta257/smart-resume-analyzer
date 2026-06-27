# analyzer.py
# Core resume analysis logic: PDF parsing, keyword extraction, scoring, suggestions

import re
import io
from typing import Dict, List, Tuple
import pdfplumber
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from skill_keywords import ALL_SKILLS, TECH_SKILLS, SOFT_SKILLS

# Download required NLTK data (runs once)
def download_nltk_data():
    packages = ["punkt", "stopwords", "punkt_tab"]
    for pkg in packages:
        try:
            nltk.download(pkg, quiet=True)
        except Exception:
            pass

download_nltk_data()

# ─────────────────────────────────────────────
# PDF PARSING
# ─────────────────────────────────────────────

def parse_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file given its bytes."""
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {str(e)}")
    return text.strip()


# ─────────────────────────────────────────────
# TEXT NORMALIZATION
# ─────────────────────────────────────────────

def normalize_text(text: str) -> str:
    """Lowercase, remove special chars, normalize whitespace."""
    text = text.lower()
    text = re.sub(r"[^\w\s\.+#/]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_ngrams(text: str, n: int) -> List[str]:
    """Extract n-grams from text."""
    words = text.split()
    return [" ".join(words[i:i+n]) for i in range(len(words) - n + 1)]


# ─────────────────────────────────────────────
# KEYWORD EXTRACTION
# ─────────────────────────────────────────────

def extract_skills(text: str) -> Dict[str, List[str]]:
    """
    Extract matched skills from text, split into tech and soft skills.
    Returns dict: {"tech": [...], "soft": [...]}
    """
    normalized = normalize_text(text)

    found_tech = set()
    found_soft = set()

    # Check unigrams, bigrams, trigrams
    for n in [1, 2, 3]:
        ngrams = extract_ngrams(normalized, n)
        for gram in ngrams:
            gram_clean = gram.strip()
            if gram_clean in TECH_SKILLS:
                found_tech.add(gram_clean)
            elif gram_clean in SOFT_SKILLS:
                found_soft.add(gram_clean)

    return {
        "tech": sorted(list(found_tech)),
        "soft": sorted(list(found_soft)),
    }


def extract_keywords_general(text: str) -> set:
    """Extract all meaningful non-stopword tokens from text."""
    try:
        stop_words = set(stopwords.words("english"))
    except Exception:
        stop_words = set()

    normalized = normalize_text(text)
    tokens = normalized.split()
    keywords = {
        t for t in tokens
        if len(t) > 2 and t not in stop_words and not t.isdigit()
    }
    return keywords


# ─────────────────────────────────────────────
# SECTION DETECTION
# ─────────────────────────────────────────────

SECTION_HEADERS = {
    "experience": ["experience", "work experience", "professional experience",
                   "employment", "career", "work history"],
    "education": ["education", "academic", "qualification", "degree", "university",
                  "college", "school"],
    "skills": ["skills", "technical skills", "core competencies", "technologies",
               "tools", "expertise"],
    "projects": ["projects", "project work", "personal projects", "key projects"],
    "certifications": ["certifications", "certificates", "courses", "training"],
    "summary": ["summary", "profile", "objective", "about", "overview"],
}

def detect_sections(text: str) -> Dict[str, str]:
    """Detect and extract sections from resume text."""
    lines = text.split("\n")
    sections = {}
    current_section = "other"
    current_content = []

    for line in lines:
        line_lower = line.lower().strip()
        matched_section = None

        for section, headers in SECTION_HEADERS.items():
            if any(line_lower == h or line_lower.startswith(h) for h in headers):
                matched_section = section
                break

        if matched_section:
            if current_content:
                sections[current_section] = "\n".join(current_content)
            current_section = matched_section
            current_content = []
        else:
            current_content.append(line)

    if current_content:
        sections[current_section] = "\n".join(current_content)

    return sections


# ─────────────────────────────────────────────
# SCORING
# ─────────────────────────────────────────────

def compute_score(
    resume_text: str,
    jd_text: str,
    resume_skills: Dict[str, List[str]],
    jd_skills: Dict[str, List[str]],
) -> Tuple[int, List[str], List[str]]:
    """
    Compute overall match score (0-100).
    Returns: (score, matched_skills, missing_skills)
    """
    # Skill-based matching (weighted heavily)
    resume_all_skills = set(resume_skills["tech"]) | set(resume_skills["soft"])
    jd_all_skills = set(jd_skills["tech"]) | set(jd_skills["soft"])

    matched_skills = sorted(list(resume_all_skills & jd_all_skills))
    missing_skills = sorted(list(jd_all_skills - resume_all_skills))

    # Skill match score (70% weight)
    if jd_all_skills:
        skill_score = len(matched_skills) / len(jd_all_skills)
    else:
        skill_score = 0.5

    # General keyword overlap (30% weight)
    resume_keywords = extract_keywords_general(resume_text)
    jd_keywords = extract_keywords_general(jd_text)

    if jd_keywords:
        common_keywords = resume_keywords & jd_keywords
        keyword_score = len(common_keywords) / len(jd_keywords)
    else:
        keyword_score = 0.5

    # Weighted final score
    raw_score = (skill_score * 0.70) + (keyword_score * 0.30)

    # Clamp and scale to 0–100
    final_score = min(100, max(0, int(raw_score * 100)))

    # Boost: if many matched skills, bump score slightly
    if len(matched_skills) >= 5:
        final_score = min(100, final_score + 5)

    return final_score, matched_skills, missing_skills


# ─────────────────────────────────────────────
# SUGGESTIONS
# ─────────────────────────────────────────────

SKILL_SUGGESTIONS = {
    "docker": "Add Docker containerization experience — it's highly sought after in backend roles.",
    "kubernetes": "Kubernetes experience is valued for senior roles. Consider adding a K8s deployment project.",
    "aws": "AWS cloud experience is in high demand. Even a free-tier project counts.",
    "azure": "Microsoft Azure skills are popular in enterprise environments.",
    "gcp": "Google Cloud experience can differentiate you, especially for data/ML roles.",
    "sql": "Add SQL experience — it's required for almost every backend role.",
    "postgresql": "PostgreSQL is widely used in production systems. Mention any PostgreSQL projects.",
    "mongodb": "NoSQL (MongoDB) is commonly listed in backend job requirements.",
    "redis": "Redis caching skills show performance optimization awareness.",
    "git": "Make sure Git/GitHub is explicitly mentioned in your resume.",
    "ci/cd": "CI/CD pipelines (GitHub Actions, Jenkins) show DevOps awareness.",
    "rest": "REST API design skills should be explicitly mentioned.",
    "graphql": "GraphQL is gaining adoption — consider adding a GraphQL project.",
    "machine learning": "Even basic ML project exposure can differentiate you.",
    "testing": "Mention unit/integration testing experience — it's often required.",
    "pytest": "pytest is the standard Python testing framework. Add it if you use it.",
    "agile": "Agile/Scrum methodology is expected in most tech teams.",
    "communication": "Highlight teamwork and communication skills in your summary.",
    "leadership": "Add leadership examples — leading a project or mentoring someone.",
    "microservices": "Microservices architecture knowledge is highly valued.",
    "linux": "Linux proficiency is expected for most backend roles.",
    "fastapi": "FastAPI is modern and growing fast — great for Python backend roles.",
    "django": "Django experience shows you can build full-featured web apps.",
    "flask": "Flask is widely used for Python APIs and web services.",
}

def generate_suggestions(missing_skills: List[str], score: int) -> List[str]:
    """Generate actionable suggestions based on missing skills and score."""
    suggestions = []

    # Specific skill suggestions
    for skill in missing_skills[:8]:  # Top 8 missing skills
        if skill in SKILL_SUGGESTIONS:
            suggestions.append(SKILL_SUGGESTIONS[skill])

    # Generic suggestions based on score
    if score < 40:
        suggestions.append(
            "Your resume has a low match. Tailor your resume specifically for this job description — use the same keywords they use."
        )
        suggestions.append(
            "Consider adding a 'Skills' section that explicitly lists the technologies mentioned in the JD."
        )
    elif score < 60:
        suggestions.append(
            "Good foundation! Focus on highlighting projects that use the missing skills listed above."
        )
        suggestions.append(
            "Use quantifiable achievements (e.g., 'Reduced API response time by 40%') to strengthen impact."
        )
    elif score < 80:
        suggestions.append(
            "Strong match! Fine-tune your summary/objective to mirror the job description language."
        )
    else:
        suggestions.append(
            "Excellent match! Make sure your resume is ATS-friendly — avoid images and use standard section headings."
        )

    # Always add these
    if not suggestions or len(suggestions) < 2:
        suggestions.append(
            "Use action verbs (Built, Designed, Implemented, Optimized) to make achievements stand out."
        )

    return suggestions[:6]  # Max 6 suggestions


# ─────────────────────────────────────────────
# MAIN ANALYSIS FUNCTION
# ─────────────────────────────────────────────

def analyze_resume(resume_bytes: bytes, job_description: str) -> Dict:
    """
    Full analysis pipeline.
    Returns a structured analysis report dict.
    """
    # 1. Parse PDF
    resume_text = parse_pdf(resume_bytes)
    if not resume_text:
        raise ValueError("Could not extract text from the uploaded PDF. Please ensure it's a text-based PDF (not scanned image).")

    # 2. Extract skills
    resume_skills = extract_skills(resume_text)
    jd_skills = extract_skills(job_description)

    # 3. Detect resume sections
    sections = detect_sections(resume_text)
    sections_found = list(sections.keys())

    # 4. Compute score
    score, matched_skills, missing_skills = compute_score(
        resume_text, job_description, resume_skills, jd_skills
    )

    # 5. Generate suggestions
    suggestions = generate_suggestions(missing_skills, score)

    # 6. Score label
    if score >= 80:
        score_label = "Excellent Match"
        score_color = "excellent"
    elif score >= 60:
        score_label = "Good Match"
        score_color = "good"
    elif score >= 40:
        score_label = "Fair Match"
        score_color = "fair"
    else:
        score_label = "Low Match"
        score_color = "low"

    return {
        "score": score,
        "score_label": score_label,
        "score_color": score_color,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills[:15],  # Limit display
        "resume_tech_skills": resume_skills["tech"],
        "resume_soft_skills": resume_skills["soft"],
        "jd_tech_skills": jd_skills["tech"],
        "sections_found": sections_found,
        "suggestions": suggestions,
        "resume_word_count": len(resume_text.split()),
        "jd_word_count": len(job_description.split()),
    }
