# Hanexis — Deployment Guide

## One-Click Vercel Deploy

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial Hanexis build"
git remote add origin https://github.com/YOUR_USERNAME/hanexis.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Set **Framework**: Next.js
4. Set **Build Command**: `prisma generate && next build`
5. Set **Install Command**: `npm install`

### Step 3: Add Environment Variables in Vercel Dashboard

Go to Settings → Environment Variables and add ALL of these:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_5q2oDuOjWesH@ep-patient-river-apjirx8l-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| `NEXTAUTH_URL` | `https://YOUR-VERCEL-APP.vercel.app` |
| `NEXTAUTH_SECRET` | `6aef84d02f75c69965fb745b505e5a05f11dc2f82b70240140914bcd350b7afd` |
| `OPENAI_API_KEY` | `sk-proj-yca93f384SvPtAJV7x-...` |
| GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

> ⚠️ Set NEXTAUTH_URL to your actual Vercel deployment URL BEFORE deploying.

### Step 4: Set up database (run once locally)
```bash
npm install
npx prisma db push
```

### Step 5: Update OAuth Redirect URIs

**Google Cloud Console** (https://console.cloud.google.com):
- Authorized redirect URIs → Add: `https://YOUR-APP.vercel.app/api/auth/callback/google`

**LinkedIn Developer Portal** (https://www.linkedin.com/developers/apps):
- Auth tab → Authorized redirect URLs → Add: `https://YOUR-APP.vercel.app/api/auth/callback/linkedin`

### Step 6: Redeploy
After setting env vars, trigger a redeploy in Vercel dashboard.

---

## Local Development
```bash
npm install
cp .env.local.example .env.local   # fill in values
npx prisma db push
npm run dev
```
Open http://localhost:3000

## Features
- ✅ Email/password + Google + LinkedIn OAuth
- ✅ Lead management (add, import from LinkedIn, tag, filter)
- ✅ AI message generation (OpenAI google/gemini-2.5-flash)
- ✅ Smart Inbox with AI reply suggestions
- ✅ Outreach Center — group messaging via relay (LinkedIn/Google/Manual)
- ✅ Follow-up scheduling
- ✅ Campaign management
- ✅ Content creator (posts, video scripts, job posts)
- ✅ Analytics dashboard with charts
- ✅ CSV export
- ✅ PostgreSQL (Neon) database
- ✅ Black/white/grey UI theme
