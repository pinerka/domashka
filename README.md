# LearnSpace SaaS

Scalable MVP scaffold for an online tutoring SaaS platform with marketplace, booking, live lesson room, courses, teacher CRM, and admin moderation.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS + shadcn-style UI primitives
- Supabase Auth, PostgreSQL, Storage, Realtime
- React Query + Zustand
- tldraw whiteboard SDK
- Daily API integration boundary

## Local Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Apply the Supabase schema from `supabase/migrations/0001_initial_schema.sql`.

## Supabase

Apply migrations in order:

```bash
supabase db push
supabase db reset
```

Seed demo data:

```bash
supabase db reset --local
```

Demo accounts in local Supabase:

- `student@learnspace.dev` / `password123`
- `teacher@learnspace.dev` / `password123`
- `author@learnspace.dev` / `password123`
- `admin@learnspace.dev` / `password123`
