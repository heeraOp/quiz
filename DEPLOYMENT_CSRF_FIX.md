# CSRF Token Fix for Netlify + Render Deployment

## Problem
When deploying frontend to **Netlify** and backend to **Render**, login fails with "CSRF token not provided" or "Invalid credentials" because cross-origin cookies aren't being sent/validated properly.

## Root Causes Fixed

### 1. **Duplicate DJANGO_ALLOWED_HOSTS in .env** ✅
**Issue**: `.env` had `DJANGO_ALLOWED_HOSTS` defined twice; only the last value was used.
```dotenv
# ❌ BEFORE (wrong - render domain was ignored)
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://projectcasiopea.netlify.app
CSRF_TRUSTED_ORIGINS=https://projectcasiopea.netlify.app
DJANGO_ALLOWED_HOSTS=quizschool.onrender.com

# ✅ AFTER (correct - all hosts in one line)
DJANGO_ALLOWED_HOSTS=quizschool.onrender.com,localhost,127.0.0.1
```

### 2. **Missing Cookie Domain Configuration** ✅
**Issue**: Django wasn't setting the cookie domain for cross-origin cookies.
```python
# ✅ Added to settings.py
if not DEBUG:
    SESSION_COOKIE_DOMAIN = ".onrender.com"
    CSRF_COOKIE_DOMAIN = ".onrender.com"

CSRF_COOKIE_HTTPONLY = False  # Frontend needs to read CSRF cookie
```

### 3. **CSRF Header Not Explicitly Configured** ✅
**Issue**: Django's default CSRF header name didn't match frontend expectations.
```python
# ✅ Added to settings.py
CSRF_HEADER_NAME = "HTTP_X_CSRFTOKEN"
```

### 4. **Missing Request Debugging** ✅
**Issue**: Hard to diagnose if CSRF token was being sent. Added client-side logging.

## Render Environment Variables Setup

Set these **exact** environment variables in your Render dashboard (`Environment` tab):

```
DEBUG=False
SECRET_KEY=<your-secret-key>
DJANGO_ALLOWED_HOSTS=<your-render-backend>.onrender.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://<your-netlify-frontend>.netlify.app
CSRF_TRUSTED_ORIGINS=https://<your-netlify-frontend>.netlify.app
```

**Example** (if your domains are what's in the .env):
```
DEBUG=False
SECRET_KEY=ah&q-lgf7q72fuomemz1^(z2(1dk+#$a_2e%5p(9!-sv0%f3gt
DJANGO_ALLOWED_HOSTS=quizschool.onrender.com
CORS_ALLOWED_ORIGINS=https://projectcasiopea.netlify.app
CSRF_TRUSTED_ORIGINS=https://projectcasiopea.netlify.app
```

## Netlify Environment Variables Setup

Set these in your Netlify dashboard (`Site settings` → `Build & deploy` → `Environment`):

```
VITE_API_URL=https://<your-render-backend>.onrender.com/api
```

**Example**:
```
VITE_API_URL=https://quizschool.onrender.com/api
```

## Testing the Fix Locally

1. **Start backend** (with production settings):
```bash
cd backend
DEBUG=False python manage.py runserver
```

2. **Start frontend** with production API URL:
```bash
cd frontend
VITE_API_URL=http://localhost:8000/api npm run dev
```

3. **Check browser console** for warnings about CSRF tokens
4. **Verify in DevTools** → Application → Cookies:
   - Should see `csrftoken` cookie set from backend
   - Should see `sessionid` cookie after login

## Debugging Checklist

- [ ] `.env` has `DJANGO_ALLOWED_HOSTS` with all domains on **one line** (comma-separated)
- [ ] Render env vars match `.env` values exactly
- [ ] Frontend `.env` has correct `VITE_API_URL`
- [ ] Backend is returning CSRF cookie: Check DevTools → Network → `/api/auth/csrf/` → Response headers should have `Set-Cookie: csrftoken=...`
- [ ] Cookies are being sent: DevTools → Network → `/api/auth/login/` → Request headers should have `Cookie: csrftoken=...;sessionid=...`
- [ ] CSRF token is in header: DevTools → Network → `/api/auth/login/` → Request headers should have `X-CSRFToken: <token>`

## If Still Getting CSRF Errors

**Backend error logs** (Render dashboard → Logs):
```
Forbidden (403): CSRF verification failed. Request aborted.
Reason given for failure: CSRF cookie not set.
```
→ Means frontend never sent the CSRF cookie. Check:
1. Is frontend calling `/api/auth/csrf/` first?
2. Are cookies being set? (DevTools → Application → Cookies)
3. Is `CORS_ALLOWED_ORIGINS` exactly matching frontend domain?

```
Forbidden (403): CSRF verification failed. Request aborted.
Reason given for failure: CSRF token missing or incorrect.
```
→ Means token was sent but validation failed. Check:
1. Is `X-CSRFToken` header being sent?
2. Is `CSRF_HEADER_NAME = "HTTP_X_CSRFTOKEN"` in settings.py?
3. Are `CSRF_TRUSTED_ORIGINS` properly set?

## Chrome DevTools Tips

1. **Check CSRF cookie exists**:
   - DevTools → Application → Cookies → Select backend domain
   - Look for `csrftoken` cookie

2. **Verify CSRF header is being sent**:
   - DevTools → Network → click login request
   - → Headers → Request Headers section
   - Should see `x-csrftoken: <token>`

3. **Check response from CSRF endpoint**:
   - Network → `/api/auth/csrf/` → Response
   - Headers should show `Set-Cookie: csrftoken=...`

## Summary

The key issue was **Django not knowing which domains to allow cookies for**. By setting:
- `SESSION_COOKIE_DOMAIN` and `CSRF_COOKIE_DOMAIN` for production
- Fixing duplicate env vars
- Explicitly configuring the CSRF header name

The frontend (Netlify) can now properly receive and send CSRF tokens to the backend (Render).
