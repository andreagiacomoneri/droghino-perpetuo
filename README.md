# Droghino Perpetuo

The eternal score tracker for Andre vs Cami.

## Setup

1. Clone the repo
2. Create `.env.local` in the root with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
3. Run `npm install` then `npm run dev`

## Deploy

Push to `main` — Vercel auto-deploys.
Make sure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Vercel environment variables.
