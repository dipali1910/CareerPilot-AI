# CareerPilot AI

**AI-Powered Career Guidance & Placement System**

CareerPilot AI is a web-based career and placement support platform. Students can create an account, upload a PDF resume, review profile information extracted from that resume, explore career recommendations, identify skill gaps, follow a learning roadmap, and track job applications. Administrators can review and update application statuses.

> **Implementation note:** The current resume parser uses PDF text extraction, OCR fallback, and rule-/keyword-based matching. Readiness scores use a transparent weighted formula. Do not describe the current implementation as an LLM-powered or generative-AI system unless that integration is added separately.

## Main features

- Email/password authentication through Supabase Auth.
- Individual student profiles linked to authenticated account IDs.
- PDF resume upload (up to 5 MB) with text extraction and OCR fallback for scanned documents.
- Resume-derived education, location, career-role and skill information.
- Student dashboard with placement-readiness metrics and profile summary.
- Career analysis, career recommendations and skill-gap information.
- Learning roadmaps and roadmap-item updates.
- Placement opportunities, job-match details and job applications.
- Application tracking for students and application-status management for administrators.

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, Tailwind CSS 4 |
| Backend | Python, FastAPI, Uvicorn, Pydantic |
| Database and authentication | Supabase (PostgreSQL and Supabase Auth) |
| Resume processing | pypdf, PyMuPDF, pytesseract, Tesseract OCR, Pillow |
| Deployment | Vercel (frontend), Render (backend) |

## Project structure

```text
CareerPilot-AI/
├── backend/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── package.json
│   └── src/
│       ├── pages/
│       │   ├── auth/
│       │   ├── student/
│       │   └── admin/
│       ├── layouts/
│       └── App.jsx
├── docs/
│   └── PROJECT_DOCUMENTATION.md
└── .gitignore
```

## Local setup

### 1. Clone the repository

```bash
git clone https://github.com/dipali1910/CareerPilot-AI.git
cd CareerPilot-AI
```

### 2. Configure the backend

Create a virtual environment and install dependencies:

```bash
cd backend
python -m venv .venv
# Windows:
.venv\\Scripts\\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
```

Create a backend `.env` file with these server-side variables:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_publishable_or_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_server_only_service_role_key
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code or commit real secrets to Git.

Run the API:

```bash
uvicorn main:app --reload
```

The API root is `http://127.0.0.1:8000/`; interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### 3. Configure the frontend

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_KEY=your_supabase_publishable_or_anon_key
VITE_API_URL=http://127.0.0.1:8000
```

Use the API URL variable expected by the frontend API helper in the checked-out version. Do not place a service-role key in any `VITE_*` variable.

Install and run:

```bash
cd frontend
npm install
npm run dev
```

Build check:

```bash
npm run build
```

## Authentication and user data

The frontend signs users in through Supabase Auth. Protected backend requests send the current Supabase access token as a Bearer token. The backend verifies that token and derives the account ID and email from the verified session; it does not trust a client-supplied user ID for ownership.

The resume-upload endpoint creates or updates the application user and student profile using the authenticated Supabase user ID. Student-specific records are queried by the student's own profile ID. Administrator application endpoints additionally check the user's role.

In Supabase, email confirmation can be disabled for a project when immediate email/password signup is required. This is a project-level authentication setting, not a frontend code change.

## Documentation

See [docs/PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md) for the project overview, objectives, architecture, modules, database entities, API routes, resume-processing workflow, readiness formula, requirements, testing checklist, limitations and future scope.

## Deployment

- Frontend: https://career-pilot-ai-six-brown.vercel.app
- Backend: https://careerpilot-ai-backend-docker.onrender.com

Deployment availability depends on the current hosting configuration and service status.

## Current validation status

The repository contains the application implementation and a multi-user authentication/resume-profile change on the `fix/multi-user-auth-resume-analysis` branch. Before treating the project as fully verified, test two different accounts with two different resumes and confirm that each account sees only its own profile and derived dashboard data. Confirm that the reviewed branch is merged and deployed before relying on these changes in production.
