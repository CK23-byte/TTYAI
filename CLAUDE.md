# TalkToYouAI

Grief tech web app - AI-powered text and voice conversations with loved ones.

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS v4
- Supabase (Auth + DB + Storage)
- Vercel (hosting + serverless functions)
- Anthropic Claude API (chat), OpenAI Realtime (voice), ElevenLabs (voice clone), Stripe (payments)

## Commands
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Architecture
- Frontend: `src/` - React SPA with React Router
- API: `api/` - Vercel serverless functions (Node.js)
- All API keys are server-side only (in `api/` functions)
- Supabase RLS on all tables - users only access own data
- Credits deducted server-side via `deduct_credits` RPC

## Key Conventions
- Lucide React icons only (no emojis in UI)
- Mobile-first responsive design
- SEOHead component on every page
- ProtectedRoute wrapper for auth-required pages
- All external API calls proxied through `/api/*`
