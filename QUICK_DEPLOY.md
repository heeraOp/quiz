# Quick Deploy Guide (5 Minutes)

## 1️⃣ Backend Deployment to Render

### Step 1: Set Up Render Service
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect your GitHub repo
4. Set these values:

| Field | Value |
|-------|-------|
| **Name** | `school-quiz-backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r backend/requirements.txt && python backend/manage.py migrate && python backend/manage.py collectstatic --noinput` |
| **Start Command** | `gunicorn config.wsgi:application --chdir backend` |

### Step 2: Add Environment Variables
Go to Environment in Render dashboard, add:

```
DEBUG=False
SECRET_KEY=<generate-with-https://djecrety.ir/>
DJANGO_ALLOWED_HOSTS=<your-service>.onrender.com
CORS_ALLOWED_ORIGINS=https://<your-netlify-site>.netlify.app
CSRF_TRUSTED_ORIGINS=https://<your-netlify-site>.netlify.app
```

### Step 3: Deploy
- Click "Deploy" 
- Wait ~2-3 minutes for build
- Copy your backend URL: `https://<your-service>.onrender.com`

---

## 2️⃣ Frontend Deployment to Netlify

### Step 1: Set Up Netlify Site
1. Go to [netlify.com](https://netlify.com)
2. Create new site
3. Connect your GitHub repo
4. Set these values:

| Field | Value |
|-------|-------|
| **Base Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

### Step 2: Add Environment Variables
Go to Site Settings → Build & Deploy → Environment, add:

```
VITE_API_URL=https://<your-render-backend>.onrender.com/api
```

### Step 3: Deploy
- Click "Deploy"
- Wait ~1-2 minutes for build
- Copy your frontend URL: `https://<your-netlify-site>.netlify.app`

---

## 3️⃣ Test Login Flow

1. Go to frontend URL in browser
2. Open DevTools (F12)
3. Go to Application → Cookies
4. Enter test credentials
5. Should see `csrftoken` + `sessionid` cookies
6. Should redirect to dashboard (no CSRF errors)

---

## 🆘 If Login Fails with CSRF Error

### Check Backend Environment Variables
```bash
# Are all 3 variables set?
- DEBUG=False ✓
- DJANGO_ALLOWED_HOSTS=<your-domain> ✓
- CORS_ALLOWED_ORIGINS=https://<frontend>.netlify.app ✓
- CSRF_TRUSTED_ORIGINS=https://<frontend>.netlify.app ✓
```

### Check Frontend Environment Variable
```bash
# Is this set in Netlify?
- VITE_API_URL=https://<your-backend>.onrender.com/api ✓
```

### Check Browser Console
- Any warnings about missing CSRF token?
- See DevTools → Network → Click login request
  - Headers should have `X-CSRFToken: <value>`

### Check Backend Logs
- Go to Render → Logs
- Look for "CSRF verification failed"

**See `DEPLOYMENT_CSRF_FIX.md` for full troubleshooting**

---

## 📋 Complete Checklist

- [ ] Backend deployed to Render
- [ ] All 4 backend env vars set
- [ ] Frontend deployed to Netlify
- [ ] VITE_API_URL env var set
- [ ] Login works without CSRF errors
- [ ] Can create exam (teacher) or join exam (student)
- [ ] No console errors in DevTools

---

## 🎯 Your Current Domains

**Backend**: `https://quizschool.onrender.com`  
**Frontend**: `https://projectcasiopea.netlify.app`

These are already configured in your `.env` file ✅

---

## ⚡ Emergency Rollback

If deployment fails:

1. **Backend**: Go to Render dashboard → Deployments → Click previous version → "Re-Deploy"
2. **Frontend**: Go to Netlify → Deploys → Click previous → "Restore"

---

## 💬 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| `CSRF token not provided` | Check CORS_ALLOWED_ORIGINS matches frontend domain exactly |
| `Invalid credentials` | Usually CSRF issue in disguise—check frontend devtools |
| `403 Forbidden` | Check DJANGO_ALLOWED_HOSTS includes your Render domain |
| `VITE_API_URL not working` | Rebuild frontend after setting env var |
| Database reset on restart | Normal for free Render tier; use PostgreSQL for persistence |

---

**Ready? Start with Step 1 above! 🚀**
