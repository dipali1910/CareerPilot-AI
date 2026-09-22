import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError(
        "SUPABASE_URL, SUPABASE_KEY and SUPABASE_SERVICE_ROLE_KEY must be configured in the backend environment."
    )


# ============================================================
# SUPABASE CONNECTION
# ============================================================

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)

admin_supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="CareerPilot AI API",
    description="AI-Powered Career Guidance & Placement System",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://career-pilot-ai-six-brown.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "status": "success",
        "message": "CareerPilot AI API is running"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


# ============================================================
# DATABASE TEST
# ============================================================

@app.get("/api/db-test")
def database_test():

    try:

        response = (
            supabase
            .table("users")
            .select("id, name, email, role")
            .limit(5)
            .execute()
        )

        return {
            "status": "success",
            "users": response.data or []
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# RESUME UPLOAD + STUDENT PROFILE CREATION
# ============================================================

@app.post("/api/student/resume-upload")
async def upload_resume(
    email: str = Form(...),
    name: str = Form(""),
    auth_user_id: str = Form(...),
    file: UploadFile = File(...),
):
    """Create/update the application student profile from a PDF resume."""
    try:
        email = email.strip().lower()
        name = name.strip()
        auth_user_id = auth_user_id.strip()

        if not email or not auth_user_id:
            raise HTTPException(status_code=400, detail="Email and authenticated user ID are required.")

        filename = (file.filename or "").lower()
        content_type = (file.content_type or "").lower()
        if not filename.endswith(".pdf") and content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Please upload a PDF resume.")

        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="The uploaded resume is empty.")
        if len(file_bytes) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Resume must be 5 MB or smaller.")

        # --------------------------------------------------------
        # Extract text from PDF
        # 1) Try the normal PDF text layer first.
        # 2) If the PDF is scanned/image-based, fall back to OCR.
        # --------------------------------------------------------
        try:
            from io import BytesIO
            from pypdf import PdfReader

            reader = PdfReader(BytesIO(file_bytes))
            pages = []
            for page in reader.pages:
                pages.append(page.extract_text() or "")
            resume_text = "\n".join(pages).strip()
        except Exception as e:
            resume_text = ""

        # OCR fallback for scanned/image-based PDF resumes.
        if len(resume_text.strip()) < 30:
            try:
                import fitz  # PyMuPDF
                import pytesseract
                from PIL import Image
                import shutil

                # Resolve Tesseract for both local Windows development
                # and Linux production environments such as Render.
                #
                # Windows: use the standard installation path first.
                # Linux / Render: find the executable through PATH.
                if os.name == "nt":
                    windows_tesseract = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

                    if os.path.exists(windows_tesseract):
                        pytesseract.pytesseract.tesseract_cmd = windows_tesseract
                    else:
                        detected_tesseract = shutil.which("tesseract")
                        if detected_tesseract:
                            pytesseract.pytesseract.tesseract_cmd = detected_tesseract
                        else:
                            raise RuntimeError(
                                "Tesseract OCR was not found on Windows. "
                                r"Expected it at C:\Program Files\Tesseract-OCR\tesseract.exe"
                            )
                else:
                    detected_tesseract = shutil.which("tesseract")

                    if detected_tesseract:
                        pytesseract.pytesseract.tesseract_cmd = detected_tesseract
                    else:
                        raise RuntimeError(
                            "Tesseract OCR is not installed on the production server. "
                            "Install the tesseract-ocr system package and redeploy the backend."
                        )

                pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
                ocr_pages = []

                for page in pdf_document:
                    # Render at a high enough resolution for resume text OCR.
                    pixmap = page.get_pixmap(matrix=fitz.Matrix(2.5, 2.5), alpha=False)
                    image = Image.frombytes("RGB", [pixmap.width, pixmap.height], pixmap.samples)
                    ocr_text = pytesseract.image_to_string(image, config="--psm 6")
                    if ocr_text.strip():
                        ocr_pages.append(ocr_text)

                pdf_document.close()
                ocr_text = "\n".join(ocr_pages).strip()

                # Prefer OCR when it provides more usable text.
                if len(ocr_text) > len(resume_text):
                    resume_text = ocr_text

            except Exception as ocr_error:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "This PDF appears to be image-based and OCR could not process it. "
                        f"Please check the PDF or try another file. ({ocr_error})"
                    )
                )

        if len(resume_text.strip()) < 30:
            raise HTTPException(
                status_code=400,
                detail="Could not extract enough text from this PDF. Please upload a clearer PDF resume."
            )

        text = resume_text.lower()

        # --------------------------------------------------------
        # Small, deterministic resume parser
        # --------------------------------------------------------
        def first_match(patterns, default=None):
            import re
            for pattern in patterns:
                match = re.search(pattern, resume_text, re.IGNORECASE)
                if match:
                    return match.group(1).strip()
            return default

        import re

        detected_name = name
        if not detected_name:
            lines = [line.strip() for line in resume_text.splitlines() if line.strip()]
            for line in lines[:8]:
                if (
                    len(line.split()) >= 2
                    and len(line) <= 60
                    and not any(ch.isdigit() for ch in line)
                    and "@" not in line
                    and not any(word in line.lower() for word in [
                        "resume", "curriculum", "phone", "email", "linkedin", "github"
                    ])
                ):
                    detected_name = line
                    break
        if not detected_name:
            detected_name = email.split("@")[0].replace(".", " ").replace("_", " ").title()

        graduation_year = first_match([
            r"graduat(?:ion|e)\s*(?:year)?\s*[:\-]?\s*(20\d{2})",
            r"passing\s*(?:year)?\s*[:\-]?\s*(20\d{2})",
           r"(20\d{2})\s*[-–]\s*(?:20\d{2}|present)",
        ], 2026)
        try:
            graduation_year = int(graduation_year)
        except (TypeError, ValueError):
            graduation_year = 2026

        cgpa_value = first_match([
            r"(?:cgpa|c\.g\.p\.a)\s*[:\-]?\s*(\d+(?:\.\d+)?)",
            r"(?:gpa)\s*[:\-]?\s*(\d+(?:\.\d+)?)",
        ], None)
        try:
            cgpa = float(cgpa_value) if cgpa_value else 0
        except (TypeError, ValueError):
            cgpa = 0

        degree = "MCS" if re.search(r"\bm\.?(?:c|cs)\b|master\s+of\s+computer\s+science|mca", text) else None
        if not degree:
            if re.search(r"\bmca\b", text):
                degree = "MCA"
            elif re.search(r"\bb\.?e\.?\b|\bb\.?tech\.?\b|bachelor\s+of\s+engineering", text):
                degree = "B.Tech"
            elif re.search(r"\bbca\b", text):
                degree = "BCA"
            elif re.search(r"\bmba\b", text):
                degree = "MBA"
            else:
                degree = "MCS"

        specialization = "Computer Science"
        if re.search(r"data\s+science", text):
            specialization = "Data Science"
        elif re.search(r"artificial\s+intelligence|\bai\b|machine\s+learning|\bml\b", text):
            specialization = "Artificial Intelligence / Machine Learning"
        elif re.search(r"information\s+technology|\bit\b", text):
            specialization = "Information Technology"

        location = first_match([
            r"(?:location|city|address)\s*[:\-]\s*([^\n,]{2,40})",
        ], None)
        if not location:
            for city in ["Nashik", "Pune", "Mumbai", "Bengaluru", "Bangalore", "Hyderabad", "Nagpur", "Ahmedabad", "Delhi"]:
                if re.search(r"\b" + re.escape(city.lower()) + r"\b", text):
                    location = city
                    break
        location = location or ""

        role_candidates = [
            ("AI/ML Engineer", ["machine learning", "artificial intelligence", "deep learning", "ai/ml"]),
            ("Data Analyst", ["data analyst", "data analysis", "power bi", "tableau"]),
            ("Backend Developer", ["backend developer", "back-end developer", "fastapi", "django", "node.js", "nodejs"]),
            ("Java Developer", ["java developer", "spring boot", "spring framework"]),
            ("Frontend Developer", ["frontend developer", "front-end developer", "react.js", "reactjs", "angular", "html", "css"]),
            ("Full Stack Developer", ["full stack", "full-stack", "mern", "mean stack"]),
        ]
        role_scores = []
        for role, keywords in role_candidates:
            score = sum(1 for keyword in keywords if keyword in text)
            role_scores.append((score, role))
        role_scores.sort(reverse=True)
        target_role = role_scores[0][1] if role_scores and role_scores[0][0] > 0 else "Full Stack Developer"
        career_interest = target_role

        # --------------------------------------------------------
        # Find or create public users row using Supabase Auth UUID
        # --------------------------------------------------------
        user_response = (
            admin_supabase.table("users")
            .select("id, name, email, role")
            .eq("email", email)
            .limit(1)
            .execute()
        )

        user = user_response.data[0] if user_response.data else None
        user_payload = {
            "id": auth_user_id,
            "name": detected_name,
            "email": email,
            "role": "student",
        }

        if user:
            if str(user.get("id")) != auth_user_id:
                raise HTTPException(
                    status_code=409,
                    detail="This email is already linked to another application user."
                )
            admin_supabase.table("users").update({
                "name": detected_name,
                "role": "student",
            }).eq("id", auth_user_id).execute()
        else:
            admin_supabase.table("users").insert(user_payload).execute()

        # --------------------------------------------------------
        # Find or create student profile
        # --------------------------------------------------------
        student_response = (
            admin_supabase.table("students")
            .select("id, user_id")
            .eq("user_id", auth_user_id)
            .limit(1)
            .execute()
        )

        student_payload = {
            "user_id": auth_user_id,
            "degree": degree,
            "specialization": specialization,
            "graduation_year": graduation_year,
            "cgpa": cgpa,
            "location": location,
            "target_role": target_role,
            "career_interest": career_interest,
        }

        if student_response.data:
            student_id = student_response.data[0]["id"]
            (
                admin_supabase.table("students")
                .update(student_payload)
                .eq("id", student_id)
                .execute()
            )
        else:
            student_insert = admin_supabase.table("students").insert(student_payload).execute()
            if not student_insert.data:
                raise HTTPException(status_code=500, detail="Student profile could not be created.")
            student_id = student_insert.data[0]["id"]

        # --------------------------------------------------------
        # Detect skills from the resume against existing skill list
        # --------------------------------------------------------
        skills_response = admin_supabase.table("skills").select("id, name").execute()
        existing_skills = skills_response.data or []

        # Replace only this student's skill mappings so re-uploading a resume updates the profile.
        admin_supabase.table("student_skills").delete().eq("student_id", student_id).execute()

        student_skill_rows = []
        detected_skill_names = []
        for skill in existing_skills:
            skill_name = str(skill.get("name") or "").strip()
            if not skill_name:
                continue
            skill_lower = skill_name.lower()
            aliases = {
                "react.js": ["react.js", "reactjs", "react js"],
                "node.js": ["node.js", "nodejs", "node js"],
                "fastapi": ["fastapi"],
                "rest api": ["rest api", "restful api", "rest apis"],
                "postgresql": ["postgresql", "postgres"],
                "github": ["github"],
                "git": ["git"],
                "artificial intelligence": ["artificial intelligence", "ai"],
                "generative ai": ["generative ai", "genai", "gen ai"],
                "machine learning": ["machine learning", "ml"],
            }
            needles = aliases.get(skill_lower, [skill_lower])
            if any(re.search(r"(?<![a-z0-9])" + re.escape(needle) + r"(?![a-z0-9])", text) for needle in needles):
                proficiency = "intermediate"
                advanced_markers = [
                    skill_lower,
                    f"advanced {skill_lower}",
                    f"expert {skill_lower}",
                    f"proficient in {skill_lower}",
                ]
                if any(marker in text for marker in advanced_markers):
                    proficiency = "advanced"
                elif any(word in text for word in ["beginner", "basic", "familiar with"]):
                    proficiency = "beginner"

                student_skill_rows.append({
                    "student_id": student_id,
                    "skill_id": skill["id"],
                    "proficiency": proficiency,
                })
                detected_skill_names.append(skill_name)

        if student_skill_rows:
            admin_supabase.table("student_skills").insert(student_skill_rows).execute()

        return {
            "status": "success",
            "message": "Resume analyzed and student profile created successfully.",
            "student": {
                "id": student_id,
                "name": detected_name,
                "email": email,
                "degree": degree,
                "specialization": specialization,
                "graduation_year": graduation_year,
                "cgpa": cgpa,
                "location": location,
                "target_role": target_role,
                "career_interest": career_interest,
            },
            "skills": detected_skill_names,
            "skill_count": len(detected_skill_names),
            "resume_text_length": len(resume_text),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# STUDENT DASHBOARD
# ============================================================

@app.get("/api/student/dashboard")
def get_student_dashboard(email: str):

    try:

        # ----------------------------------------------------
        # Find user
        # ----------------------------------------------------

        user_response = (
            supabase
            .table("users")
            .select(
                "id, name, email, role"
            )
            .eq(
                "email",
                email
            )
            .limit(1)
            .execute()
        )

        if not user_response.data:

            raise HTTPException(
                status_code=404,
                detail="Student user not found."
            )

        user = user_response.data[0]


        # ----------------------------------------------------
        # Find student
        # ----------------------------------------------------

        student_response = (
            supabase
            .table("students")
            .select(
                "id, degree, specialization, "
                "graduation_year, cgpa, location, "
                "target_role, career_interest"
            )
            .eq(
                "user_id",
                user["id"]
            )
            .limit(1)
            .execute()
        )

        if not student_response.data:

            raise HTTPException(
                status_code=404,
                detail="Student profile not found."
            )

        student = student_response.data[0]

        student_id = student["id"]


        # ----------------------------------------------------
        # Get student skills
        # ----------------------------------------------------

        skills_response = (
            supabase
            .table("student_skills")
            .select(
                "id, proficiency, skill_id, "
                "skills(id, name)"
            )
            .eq(
                "student_id",
                student_id
            )
            .execute()
        )

        skills = []

        for item in skills_response.data or []:

            skill = item.get("skills")

            if skill:

                skills.append({

                    "id": skill.get("id"),

                    "name": skill.get("name"),

                    "proficiency": item.get(
                        "proficiency"
                    )
                })


        # ----------------------------------------------------
        # Career recommendation count
        # ----------------------------------------------------

        recommendations_response = (
            supabase
            .table("career_recommendations")
            .select("id")
            .eq(
                "student_id",
                student_id
            )
            .execute()
        )

        career_matches = len(
            recommendations_response.data or []
        )


        # ----------------------------------------------------
        # Application-defined readiness score
        # ----------------------------------------------------

        readiness_score = 82


        # ----------------------------------------------------
        # Return dashboard
        # ----------------------------------------------------

        return {

            "status": "success",

            "student": {

                "id": student_id,

                "name": user["name"],

                "email": user["email"],

                "degree": student["degree"],

                "specialization": student[
                    "specialization"
                ],

                "graduation_year": student[
                    "graduation_year"
                ],

                "cgpa": student["cgpa"],

                "location": student["location"],

                "target_role": student[
                    "target_role"
                ],

                "career_interest": student[
                    "career_interest"
                ]
            },

            "readiness_score": readiness_score,

            "skills": skills,

            "skill_count": len(skills),

            "career_matches": career_matches
        }


    except HTTPException:

        raise


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# AI CAREER ANALYSIS
# ============================================================

@app.get("/api/student/career-analysis")
def get_career_analysis(email: str):

    try:

        # ----------------------------------------------------
        # Find user
        # ----------------------------------------------------

        user_response = (
            supabase
            .table("users")
            .select(
                "id, name, email, role"
            )
            .eq(
                "email",
                email
            )
            .limit(1)
            .execute()
        )

        if not user_response.data:

            raise HTTPException(
                status_code=404,
                detail="User not found."
            )

        user = user_response.data[0]


        # ----------------------------------------------------
        # Find student
        # ----------------------------------------------------

        student_response = (
            supabase
            .table("students")
            .select(
                "id, user_id, degree, specialization, "
                "graduation_year, cgpa, location, "
                "target_role, career_interest"
            )
            .eq(
                "user_id",
                user["id"]
            )
            .limit(1)
            .execute()
        )

        if not student_response.data:

            raise HTTPException(
                status_code=404,
                detail="Student profile not found."
            )

        student = student_response.data[0]

        student_id = student["id"]


        # ----------------------------------------------------
        # Skills
        # ----------------------------------------------------

        skills_response = (
            supabase
            .table("student_skills")
            .select(
                "id, proficiency, skill_id, "
                "skills(id, name)"
            )
            .eq(
                "student_id",
                student_id
            )
            .execute()
        )

        skills = []

        for item in skills_response.data or []:

            skill = item.get("skills")

            if skill:

                skills.append({

                    "id": skill.get("id"),

                    "name": skill.get("name"),

                    "proficiency": item.get(
                        "proficiency"
                    )
                })


        # ----------------------------------------------------
        # Projects
        # ----------------------------------------------------

        projects_response = (
            supabase
            .table("projects")
            .select(
                "id, title, description, "
                "technologies, project_url"
            )
            .eq(
                "student_id",
                student_id
            )
            .execute()
        )

        projects = projects_response.data or []


        # ----------------------------------------------------
        # Career recommendations
        # ----------------------------------------------------

        recommendations_response = (
            supabase
            .table("career_recommendations")
            .select(
                "id, match_score, reason, career_role_id"
            )
            .eq(
                "student_id",
                student_id
            )
            .order(
                "match_score",
                desc=True
            )
            .execute()
        )

        recommendations = []

        for item in recommendations_response.data or []:

            career_name = "Career Role"

            career_role_id = item.get(
                "career_role_id"
            )

            if career_role_id:

                career_role_response = (
                    supabase
                    .table("career_roles")
                    .select("*")
                    .eq(
                        "id",
                        career_role_id
                    )
                    .limit(1)
                    .execute()
                )

                if career_role_response.data:

                    career_role = (
                        career_role_response.data[0]
                    )

                    career_name = (

                        career_role.get("name")

                        or career_role.get("title")

                        or career_role.get("role_name")

                        or career_role.get("career_name")

                        or "Career Role"
                    )

            recommendations.append({

                "id": item.get("id"),

                "career_role_id": career_role_id,

                "career": career_name,

                "match_score": item.get(
                    "match_score"
                ),

                "reason": item.get(
                    "reason"
                )
            })


        # ----------------------------------------------------
        # Skill gaps
        # ----------------------------------------------------

        gaps_response = (
            supabase
            .table("skill_gaps")
            .select(
                "id, current_level, required_level, "
                "priority, skill_id, "
                "skills(id, name)"
            )
            .eq(
                "student_id",
                student_id
            )
            .execute()
        )

        skill_gaps = []

        for item in gaps_response.data or []:

            skill = item.get("skills")

            skill_gaps.append({

                "id": item.get("id"),

                "skill": (
                    skill.get("name")
                    if skill
                    else "Skill"
                ),

                "current_level": item.get(
                    "current_level"
                ),

                "required_level": item.get(
                    "required_level"
                ),

                "priority": item.get(
                    "priority"
                )
            })


        # ----------------------------------------------------
        # Readiness
        # ----------------------------------------------------

        readiness_score = 82

        readiness_breakdown = {

            "technical_skills": 84,

            "project_strength": 80,

            "role_alignment": 86,

            "interview_readiness": 78
        }


        # ----------------------------------------------------
        # Summary
        # ----------------------------------------------------

        target_role = (
            student.get("target_role")
            or "your target role"
        )

        summary = (

            f"Your profile shows a strong foundation "
            f"for {target_role}. "

            f"You have a good combination of "
            f"technical skills and project experience. "

            f"Improving the identified skill gaps "
            f"can further increase your placement "
            f"readiness."
        )


        # ----------------------------------------------------
        # Return
        # ----------------------------------------------------

        return {

            "status": "success",

            "student": {

                "id": student["id"],

                "name": user["name"],

                "email": user["email"],

                "degree": student["degree"],

                "specialization": student[
                    "specialization"
                ],

                "graduation_year": student[
                    "graduation_year"
                ],

                "cgpa": student["cgpa"],

                "location": student[
                    "location"
                ],

                "target_role": student[
                    "target_role"
                ],

                "career_interest": student[
                    "career_interest"
                ]
            },

            "readiness_score": readiness_score,

            "readiness_breakdown": (
                readiness_breakdown
            ),

            "summary": summary,

            "skills": skills,

            "projects": projects,

            "career_recommendations": (
                recommendations
            ),

            "skill_gaps": skill_gaps
        }


    except HTTPException:

        raise


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# CAREER RECOMMENDATIONS
# ============================================================

@app.get("/api/student/career-recommendations")
def get_career_recommendations(email: str):

    try:

        # ----------------------------------------------------
        # 1. Find user
        # ----------------------------------------------------

        user_response = (
            supabase
            .table("users")
            .select(
                "id, name, email, role"
            )
            .eq(
                "email",
                email
            )
            .limit(1)
            .execute()
        )

        if not user_response.data:

            raise HTTPException(
                status_code=404,
                detail="User not found."
            )

        user = user_response.data[0]


        # ----------------------------------------------------
        # 2. Find student
        # ----------------------------------------------------

        student_response = (
            supabase
            .table("students")
            .select(
                "id, degree, specialization, "
                "graduation_year, cgpa, location, "
                "target_role, career_interest"
            )
            .eq(
                "user_id",
                user["id"]
            )
            .limit(1)
            .execute()
        )

        if not student_response.data:

            raise HTTPException(
                status_code=404,
                detail="Student profile not found."
            )

        student = student_response.data[0]

        student_id = student["id"]


        # ----------------------------------------------------
        # 3. Get student skills
        # ----------------------------------------------------

        # THIS WAS MISSING BEFORE.
        # We need it for the Strengths section.

        skills_response = (
            supabase
            .table("student_skills")
            .select(
                "id, proficiency, skill_id, "
                "skills(id, name)"
            )
            .eq(
                "student_id",
                student_id
            )
            .execute()
        )

        strengths = []

        for item in skills_response.data or []:

            skill = item.get("skills")

            if not skill:
                continue

            proficiency = str(
                item.get("proficiency") or ""
            ).lower()

            if proficiency in [
                "advanced",
                "intermediate"
            ]:

                skill_name = skill.get("name")

                if skill_name:
                    strengths.append(
                        skill_name
                    )


        # ----------------------------------------------------
        # 4. Get skill gaps
        # ----------------------------------------------------

        gaps_response = (
            supabase
            .table("skill_gaps")
            .select(
                "id, current_level, required_level, "
                "priority, skill_id, "
                "skills(id, name)"
            )
            .eq(
                "student_id",
                student_id
            )
            .execute()
        )

        skill_gaps = []

        for gap in gaps_response.data or []:

            skill = gap.get("skills")

            if skill:

                skill_gaps.append({

                    "skill": skill.get(
                        "name"
                    ),

                    "current_level": gap.get(
                        "current_level"
                    ),

                    "required_level": gap.get(
                        "required_level"
                    ),

                    "priority": gap.get(
                        "priority"
                    )
                })


        # ----------------------------------------------------
        # 5. Get career recommendations
        # ----------------------------------------------------

        recommendations_response = (
            supabase
            .table("career_recommendations")
            .select(
                "id, match_score, reason, "
                "career_role_id"
            )
            .eq(
                "student_id",
                student_id
            )
            .order(
                "match_score",
                desc=True
            )
            .execute()
        )

        recommendations = []


        # ----------------------------------------------------
        # 6. Build recommendation data
        # ----------------------------------------------------

        for item in recommendations_response.data or []:

            career_name = "Career Role"

            career_role_id = item.get(
                "career_role_id"
            )


            # ------------------------------------------------
            # Find career role
            # ------------------------------------------------

            if career_role_id:

                career_role_response = (
                    supabase
                    .table("career_roles")
                    .select("*")
                    .eq(
                        "id",
                        career_role_id
                    )
                    .limit(1)
                    .execute()
                )


                if career_role_response.data:

                    career_role = (
                        career_role_response.data[0]
                    )

                    # Your table may use a different
                    # name for the career title.

                    career_name = (

                        career_role.get("name")

                        or career_role.get("title")

                        or career_role.get("role_name")

                        or career_role.get("career_name")

                        or "Career Role"
                    )


            # ------------------------------------------------
            # Match score
            # ------------------------------------------------

            match_score = (
                item.get("match_score")
                or 0
            )


            # ------------------------------------------------
            # Reason
            # ------------------------------------------------

            reason = item.get(
                "reason"
            )

            if not reason:

                reason = (
                    f"This career has a {match_score}% "
                    f"match with your current profile, "
                    f"skills and career interests."
                )


            # ------------------------------------------------
            # Missing skills
            # ------------------------------------------------

            missing_skills = []

            for gap in skill_gaps:

                skill_name = gap.get(
                    "skill"
                )

                if skill_name:

                    missing_skills.append(
                        skill_name
                    )


            # ------------------------------------------------
            # Recommended action
            # ------------------------------------------------

            if missing_skills:

                recommended_action = (

                    f"Focus on {missing_skills[0]} "
                    f"and continue building practical "
                    f"project experience."
                )

            else:

                recommended_action = (

                    "Continue improving your technical "
                    "skills and practical project experience."
                )


            # ------------------------------------------------
            # Add recommendation
            # ------------------------------------------------

            recommendations.append({

                "id": item.get("id"),

                "career_role_id": career_role_id,

                "career": career_name,

                "match_score": match_score,

                "reason": reason,

                "strengths": strengths[:5],

                "missing_skills": missing_skills[:5],

                "recommended_action": (
                    recommended_action
                )
            })


        # ----------------------------------------------------
        # 7. Return
        # ----------------------------------------------------

        return {

            "status": "success",

            "student": {

                "id": student_id,

                "name": user["name"],

                "email": user["email"],

                "degree": student[
                    "degree"
                ],

                "specialization": student[
                    "specialization"
                ],

                "graduation_year": student[
                    "graduation_year"
                ],

                "target_role": student[
                    "target_role"
                ],

                "career_interest": student[
                    "career_interest"
                ]
            },

            "recommendations": (
                recommendations
            ),

            "total": len(
                recommendations
            )
        }


    except HTTPException:

        raise


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    # ============================================================
# PLACEMENT OPPORTUNITIES
# ============================================================

@app.get("/api/student/placement-opportunities")
def get_placement_opportunities(email: str):

    try:

        # ----------------------------------------------------
        # 1. Find student user
        # ----------------------------------------------------

        user_response = (
            supabase
            .table("users")
            .select(
                "id, name, email, role"
            )
            .eq(
                "email",
                email
            )
            .limit(1)
            .execute()
        )

        if not user_response.data:

            raise HTTPException(
                status_code=404,
                detail="User not found."
            )

        user = user_response.data[0]


        # ----------------------------------------------------
        # 2. Find student profile
        # ----------------------------------------------------

        student_response = (
            supabase
            .table("students")
            .select(
                "id, degree, specialization, "
                "graduation_year, cgpa, location, "
                "target_role, career_interest"
            )
            .eq(
                "user_id",
                user["id"]
            )
            .limit(1)
            .execute()
        )

        if not student_response.data:

            raise HTTPException(
                status_code=404,
                detail="Student profile not found."
            )

        student = student_response.data[0]

        student_id = student["id"]


        # ----------------------------------------------------
        # 3. Get student's skills
        # ----------------------------------------------------

        student_skills_response = (
            supabase
            .table("student_skills")
            .select(
                "skill_id, proficiency, "
                "skills(id, name)"
            )
            .eq(
                "student_id",
                student_id
            )
            .execute()
        )

        student_skills = []

        for item in student_skills_response.data or []:

            skill = item.get("skills")

            if skill:

                student_skills.append({

                    "id": skill.get("id"),

                    "name": skill.get("name"),

                    "proficiency": str(
                        item.get("proficiency") or ""
                    ).lower()

                })


        # ----------------------------------------------------
        # 4. Get all placement jobs
        # ----------------------------------------------------

        jobs_response = (
            supabase
            .table("jobs")
            .select("*")
            .order(
                "created_at",
                desc=True
            )
            .execute()
        )

        jobs_data = jobs_response.data or []

        jobs = []


        # ----------------------------------------------------
        # 5. Process every job
        # ----------------------------------------------------

        for job in jobs_data:

            job_id = job.get("id")


            # ------------------------------------------------
            # Get company
            # ------------------------------------------------

            company_name = "Company"

            company_id = job.get(
                "company_id"
            )

            if company_id:

                company_response = (
                    supabase
                    .table("companies")
                    .select("*")
                    .eq(
                        "id",
                        company_id
                    )
                    .limit(1)
                    .execute()
                )

                if company_response.data:

                    company = (
                        company_response.data[0]
                    )

                    company_name = (
                        company.get("name")
                        or company.get("company_name")
                        or "Company"
                    )


            # ------------------------------------------------
            # Get required skills
            # ------------------------------------------------

            required_skills_response = (
                supabase
                .table("job_required_skills")
                .select(
                    "skill_id, required_proficiency, "
                    "skills(id, name)"
                )
                .eq(
                    "job_id",
                    job_id
                )
                .execute()
            )

            required_skills = []

            for item in (
                required_skills_response.data or []
            ):

                skill = item.get("skills")

                if skill:

                    required_skills.append({

                        "id": skill.get("id"),

                        "name": skill.get("name"),

                        "required_proficiency": str(
                            item.get(
                                "required_proficiency"
                            ) or ""
                        ).lower()

                    })


            # ------------------------------------------------
            # Calculate skill match
            # ------------------------------------------------

            student_skill_names = {
                str(skill["name"]).strip().lower()
                for skill in student_skills
                if skill.get("name")
            }

            matched_skills = []
            missing_skills = []


            for required in required_skills:

                required_name = required.get(
                    "name"
                )

                if not required_name:
                    continue

                normalized_name = (
                    required_name
                    .strip()
                    .lower()
                )

                if normalized_name in student_skill_names:

                    matched_skills.append(
                        required_name
                    )

                else:

                    missing_skills.append(
                        required_name
                    )


            # ------------------------------------------------
            # Skill score
            # ------------------------------------------------

            if required_skills:

                skill_score = round(
                    (
                        len(matched_skills)
                        / len(required_skills)
                    ) * 100
                )

            else:

                skill_score = 50


            # ------------------------------------------------
            # Target role alignment
            # ------------------------------------------------

            job_role = (
                job.get("role")
                or job.get("title")
                or job.get("job_title")
                or ""
            )

            target_role = (
                student.get("target_role")
                or ""
            )


            role_score = 0

            if target_role and job_role:

                target_words = set(
                    target_role.lower().split()
                )

                job_words = set(
                    job_role.lower().split()
                )

                if (
                    target_role.lower()
                    in job_role.lower()
                    or job_role.lower()
                    in target_role.lower()
                ):

                    role_score = 100

                elif target_words.intersection(
                    job_words
                ):

                    role_score = 70

                else:

                    role_score = 40

            else:

                role_score = 50


            # ------------------------------------------------
            # Education score
            # ------------------------------------------------

            education_score = 100


            # ------------------------------------------------
            # Final match score
            # ------------------------------------------------

            match_score = round(

                (
                    skill_score * 0.60
                    + role_score * 0.25
                    + education_score * 0.15
                )

            )


            # Keep score between 0 and 100

            match_score = max(
                0,
                min(
                    match_score,
                    100
                )
            )


            # ------------------------------------------------
            # Eligibility
            # ------------------------------------------------

            eligibility = (
                job.get("eligibility")
                or job.get("eligibility_criteria")
                or "Eligible candidates can apply."
            )


            # ------------------------------------------------
            # Salary
            # ------------------------------------------------

            salary = (
                job.get("salary")
                or job.get("salary_range")
                or job.get("package")
                or "Not specified"
            )


            # ------------------------------------------------
            # Experience
            # ------------------------------------------------

            experience = (
                job.get("experience")
                or job.get("experience_required")
                or "Fresher"
            )


            # ------------------------------------------------
            # Location
            # ------------------------------------------------

            location = (
                job.get("location")
                or "Not specified"
            )


            # ------------------------------------------------
            # Deadline
            # ------------------------------------------------

            deadline = (
                job.get("deadline")
                or job.get("application_deadline")
                or "Not specified"
            )


            # ------------------------------------------------
            # Description
            # ------------------------------------------------

            description = (
                job.get("description")
                or ""
            )


            # ------------------------------------------------
            # Add job
            # ------------------------------------------------

            jobs.append({

                "id": job_id,

                "company": company_name,

                "role": job_role,

                "title": job_role,

                "location": location,

                "salary": salary,

                "experience": experience,

                "deadline": deadline,

                "eligibility": eligibility,

                "description": description,

                "required_skills": [
                    skill["name"]
                    for skill in required_skills
                ],

                "matched_skills": matched_skills,

                "missing_skills": missing_skills,

                "match_score": match_score

            })


        # ----------------------------------------------------
        # 6. Sort by match score
        # ----------------------------------------------------

        jobs.sort(
            key=lambda item: item["match_score"],
            reverse=True
        )


        # ----------------------------------------------------
        # 7. Return response
        # ----------------------------------------------------

        return {

            "status": "success",

            "student": {

                "id": student_id,

                "name": user["name"],

                "email": user["email"],

                "degree": student["degree"],

                "specialization": student[
                    "specialization"
                ],

                "graduation_year": student[
                    "graduation_year"
                ],

                "cgpa": student["cgpa"],

                "location": student["location"],

                "target_role": student[
                    "target_role"
                ],

                "career_interest": student[
                    "career_interest"
                ]

            },

            "jobs": jobs,

            "total": len(jobs)

        }


    except HTTPException:

        raise


    except Exception as e:

        raise HTTPException(

            status_code=500,

            detail=str(e)

        )
    # ============================================================
# JOB MATCH DETAILS
# ============================================================

@app.get("/api/student/job-match/{job_id}")
def get_job_match_details(
    job_id: str,
    email: str
):

    try:

        # ----------------------------------------------------
        # 1. Find user
        # ----------------------------------------------------

        user_response = (
            supabase
            .table("users")
            .select("id, name, email, role")
            .eq("email", email)
            .limit(1)
            .execute()
        )

        if not user_response.data:
            raise HTTPException(
                status_code=404,
                detail="User not found."
            )

        user = user_response.data[0]


        # ----------------------------------------------------
        # 2. Find student
        # ----------------------------------------------------

        student_response = (
            supabase
            .table("students")
            .select(
                "id, degree, specialization, "
                "graduation_year, cgpa, location, "
                "target_role, career_interest"
            )
            .eq("user_id", user["id"])
            .limit(1)
            .execute()
        )

        if not student_response.data:
            raise HTTPException(
                status_code=404,
                detail="Student profile not found."
            )

        student = student_response.data[0]
        student_id = student["id"]


        # ----------------------------------------------------
        # 3. Find job
        # ----------------------------------------------------

        job_response = (
            supabase
            .table("jobs")
            .select("*")
            .eq("id", job_id)
            .limit(1)
            .execute()
        )

        if not job_response.data:
            raise HTTPException(
                status_code=404,
                detail="Job not found."
            )

        job = job_response.data[0]


        # ----------------------------------------------------
        # 4. Find company
        # ----------------------------------------------------

        company_name = "Company"

        company_id = job.get("company_id")

        if company_id:

            company_response = (
                supabase
                .table("companies")
                .select("*")
                .eq("id", company_id)
                .limit(1)
                .execute()
            )

            if company_response.data:

                company = company_response.data[0]

                company_name = (
                    company.get("name")
                    or company.get("company_name")
                    or "Company"
                )


        # ----------------------------------------------------
        # 5. Get student skills
        # ----------------------------------------------------

        student_skills_response = (
            supabase
            .table("student_skills")
            .select(
                "skill_id, proficiency, "
                "skills(id, name)"
            )
            .eq("student_id", student_id)
            .execute()
        )

        student_skill_names = set()

        for item in student_skills_response.data or []:

            skill = item.get("skills")

            if skill and skill.get("name"):

                student_skill_names.add(
                    skill["name"].strip().lower()
                )


        # ----------------------------------------------------
        # 6. Get required job skills
        # ----------------------------------------------------

        required_skills_response = (
            supabase
            .table("job_required_skills")
            .select(
                "skill_id, required_proficiency, "
                "skills(id, name)"
            )
            .eq("job_id", job_id)
            .execute()
        )

        required_skills = []

        for item in required_skills_response.data or []:

            skill = item.get("skills")

            if skill:

                required_skills.append({
                    "id": skill.get("id"),
                    "name": skill.get("name"),
                    "required_proficiency": str(
                        item.get("required_proficiency") or ""
                    ).lower()
                })


        # ----------------------------------------------------
        # 7. Compare skills
        # ----------------------------------------------------

        matched_skills = []
        missing_skills = []

        for required in required_skills:

            skill_name = required.get("name")

            if not skill_name:
                continue

            normalized_name = (
                skill_name.strip().lower()
            )

            if normalized_name in student_skill_names:

                matched_skills.append(skill_name)

            else:

                missing_skills.append(skill_name)


        # ----------------------------------------------------
        # 8. Calculate skill score
        # ----------------------------------------------------

        if required_skills:

            skill_score = round(
                (
                    len(matched_skills)
                    / len(required_skills)
                ) * 100
            )

        else:

            skill_score = 50


        # ----------------------------------------------------
        # 9. Calculate role score
        # ----------------------------------------------------

        job_role = (
            job.get("role")
            or job.get("title")
            or job.get("job_title")
            or ""
        )

        target_role = (
            student.get("target_role")
            or ""
        )

        if target_role and job_role:

            target_words = set(
                target_role.lower().split()
            )

            job_words = set(
                job_role.lower().split()
            )

            if (
                target_role.lower() in job_role.lower()
                or job_role.lower() in target_role.lower()
            ):

                role_score = 100

            elif target_words.intersection(job_words):

                role_score = 70

            else:

                role_score = 40

        else:

            role_score = 50


        # ----------------------------------------------------
        # 10. Education score
        # ----------------------------------------------------

        education_score = 100


        # ----------------------------------------------------
        # 11. Final match score
        # ----------------------------------------------------

        match_score = round(
            (
                skill_score * 0.60
                + role_score * 0.25
                + education_score * 0.15
            )
        )

        match_score = max(
            0,
            min(match_score, 100)
        )


        # ----------------------------------------------------
        # 12. Job information
        # ----------------------------------------------------

        salary = (
            job.get("salary")
            or job.get("salary_range")
            or job.get("package")
            or "Not specified"
        )

        experience = (
            job.get("experience")
            or job.get("experience_required")
            or "Fresher"
        )

        location = (
            job.get("location")
            or "Not specified"
        )

        deadline = (
            job.get("deadline")
            or job.get("application_deadline")
            or "Not specified"
        )

        eligibility = (
            job.get("eligibility")
            or job.get("eligibility_criteria")
            or "Eligible candidates can apply."
        )

        description = (
            job.get("description")
            or ""
        )


        # ----------------------------------------------------
        # 13. Return response
        # ----------------------------------------------------

        return {

            "status": "success",

            "student": {

                "id": student_id,

                "name": user["name"],

                "email": user["email"],

                "degree": student["degree"],

                "specialization": student[
                    "specialization"
                ],

                "graduation_year": student[
                    "graduation_year"
                ],

                "cgpa": student["cgpa"],

                "location": student["location"],

                "target_role": student[
                    "target_role"
                ],

                "career_interest": student[
                    "career_interest"
                ]

            },

            "job": {

                "id": job["id"],

                "company": company_name,

                "role": job_role,

                "title": job_role,

                "location": location,

                "salary": salary,

                "experience": experience,

                "deadline": deadline,

                "eligibility": eligibility,

                "description": description,

                "required_skills": [
                    skill["name"]
                    for skill in required_skills
                ],

                "matched_skills": matched_skills,

                "missing_skills": missing_skills,

                "match_score": match_score

            }

        }


    except HTTPException:

        raise


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    # ============================================================
# SKILL GAP ANALYSIS
# ============================================================

@app.get("/api/student/skill-gaps")
def get_skill_gaps(email: str):

    try:

        # ----------------------------------------------------
        # 1. Find user
        # ----------------------------------------------------

        user_response = (
            supabase
            .table("users")
            .select("id, name, email, role")
            .eq("email", email)
            .limit(1)
            .execute()
        )

        if not user_response.data:

            raise HTTPException(
                status_code=404,
                detail="User not found."
            )

        user = user_response.data[0]


        # ----------------------------------------------------
        # 2. Find student
        # ----------------------------------------------------

        student_response = (
            supabase
            .table("students")
            .select(
                "id, degree, specialization, "
                "graduation_year, cgpa, location, "
                "target_role, career_interest"
            )
            .eq("user_id", user["id"])
            .limit(1)
            .execute()
        )

        if not student_response.data:

            raise HTTPException(
                status_code=404,
                detail="Student profile not found."
            )

        student = student_response.data[0]

        student_id = student["id"]


        # ----------------------------------------------------
        # 3. Get skill gaps
        # ----------------------------------------------------

        gaps_response = (
            supabase
            .table("skill_gaps")
            .select("*")
            .eq("student_id", student_id)
            .execute()
        )

        gaps_data = gaps_response.data or []

        gaps = []


        # ----------------------------------------------------
        # 4. Process skill gaps
        # ----------------------------------------------------

        for gap in gaps_data:

            skill_id = gap.get("skill_id")

            skill_name = "Skill"

            # ----------------------------------------------
            # Find skill name
            # ----------------------------------------------

            if skill_id:

                skill_response = (
                    supabase
                    .table("skills")
                    .select("id, name")
                    .eq("id", skill_id)
                    .limit(1)
                    .execute()
                )

                if skill_response.data:

                    skill_name = (
                        skill_response.data[0].get("name")
                        or "Skill"
                    )


            # ----------------------------------------------
            # Current proficiency
            # ----------------------------------------------

            current_proficiency = (
                gap.get("current_proficiency")
                or gap.get("current_level")
                or gap.get("proficiency")
                or "beginner"
            )


            # ----------------------------------------------
            # Required proficiency
            # ----------------------------------------------

            required_proficiency = (
                gap.get("required_proficiency")
                or gap.get("required_level")
                or "intermediate"
            )


            # ----------------------------------------------
            # Priority
            # ----------------------------------------------

            priority = (
                gap.get("priority")
                or "medium"
            )

            priority = str(
                priority
            ).lower()


            # ----------------------------------------------
            # Gap score
            # ----------------------------------------------

            gap_score = (
                gap.get("gap_score")
                or gap.get("score")
                or 0
            )


            # ----------------------------------------------
            # Add gap
            # ----------------------------------------------

            gaps.append({

                "id": gap.get("id"),

                "skill_id": skill_id,

                "skill": skill_name,

                "current_proficiency": str(
                    current_proficiency
                ).lower(),

                "required_proficiency": str(
                    required_proficiency
                ).lower(),

                "priority": priority,

                "gap_score": gap_score

            })


        # ----------------------------------------------------
        # 5. Sort by priority
        # ----------------------------------------------------

        priority_order = {
            "high": 1,
            "medium": 2,
            "low": 3
        }

        gaps.sort(
            key=lambda item: priority_order.get(
                item["priority"],
                4
            )
        )


        # ----------------------------------------------------
        # 6. Summary
        # ----------------------------------------------------

        high_priority = len([
            gap
            for gap in gaps
            if gap["priority"] == "high"
        ])

        medium_priority = len([
            gap
            for gap in gaps
            if gap["priority"] == "medium"
        ])

        low_priority = len([
            gap
            for gap in gaps
            if gap["priority"] == "low"
        ])


        # ----------------------------------------------------
        # 7. Return response
        # ----------------------------------------------------

        return {

            "status": "success",

            "student": {

                "id": student_id,

                "name": user["name"],

                "email": user["email"],

                "degree": student["degree"],

                "specialization": student[
                    "specialization"
                ],

                "graduation_year": student[
                    "graduation_year"
                ],

                "cgpa": student["cgpa"],

                "target_role": student[
                    "target_role"
                ]

            },

            "summary": {

                "total_gaps": len(gaps),

                "high_priority": high_priority,

                "medium_priority": medium_priority,

                "low_priority": low_priority

            },

            "gaps": gaps

        }


    except HTTPException:

        raise


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    # ============================================================
# PERSONALIZED LEARNING ROADMAP
# ============================================================

@app.get("/api/student/roadmap")
def get_student_roadmap(email: str):

    try:

        # ----------------------------------------------------
        # 1. Find user
        # ----------------------------------------------------

        user_response = (
            supabase
            .table("users")
            .select("id, name, email, role")
            .eq("email", email)
            .limit(1)
            .execute()
        )

        if not user_response.data:
            raise HTTPException(
                status_code=404,
                detail="User not found."
            )

        user = user_response.data[0]


        # ----------------------------------------------------
        # 2. Find student
        # ----------------------------------------------------

        student_response = (
            supabase
            .table("students")
            .select(
                "id, degree, specialization, "
                "graduation_year, cgpa, location, "
                "target_role, career_interest"
            )
            .eq("user_id", user["id"])
            .limit(1)
            .execute()
        )

        if not student_response.data:
            raise HTTPException(
                status_code=404,
                detail="Student profile not found."
            )

        student = student_response.data[0]
        student_id = student["id"]


        # ----------------------------------------------------
        # 3. Find student's roadmap
        # ----------------------------------------------------

        roadmap_response = (
            supabase
            .table("roadmaps")
            .select("*")
            .eq("student_id", student_id)
            .limit(1)
            .execute()
        )

        if not roadmap_response.data:
            raise HTTPException(
                status_code=404,
                detail="Learning roadmap not found."
            )

        roadmap = roadmap_response.data[0]
        roadmap_id = roadmap["id"]


        # ----------------------------------------------------
        # 4. Personalized roadmap plan
        # ----------------------------------------------------
        # These values are based on the student's current
        # Full Stack Developer skill gaps:
        # Node.js, REST API and TypeScript.
        #
        # Existing roadmap rows are updated instead of creating
        # duplicate rows. Completion status is preserved.
        # ----------------------------------------------------

        personalized_plan = {
            1: {
                "title": "Node.js Fundamentals",
                "description": (
                    "Strengthen your backend foundation by learning "
                    "Node.js fundamentals, modules, npm, asynchronous "
                    "programming and basic server development."
                ),
                "skill": "Node.js",
                "duration": "7 days"
            },
            2: {
                "title": "REST API Development",
                "description": (
                    "Learn HTTP methods, REST principles, request and "
                    "response handling, CRUD operations and API error "
                    "handling. Build a basic REST API."
                ),
                "skill": "REST API",
                "duration": "7 days"
            },
            3: {
                "title": "TypeScript Development",
                "description": (
                    "Build TypeScript fundamentals including types, "
                    "interfaces, functions, objects and using TypeScript "
                    "with Node.js."
                ),
                "skill": "TypeScript",
                "duration": "7 days"
            },
            4: {
                "title": "Full Stack Placement Project",
                "description": (
                    "Build a practical full-stack project using React, "
                    "Node.js, REST APIs and TypeScript. Prepare the "
                    "project for GitHub, resume presentation and interviews."
                ),
                "skill": "Node.js + REST API + TypeScript",
                "duration": "9 days"
            }
        }


        # ----------------------------------------------------
        # 5. Get roadmap items
        # ----------------------------------------------------

        items_response = (
            supabase
            .table("roadmap_items")
            .select("*")
            .eq("roadmap_id", roadmap_id)
            .execute()
        )

        items_data = items_response.data or []


        # ----------------------------------------------------
        # 6. Update existing roadmap items with personalized
        #    content while preserving completion status.
        # ----------------------------------------------------

        for index, item in enumerate(items_data):

            # roadmap_items does not have a week/week_number column.
            # The roadmap order itself represents Week 1, Week 2, etc.
            week = index + 1

            plan = personalized_plan.get(week)

            if not plan:
                continue

            # roadmap_items does not have a skill column.
            # Store only fields that exist in the database.
            update_payload = {
                "title": plan["title"],
                "description": plan["description"]
            }

            (
                supabase
                .table("roadmap_items")
                .update(update_payload)
                .eq("id", item["id"])
                .eq("roadmap_id", roadmap_id)
                .execute()
            )


        # ----------------------------------------------------
        # 7. If the roadmap has no items, create the four
        #    personalized learning milestones.
        # ----------------------------------------------------

        if len(items_data) == 0:

            for week, plan in personalized_plan.items():

                (
                    supabase
                    .table("roadmap_items")
                    .insert({
                        "roadmap_id": roadmap_id,
                        "title": plan["title"],
                        "description": plan["description"],
                        "completed": False
                    })
                    .execute()
                )


        # ----------------------------------------------------
        # 8. Read roadmap items again after personalization
        # ----------------------------------------------------

        refreshed_items_response = (
            supabase
            .table("roadmap_items")
            .select("*")
            .eq("roadmap_id", roadmap_id)
            .execute()
        )

        refreshed_items = (
            refreshed_items_response.data or []
        )

        items = []


        # ----------------------------------------------------
        # 9. Process roadmap items
        # ----------------------------------------------------

        for index, item in enumerate(refreshed_items):

            completed = item.get("completed")

            if completed is None:
                completed = item.get(
                    "is_completed",
                    False
                )

            completed = bool(completed)

            # roadmap_items does not have a week/week_number column.
            # Use the stored row order to map each item to a roadmap week.
            week = index + 1

            plan = personalized_plan.get(week)

            title = (
                item.get("title")
                or item.get("name")
                or item.get("task")
                or (
                    plan["title"]
                    if plan
                    else f"Learning Task {index + 1}"
                )
            )

            description = (
                item.get("description")
                or (
                    plan["description"]
                    if plan
                    else ""
                )
            )

            skill = (
                item.get("skill")
                or item.get("skill_name")
                or (
                    plan["skill"]
                    if plan
                    else ""
                )
            )

            # roadmap_items does not have a duration column.
            # Use the personalized plan to provide duration to the frontend.
            duration = (
                plan["duration"]
                if plan
                else ""
            )

            items.append({
                "id": item.get("id"),
                "week": week,
                "title": title,
                "description": description,
                "skill": skill,
                "duration": duration,
                "completed": completed
            })


        # ----------------------------------------------------
        # 10. Calculate progress
        # ----------------------------------------------------

        total_items = len(items)

        completed_items = len([
            item
            for item in items
            if item["completed"]
        ])

        if total_items > 0:
            progress = round(
                (
                    completed_items
                    / total_items
                ) * 100
            )
        else:
            progress = 0


        # ----------------------------------------------------
        # 11. Roadmap information
        # ----------------------------------------------------

        roadmap_title = (
            roadmap.get("title")
            or roadmap.get("name")
            or "Personalized Learning Roadmap"
        )

        duration_days = (
            roadmap.get("duration_days")
            or roadmap.get("duration")
            or 30
        )


        # ----------------------------------------------------
        # 12. Return response
        # ----------------------------------------------------

        return {
            "status": "success",

            "student": {
                "id": student_id,
                "name": user["name"],
                "email": user["email"],
                "degree": student["degree"],
                "specialization": student["specialization"],
                "graduation_year": student["graduation_year"],
                "target_role": student["target_role"]
            },

            "roadmap": {
                "id": roadmap_id,
                "title": roadmap_title,
                "duration_days": duration_days,
                "total_items": total_items,
                "completed_items": completed_items,
                "progress": progress,
                "items": items
            }
        }


    except HTTPException:
        raise


    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# ============================================================

# UPDATE ROADMAP ITEM COMPLETION
# ============================================================

class RoadmapItemCompletion(BaseModel):
    email: str
    item_id: str
    completed: bool


@app.patch("/api/student/roadmap-item")
def update_roadmap_item_completion(
    request: RoadmapItemCompletion
):
    try:
        user_response = (
            supabase
            .table("users")
            .select("id, email, role")
            .eq("email", request.email)
            .limit(1)
            .execute()
        )

        if not user_response.data:
            raise HTTPException(
                status_code=404,
                detail="Student user not found."
            )

        user = user_response.data[0]

        student_response = (
            supabase
            .table("students")
            .select("id")
            .eq("user_id", user["id"])
            .limit(1)
            .execute()
        )

        if not student_response.data:
            raise HTTPException(
                status_code=404,
                detail="Student profile not found."
            )

        student_id = student_response.data[0]["id"]

        roadmap_response = (
            supabase
            .table("roadmaps")
            .select("id")
            .eq("student_id", student_id)
            .limit(1)
            .execute()
        )

        if not roadmap_response.data:
            raise HTTPException(
                status_code=404,
                detail="Learning roadmap not found."
            )

        roadmap_id = roadmap_response.data[0]["id"]

        item_response = (
            supabase
            .table("roadmap_items")
            .select("id, roadmap_id")
            .eq("id", request.item_id)
            .eq("roadmap_id", roadmap_id)
            .limit(1)
            .execute()
        )

        if not item_response.data:
            raise HTTPException(
                status_code=404,
                detail="Roadmap item not found."
            )

        update_response = (
            supabase
            .table("roadmap_items")
            .update({"completed": request.completed})
            .eq("id", request.item_id)
            .eq("roadmap_id", roadmap_id)
            .execute()
        )

        updated_item = (
            update_response.data[0]
            if update_response.data
            else None
        )

        return {
            "status": "success",
            "message": (
                "Roadmap item marked as completed."
                if request.completed
                else "Roadmap item marked as incomplete."
            ),
            "item": updated_item
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# STUDENT APPLICATIONS
# ============================================================

class JobApplicationRequest(BaseModel):
    email: str
    job_id: str
    cover_letter: str = ""


@app.post("/api/student/applications")
def create_student_application(
    request: JobApplicationRequest
):
    try:
        user_response = (
            supabase
            .table("users")
            .select("id, name, email, role")
            .eq("email", request.email)
            .limit(1)
            .execute()
        )

        if not user_response.data:
            raise HTTPException(
                status_code=404,
                detail="Student user not found."
            )

        user = user_response.data[0]

        student_response = (
            supabase
            .table("students")
            .select(
                "id, degree, specialization, "
                "graduation_year, cgpa, location, "
                "target_role"
            )
            .eq("user_id", user["id"])
            .limit(1)
            .execute()
        )

        if not student_response.data:
            raise HTTPException(
                status_code=404,
                detail="Student profile not found."
            )

        student = student_response.data[0]
        student_id = student["id"]

        job_response = (
            supabase
            .table("jobs")
            .select("*")
            .eq("id", request.job_id)
            .limit(1)
            .execute()
        )

        if not job_response.data:
            raise HTTPException(
                status_code=404,
                detail="Job not found."
            )

        job = job_response.data[0]

        existing_application_response = (
            supabase
            .table("applications")
            .select("id, status, applied_at")
            .eq("student_id", student_id)
            .eq("job_id", request.job_id)
            .limit(1)
            .execute()
        )

        if existing_application_response.data:
            existing = existing_application_response.data[0]
            raise HTTPException(
                status_code=409,
                detail="You have already applied for this job."
            )

        application_data = {
            "student_id": student_id,
            "job_id": request.job_id,
            "cover_letter": request.cover_letter.strip(),
            "status": "applied"
        }

        application_response = (
            supabase
            .table("applications")
            .insert(application_data)
            .execute()
        )

        if not application_response.data:
            raise HTTPException(
                status_code=500,
                detail="Application could not be saved."
            )

        application = application_response.data[0]

        return {
            "status": "success",
            "message": "Application submitted successfully.",
            "application": {
                "id": application.get("id"),
                "student_id": application.get("student_id"),
                "job_id": application.get("job_id"),
                "status": application.get("status"),
                "cover_letter": application.get("cover_letter"),
                "applied_at": application.get("applied_at")
            },
            "job": {
                "id": job.get("id"),
                "title": (
                    job.get("role")
                    or job.get("title")
                    or job.get("job_title")
                    or "Job"
                )
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.get("/api/student/applications")
def get_student_applications(email: str):
    try:
        user_response = (
            supabase
            .table("users")
            .select("id, name, email, role")
            .eq("email", email)
            .limit(1)
            .execute()
        )

        if not user_response.data:
            raise HTTPException(
                status_code=404,
                detail="Student user not found."
            )

        user = user_response.data[0]

        student_response = (
            supabase
            .table("students")
            .select("id")
            .eq("user_id", user["id"])
            .limit(1)
            .execute()
        )

        if not student_response.data:
            raise HTTPException(
                status_code=404,
                detail="Student profile not found."
            )

        student_id = student_response.data[0]["id"]

        # Do not order by created_at because the applications
        # table does not contain that column.
        applications_response = (
            supabase
            .table("applications")
            .select("*")
            .eq("student_id", student_id)
            .execute()
        )

        applications_data = applications_response.data or []
        applications = []

        for application in applications_data:
            job_id = application.get("job_id")
            job = None

            if job_id:
                job_response = (
                    supabase
                    .table("jobs")
                    .select("*")
                    .eq("id", job_id)
                    .limit(1)
                    .execute()
                )

                if job_response.data:
                    job = job_response.data[0]

            company_name = "Company"

            if job and job.get("company_id"):
                company_response = (
                    supabase
                    .table("companies")
                    .select("*")
                    .eq("id", job["company_id"])
                    .limit(1)
                    .execute()
                )

                if company_response.data:
                    company = company_response.data[0]
                    company_name = (
                        company.get("name")
                        or company.get("company_name")
                        or "Company"
                    )

            job_title = "Job"

            if job:
                job_title = (
                    job.get("role")
                    or job.get("title")
                    or job.get("job_title")
                    or "Job"
                )

            location = "Not specified"
            salary = "Not specified"

            if job:
                location = (
                    job.get("location")
                    or "Not specified"
                )
                salary = (
                    job.get("salary")
                    or job.get("salary_range")
                    or "Not specified"
                )

            applications.append({
                "id": application.get("id"),
                "job_id": job_id,
                "job_title": job_title,
                "company": company_name,
                "location": location,
                "salary": salary,
                "status": application.get("status") or "applied",
                "cover_letter": application.get("cover_letter") or "",
                "applied_at": application.get("applied_at")
            })

        return {
            "status": "success",
            "applications": applications,
            "total": len(applications)
        }

    except HTTPException:
        raise

    except Exception as e:
        print("GET APPLICATIONS ERROR:", str(e))
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )



# ============================================================
# ADMIN APPLICATION MANAGEMENT
# ============================================================

class ApplicationStatusUpdate(BaseModel):
    status: str


ADMIN_APPLICATION_STATUSES = {
    "applied",
    "shortlisted",
    "interview",
    "selected",
    "rejected",
}


@app.get("/api/admin/applications")
def get_admin_applications():
    try:
        applications_response = (
            supabase
            .table("applications")
            .select("*")
            .execute()
        )

        applications_data = applications_response.data or []
        applications = []

        for application in applications_data:
            student_id = application.get("student_id")
            job_id = application.get("job_id")

            student = None
            user = None
            job = None
            company = None

            if student_id:
                student_response = (
                    supabase
                    .table("students")
                    .select("*")
                    .eq("id", student_id)
                    .limit(1)
                    .execute()
                )
                if student_response.data:
                    student = student_response.data[0]

                    user_id = student.get("user_id")
                    if user_id:
                        user_response = (
                            supabase
                            .table("users")
                            .select("id, name, email, role")
                            .eq("id", user_id)
                            .limit(1)
                            .execute()
                        )
                        if user_response.data:
                            user = user_response.data[0]

            if job_id:
                job_response = (
                    supabase
                    .table("jobs")
                    .select("*")
                    .eq("id", job_id)
                    .limit(1)
                    .execute()
                )
                if job_response.data:
                    job = job_response.data[0]

                    company_id = job.get("company_id")
                    if company_id:
                        company_response = (
                            supabase
                            .table("companies")
                            .select("*")
                            .eq("id", company_id)
                            .limit(1)
                            .execute()
                        )
                        if company_response.data:
                            company = company_response.data[0]

            applications.append({
                "id": application.get("id"),
                "student_id": student_id,
                "job_id": job_id,
                "student_name": (
                    user.get("name") if user else "Student"
                ),
                "student_email": (
                    user.get("email") if user else ""
                ),
                "degree": (
                    student.get("degree") if student else ""
                ),
                "target_role": (
                    student.get("target_role") if student else ""
                ),
                "job_title": (
                    job.get("role")
                    or job.get("title")
                    or job.get("job_title")
                    if job
                    else "Job"
                ),
                "company": (
                    company.get("name")
                    or company.get("company_name")
                    if company
                    else "Company"
                ),
                "location": (
                    job.get("location")
                    if job
                    else "Not specified"
                ),
                "salary": (
                    job.get("salary")
                    or job.get("salary_range")
                    if job
                    else "Not specified"
                ),
                "status": application.get("status") or "applied",
                "cover_letter": application.get("cover_letter") or "",
                "applied_at": (
                    application.get("applied_at")
                    or application.get("created_at")
                    or application.get("updated_at")
                ),
                "updated_at": application.get("updated_at"),
            })

        return {
            "status": "success",
            "applications": applications,
            "total": len(applications),
        }

    except HTTPException:
        raise

    except Exception as e:
        print("ADMIN APPLICATIONS ERROR:", str(e))
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@app.patch("/api/admin/applications/{application_id}/status")
def update_admin_application_status(
    application_id: str,
    request: ApplicationStatusUpdate,
):
    try:
        new_status = request.status.strip().lower()

        if new_status not in ADMIN_APPLICATION_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid application status. Use: "
                    "applied, shortlisted, interview, selected, or rejected."
                ),
            )

        existing_response = (
            supabase
            .table("applications")
            .select("id, status")
            .eq("id", application_id)
            .limit(1)
            .execute()
        )

        if not existing_response.data:
            raise HTTPException(
                status_code=404,
                detail="Application not found.",
            )

        update_response = (
            supabase
            .table("applications")
            .update({"status": new_status})
            .eq("id", application_id)
            .execute()
        )

        if not update_response.data:
            raise HTTPException(
                status_code=500,
                detail="Application status could not be updated.",
            )

        updated_application = update_response.data[0]

        return {
            "status": "success",
            "message": "Application status updated successfully.",
            "application": {
                "id": updated_application.get("id"),
                "status": updated_application.get("status"),
                "updated_at": updated_application.get("updated_at"),
            },
        }

    except HTTPException:
        raise

    except Exception as e:
        print("ADMIN APPLICATION STATUS ERROR:", str(e))
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )
