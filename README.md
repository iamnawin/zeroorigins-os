# ZeroOrigins OS

Internal + External Company Operating System.

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase (Auth, PostgreSQL, RLS)
- Dark / Chrome / Amber theme

## Setup

```bash
npm install
copy .env.local.example .env.local
# Fill in Supabase URL and anon key

# Run supabase/migrations/001_initial_schema.sql in Supabase SQL Editor
# Sign up, then promote yourself:
# UPDATE profiles SET role = 'FOUNDER', full_name = 'Naveen' WHERE email = 'your@email.com';
# Optionally run supabase/seed.sql

npm run dev
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Routes

| Route | Type |
|-------|------|
| `/login`, `/signup`, `/forgot-password` | Auth |
| `/request-build` | Public → creates lead |
| `/partner-with-us` | Public → creates partner |
| `/internal/control-room` | Dashboard |
| `/internal/ideas` | CRUD |
| `/internal/projects` | CRUD |
| `/internal/tasks` | CRUD |
| `/internal/leads` | CRUD |
| `/internal/partners` | CRUD |
| `/portal/customer/dashboard` | Placeholder |
| `/portal/partner/dashboard` | Placeholder |
