-- Feedback widget schema for eligibil.org
-- Run in Supabase SQL Editor

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  rating text not null check (rating in ('yes', 'no', 'unsure')),
  funding_type_interest text not null check (
    funding_type_interest in ('grant', 'accelerator', 'investor', 'credit', 'european_program', 'unknown')
  ),
  message text null,
  page text not null,
  user_agent text null,
  language text not null default 'ro',
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);
create index if not exists feedback_rating_idx on public.feedback (rating);
create index if not exists feedback_funding_type_idx on public.feedback (funding_type_interest);
create index if not exists feedback_page_idx on public.feedback (page);
