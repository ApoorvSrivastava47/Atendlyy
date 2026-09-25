# Atendly — Vercel + Supabase deployment

## Architecture

- **Frontend:** React + Vite on Vercel
- **Backend/database/auth:** Supabase
- **Authentication:** Supabase Auth + Google OAuth
- **Google integration:** Google Drive + Google Sheets using the Google provider token returned by Supabase Auth
- **Offline UX:** local browser cache remains available; authenticated changes are synchronized to Supabase
- **SPA routing:** `vercel.json` rewrites application routes to `index.html`

## 1. Create the Supabase project

Create a Supabase project and open **SQL Editor**.

Run:

```sql
-- Copy the complete contents of:
supabase/schema.sql
```

The app uses a single `app_state` table with Row Level Security. Every authenticated user can read/write only their own state.

## 2. Configure Google Sign-In in Supabase

In Supabase:

**Authentication → Providers → Google → Enable**

Create/use a Google OAuth Web Client in Google Cloud.

Google Cloud should contain:

- Authorized JavaScript origin: your Vercel URL, e.g. `https://atendly.vercel.app`
- Authorized redirect URI: the Supabase callback URL shown by the Supabase Google provider setup, normally:
  `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`

In Supabase **Authentication → URL Configuration**:

- Site URL: your Vercel production URL
- Redirect URLs: your Vercel production URL
- Also add `http://localhost:5173` while developing locally

For Drive/Sheets integration, the Google consent screen must allow:

- `https://www.googleapis.com/auth/drive.file`
- `https://www.googleapis.com/auth/spreadsheets`

Google may require OAuth consent-screen configuration/verification depending on the audience and scopes.

## 3. Vercel environment variables

Add these to the Vercel project:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Use the Supabase **publishable/anon client key**, never a Supabase secret/service-role key in Vite frontend environment variables.

## 4. Deploy

Push this folder to GitHub and import the repository into Vercel.

Framework preset: **Vite**

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

No separate Express server is required for this version. Supabase replaces the previous in-memory Express services.

## 5. Local development

Create `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Then:

```bash
npm install
npm run dev
```

## Important behavior

### Google account login
Google OAuth is handled by Supabase Auth. After login, Atendly hydrates the user's state from Supabase.

### Google Drive / Sheets
The Google provider token is used only in the browser for Drive/Sheets API calls. Supabase does not store that provider token in the database.

If a returning session does not contain a Google provider token, the app remains logged in and Supabase data continues to work; Drive/Sheets shows a reconnect message.

### Guest mode
Guest mode intentionally remains local-only. This lets the app work without an account.

### Existing mock data
On a user's first authenticated login, if that state does not yet exist in Supabase, the current Atendly seed/mock state is uploaded as that user's initial state.

## Files added/changed for deployment

- `src/lib/supabase.ts`
- `src/services/cloudStateService.ts`
- Supabase-backed auth in `src/services/googleAuthService.ts`
- Supabase persistence hooks in app/components/services
- `supabase/schema.sql`
- `vercel.json`
- `.env.example`
- `README_DEPLOY.md`

The old Firebase client configuration was removed.
