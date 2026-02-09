# AI Coding Agent Instructions

This is a **School Quiz Platform** - a full-stack Django + React application for teachers to create exams and students to take them.

## Architecture Overview

### Django Backend (`/backend`)
- **Framework**: Django 5.2 + Django REST Framework
- **Auth**: Session-based with CSRF protection; custom role-based permissions
- **Database**: SQLite (included in repo)
- **Key Pattern**: Function-based views with `@api_view` decorators using DRF permissions

### React Frontend (`/frontend`)
- **Stack**: React 18 + TypeScript + Vite + React Router v6 + Tailwind CSS
- **State Management**: Context API (`AuthContext.tsx`)
- **API Client**: Axios with CSRF token handling in `api.ts`
- **Build**: Vite dev server and production build

### Data Flow
1. Student/Teacher login → Django session cookie + CSRF token
2. Frontend maintains auth state in `AuthContext`
3. All API calls go through `apiClient` (axios instance) which auto-handles CSRF
4. Role-based access control happens in both backend (`@permission_classes`) and frontend (`RequireRole` component)

## Critical Files & Patterns

### Backend Models (quiz/models.py)
- **UserProfile**: Links Django User to role (TEACHER/STUDENT)
- **Exam**: Created by teachers; has negative marking settings (decimal)
- **Question**: 5 options (A-E); E is optional; stored per exam
- **StudentExamAttempt**: One per (exam, student) pair; enforced by unique constraint
- **StudentAnswer**: One per (attempt, question) pair
- **Result**: Calculated after submission; stores total_marks and obtained_marks

### Key Business Logic
- **Negative Marking**: If enabled, penalty = `negative_marks` × wrong answers
- **Marking**: Calculated in `attempt_result_view` (views.py, line ~270)
- **Attempt Lifecycle**: Started → Questions loaded → Submitted → Result calculated

### API Routes (config/urls.py)
- `/api/auth/csrf/` — GET CSRF cookie (must call before login on fresh session)
- `/api/auth/login/` — POST username/password
- `/api/auth/me/` — GET current user profile
- `/api/exams/` — GET (teacher) or POST (create)
- `/api/exams/<id>/questions/` — GET/POST questions for exam
- `/api/exams/join/` — POST exam_code (student)
- `/api/attempts/<id>/submit/` — POST answers (marks calculation happens here)

### Frontend Routes (App.tsx)
- `/login` — LoginPage
- `/teacher/dashboard` — TeacherDashboard (exams list)
- `/teacher/exam/create` — CreateExamPage
- `/teacher/exam/<id>/questions` — AddQuestionsPage
- `/teacher/results` — TeacherResultsPage
- `/student/join` — StudentJoinPage
- `/student/exam/<id>` — StudentExamPage
- `/student/exam/<id>/result` — StudentResultPage

## Essential Workflows

### Running Locally
```bash
# Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend (in new terminal)
cd frontend
npm install
npm run dev
```

### Creating Migrations
```bash
cd backend
python manage.py makemigrations quiz
python manage.py migrate
```

## Deployment (Netlify + Render)

### Critical: CSRF Configuration for Cross-Domain
When deploying frontend (Netlify) and backend (Render) to **different domains**, CSRF tokens fail unless explicitly configured:

**Backend (.env)**:
```
DJANGO_ALLOWED_HOSTS=<backend>.onrender.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://<frontend>.netlify.app
CSRF_TRUSTED_ORIGINS=https://<frontend>.netlify.app
```
**Must be single line, comma-separated** — not multiple declarations.

**Backend (settings.py)** has production CSRF fixes:
- `SESSION_COOKIE_DOMAIN = ".onrender.com"` (allows cross-origin cookies)
- `CSRF_COOKIE_HTTPONLY = False` (frontend can read token)
- `CSRF_HEADER_NAME = "HTTP_X_CSRFTOKEN"` (explicit header config)

**Frontend (.env)**:
```
VITE_API_URL=https://<backend>.onrender.com/api
```

**Frontend (api.ts)** includes debug logging to warn if CSRF token missing before POST.

See `DEPLOYMENT_CSRF_FIX.md` for full troubleshooting guide.

## Project-Specific Conventions

### Authentication Flow
1. All views require `@ensure_csrf_cookie` or handle CSRF explicitly
2. Session-based (not token); Django `login()` creates session
3. Frontend must call `/api/auth/csrf/` before first POST request
4. Permissions: `IsTeacher`, `IsStudent` (custom, in permissions.py)

### Serializer Patterns
- **ExamSerializer**: Validates negative_marks > 0 only if negative_marking_enabled
- **QuestionSerializer**: Validates option_e presence if it's correct_option
- **QuestionStudentSerializer**: Excludes correct_option (only for students taking exam)

### Frontend API Patterns
- `apiClient` in `api.ts` wraps all requests
- `ensureCsrf()` called before mutations
- Custom `ApiError` class with status + data fields
- Response wrappers normalize backend errors

### Database Constraints
- One attempt per exam per student (unique constraint)
- One answer per attempt per question (unique constraint)
- Option E is nullable but validated if marked correct

## Common Pitfalls & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| 403 CSRF mismatch | CSRF token not fetched | Call `/api/auth/csrf/` before POST |
| Decimal precision | Integer marks stored | Use `DecimalField` for marks calculations |
| Duplicate attempts | Multiple submissions | Enforce unique_exam_attempt constraint |
| Option E validation | Creating Q with E correct but no E text | Validate in serializer `validate()` method |

## Key Dependencies

**Backend**: Django, djangorestframework, django-cors-headers, python-dotenv
**Frontend**: React, react-router-dom, axios, Tailwind CSS
