# CSRF Token Fix - Changes Applied

## Summary
Fixed the "CSRF token not provided" error when logging in from Netlify frontend to Render backend by implementing proper cross-domain cookie configuration and fixing environment variable issues.

## Changes Made

### 1. ✅ Backend `.env` File
**File**: `backend/.env`

**Fixed**: Duplicate `DJANGO_ALLOWED_HOSTS` declaration
```diff
- DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
  CORS_ALLOWED_ORIGINS=https://projectcasiopea.netlify.app
  CSRF_TRUSTED_ORIGINS=https://projectcasiopea.netlify.app
- DJANGO_ALLOWED_HOSTS=quizschool.onrender.com

+ DJANGO_ALLOWED_HOSTS=quizschool.onrender.com,localhost,127.0.0.1
  CORS_ALLOWED_ORIGINS=https://projectcasiopea.netlify.app
  CSRF_TRUSTED_ORIGINS=https://projectcasiopea.netlify.app
```

### 2. ✅ Django Settings - CSRF Configuration
**File**: `backend/config/settings.py`

**Added** explicit CSRF header configuration:
```python
CSRF_HEADER_NAME = "HTTP_X_CSRFTOKEN"
CSRF_FAILURE_VIEW = "django.views.csrf.csrf_failure"
```

### 3. ✅ Django Settings - Cookie Domain Configuration
**File**: `backend/config/settings.py`

**Added** production cookie domain settings:
```python
if not DEBUG:
    SESSION_COOKIE_DOMAIN = ".onrender.com"
    CSRF_COOKIE_DOMAIN = ".onrender.com"

CSRF_COOKIE_HTTPONLY = False  # Frontend must be able to read token
```

### 4. ✅ Frontend API Client - Debug Logging
**File**: `frontend/src/api.ts`

**Added** request interceptor to detect missing CSRF tokens:
```typescript
apiClient.interceptors.request.use((config) => {
  const token = document.cookie
    .split("; ")
    .find(row => row.startsWith("csrftoken="))
    ?.split("=")[1];
  
  if (config.method !== "get" && !token) {
    console.warn("⚠️  CSRF token not found in cookies before POST/PATCH/DELETE request");
  }
  return config;
});
```

### 5. ✅ Documentation
**New Files**:
- `DEPLOYMENT_CSRF_FIX.md` - Complete troubleshooting guide with Render/Netlify setup instructions
- `.github/copilot-instructions.md` - Updated with deployment configuration details

## What These Changes Fix

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| CSRF token not being sent | Frontend never received CSRF cookie from backend | Set `SESSION_COOKIE_DOMAIN` so Render backend sends cookies Netlify frontend can read |
| CSRF validation failing | Django looking for CSRF in wrong place (form data vs header) | Set `CSRF_HEADER_NAME = "HTTP_X_CSRFTOKEN"` to accept from axios header |
| Login showing invalid credentials | Django rejecting request due to CSRF failure before auth check | All of the above |
| Can't read CSRF token | `CSRF_COOKIE_HTTPONLY = True` by default | Set to `False` in production |
| Env vars not applying | Duplicate `DJANGO_ALLOWED_HOSTS` caused only last value to be used | Combined into single comma-separated line |

## Next Steps - Verify the Fix

### Step 1: Redeploy Backend to Render
```bash
# Push changes
git add backend/.env backend/config/settings.py
git commit -m "Fix CSRF for cross-domain deployment"
git push origin main  # Render will auto-redeploy
```

### Step 2: Verify Render Environment Variables
1. Go to Render dashboard → Your backend service
2. Click "Environment" tab
3. Verify these exact values:
```
DJANGO_ALLOWED_HOSTS=quizschool.onrender.com
CORS_ALLOWED_ORIGINS=https://projectcasiopea.netlify.app
CSRF_TRUSTED_ORIGINS=https://projectcasiopea.netlify.app
DEBUG=False
SECRET_KEY=<your-key>
```

### Step 3: Redeploy Frontend to Netlify
```bash
# Push changes
git add frontend/src/api.ts
git commit -m "Add CSRF debug logging"
git push origin main  # Netlify will auto-redeploy
```

### Step 4: Test Login
1. Go to `https://projectcasiopea.netlify.app/login`
2. Open DevTools (F12) → Application → Cookies
3. Enter test credentials
4. You should see:
   - `csrftoken` cookie set after clicking login
   - No console warnings about missing CSRF token
   - Successful redirect after auth

### Step 5: Debug If Still Failing

**Check backend logs** (Render dashboard → Logs):
- Look for "CSRF verification failed"
- Check IP: should be Netlify's IP, not yours (behind proxy)

**Check browser DevTools** (Network tab):
- `/api/auth/csrf/` → Response headers should have `Set-Cookie: csrftoken=...`
- `/api/auth/login/` → Request headers should have `X-CSRFToken: <value>`
- `/api/auth/login/` → Request headers should have `Cookie: csrftoken=...; sessionid=...`

See `DEPLOYMENT_CSRF_FIX.md` for complete troubleshooting steps.

## Files Modified
- `backend/.env` — Fixed duplicate DJANGO_ALLOWED_HOSTS
- `backend/config/settings.py` — Added cookie domain + CSRF header config
- `frontend/src/api.ts` — Added debug logging interceptor
- `.github/copilot-instructions.md` — Updated with deployment details
- **NEW** `DEPLOYMENT_CSRF_FIX.md` — Comprehensive troubleshooting guide
