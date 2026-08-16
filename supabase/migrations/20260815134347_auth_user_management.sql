create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null unique,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  marketing_emails boolean not null default true,
  order_updates boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

revoke all on table public.users from anon;
revoke all on table public.users from authenticated;
grant select on table public.users to authenticated;
grant update (first_name, last_name, avatar_url, marketing_emails, order_updates, updated_at)
  on table public.users to authenticated;

create policy "Users can read their own profile"
  on public.users for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.users for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, first_name, last_name, email)
  values (
    new.id,
    coalesce(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    coalesce(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create function public.sync_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.users
  set email = new.email,
      updated_at = now()
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute procedure public.sync_user_email();

create function public.set_user_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_public_user_updated_at
  before update on public.users
  for each row execute procedure public.set_user_updated_at();

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.sync_user_email() from public, anon, authenticated;
revoke all on function public.set_user_updated_at() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can update their own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and owner_id = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and owner_id = (select auth.uid()::text)
  );
