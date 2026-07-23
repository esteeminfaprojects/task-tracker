# Task Management and Time Tracker — Deployment & Auto-Sync Guide

This guide takes your Google AI Studio app to a **free live URL** with **shared
multi-user data** and a **versioned pipeline** where changes you make in AI
Studio flow to the live site automatically.

---

## 1. What you have now

Your app is a **Vite + React 19 + Node/Express** application. The server
(`server.ts`) exists only to keep your **Gemini API key server-side** and proxy
four AI routes (`/api/gemini/*`). All task/user/time-log data used to live in the
**browser only** (localStorage) — so it reset per browser and was never shared.

This package adds a small, non-invasive production layer:

| File | Purpose |
|------|---------|
| `src/lib/supabaseClient.ts` | Creates a Supabase client (only if env vars are set). |
| `src/lib/remoteStore.ts` | Loads/saves the six data collections to Supabase. |
| `src/App.tsx` (edited) | Now hydrates from Supabase and writes changes back. **Panels were not touched.** |
| `api/index.ts` | The Gemini routes as a Vercel serverless function. |
| `vercel.json` | Tells Vercel how to build the app and route `/api/*`. |
| `supabase/schema.sql` | One-time database setup. |
| `.env.example` | The env vars you need. |

**Safe fallback:** if you never configure Supabase, the app behaves exactly like
the original (localStorage only). Nothing breaks.

---

## 2. Choose your workflow (important)

AI Studio can **push** code to GitHub but does **not pull** — so if you edit in
AI Studio and also edit the repo directly, they can fight. Pick one:

### ▶ Recommended — keep AI Studio as your single source
Add the files from this package **into your AI Studio project** (AI Studio's code
editor lets you create files and paste content). Then AI Studio stays your
editor, and every "Sync to GitHub" carries these production files too. This
preserves the exact requirement: *change in AI Studio → reflected live, versioned.*

### Alternative — repo becomes the source
Use this package as the repository and edit code there (VS Code, etc.). You lose
AI Studio's editor for this project, but gain normal git workflows. Only choose
this if you plan to stop editing in AI Studio.

---

## 3. Set up Supabase (shared data) — ~5 min

1. Go to **supabase.com**, sign in, and create a **New project** (free tier).
   Pick a strong database password and your closest region.
2. When it's ready, open **SQL Editor → New query**, paste the entire contents of
   `supabase/schema.sql`, and click **Run**. This creates the `app_state` table.
3. Open **Project Settings → API** and copy two values:
   - **Project URL** → this is `VITE_SUPABASE_URL`
   - **anon / public key** → this is `VITE_SUPABASE_ANON_KEY`
   (The anon key is meant to be public; Row Level Security protects the data.)

Keep these two values handy for step 5.

---

## 4. Connect GitHub (the versioned backbone)

Your GitHub account **esteeminfaprojects** already has the "Google AI Studio"
app installed — so this is quick.

1. In AI Studio, open the right-side panel → **GitHub** tab → **Sign in to GitHub
   to continue**. **Click it yourself** (a real click), and if nothing opens,
   click the **pop-up-blocked icon** at the right of Chrome's address bar →
   **Always allow pop-ups from aistudio.google.com** → click again.
2. Once connected, choose **Create repository** (e.g. `task-management-time-tracker`).
   AI Studio pushes your code — this is your first commit / version.
3. Every future change you make in AI Studio → click **Sync to GitHub** → that's a
   new versioned commit.

> If you took the "repo becomes the source" path instead, just create an empty
> GitHub repo and `git push` this folder to it.

---

## 5. Deploy on Vercel (free) — ~5 min

1. Go to **vercel.com**, **Sign up with GitHub**, authorize Vercel.
2. **Add New… → Project → Import** your `task-management-time-tracker` repo.
   Vercel reads `vercel.json` automatically (build = `vite build`, output = `dist`).
3. Before deploying, open **Environment Variables** and add three:
   - `GEMINI_API_KEY` = your Gemini key (from AI Studio → Settings → Secrets, or
     Google AI Studio API keys)
   - `VITE_SUPABASE_URL` = the Project URL from step 3
   - `VITE_SUPABASE_ANON_KEY` = the anon key from step 3
4. Click **Deploy**. In ~1 minute you get a live URL like
   `https://task-management-time-tracker.vercel.app`.

**The versioned auto-sync loop is now complete:**

```
Edit in AI Studio  →  Sync to GitHub (new commit = new version)
                          →  Vercel auto-builds & deploys that commit
                          →  live URL updates, every old version kept for 1-click rollback
```

Vercel's **Deployments** tab shows every version; **Supabase** holds the shared
data; and AI Studio's **Versions** tab is a third safety net.

---

## Zero-config alternative: AI Studio "Publish"

If you want a live URL in **one click** without GitHub/Vercel/Supabase, open the
**Publish** panel in AI Studio and click **Get started**. It deploys to Google
Cloud Run (free tier), auto-secures your Gemini key, and the **Versions** tab
tracks versions. Trade-off: data still resets on refresh until you add Supabase
(the steps above). Good for a quick demo; the Vercel + Supabase route above is
the real multi-user production setup.

---

## Locking it down (do this before real company use)

The starter database policies let anyone with the public URL + anon key read and
write shared data. That's fine behind a private link, but for real security:

1. Turn on **Supabase Auth** (email or Google) and add a proper login screen.
2. Replace the "allow all" policies in `schema.sql` with policies that require
   `auth.role() = 'authenticated'` (and optionally check the user's role).
3. Consider moving from the single-document model to **granular tables**
   (one row per task / time-log) for better concurrency and reporting — the app's
   `types.ts` already defines clean shapes for this.

---

## Notes & known trade-offs

- **Concurrency:** each collection is saved as one JSON document (last-write-wins
  per collection). Perfect for a small team; move to granular rows if many people
  edit the same collection simultaneously.
- **Already built:** Export-to-Excel (CSV), role/department/user management, HOD &
  Admin reports, and animated pages (Framer Motion) with Lucide icons are already
  in the app — no extra work needed there.
- **Realtime:** `schema.sql` enables Supabase realtime on `app_state`; wiring a
  live subscription so open browsers refresh instantly is a small future add.
- **"Reset Factory Defaults"** in the app now also resets the shared cloud data
  (not just the local browser) — use with care once live.
