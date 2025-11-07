create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null,
  display_name text,
  preferred_locales text[] default array['en'],
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.volunteers (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  locales text[] not null default array['en'],
  available boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.handoff_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  volunteer_id uuid references public.volunteers(id),
  status text not null check (status in ('pending','assigned','connected','resolved','cancelled')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

create table if not exists public.image_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  caption text,
  observations text[] default array[]::text[],
  text_blocks text[] default array[]::text[],
  confidence numeric(3, 2) not null default 0.0,
  rationale text,
  handoff_request_id uuid references public.handoff_requests(id),
  completed_at timestamptz not null default timezone('utc'::text, now()),
  raw_response jsonb,
  language text default 'en',
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  analysis_id uuid references public.image_analyses(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_image_analyses_user on public.image_analyses(user_id);
create index if not exists idx_handoff_requests_user on public.handoff_requests(user_id);
create index if not exists idx_handoff_requests_status on public.handoff_requests(status);
create index if not exists idx_history_user on public.history(user_id);

create table if not exists public.handoff_signals (
  id bigserial primary key,
  handoff_id uuid not null references public.handoff_requests(id) on delete cascade,
  sender text not null,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_handoff_signals_handoff on public.handoff_signals(handoff_id);
