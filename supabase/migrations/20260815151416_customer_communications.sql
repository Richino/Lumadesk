create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) <= 320),
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

alter table public.newsletter_subscribers enable row level security;
revoke all on public.newsletter_subscribers from anon, authenticated;
