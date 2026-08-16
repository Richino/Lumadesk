alter table public.users
  add column if not exists has_password boolean not null default false;

update public.users as profile
set has_password = (coalesce(auth_user.encrypted_password, '') <> '')
from auth.users as auth_user
where profile.id = auth_user.id;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, first_name, last_name, email, has_password)
  values (
    new.id,
    coalesce(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    coalesce(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    new.email,
    coalesce(new.encrypted_password, '') <> ''
  );
  return new;
end;
$$;

create or replace function public.sync_user_password_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.users
  set has_password = (coalesce(new.encrypted_password, '') <> ''),
      updated_at = now()
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_password_updated on auth.users;
create trigger on_auth_user_password_updated
  after update of encrypted_password on auth.users
  for each row
  when (old.encrypted_password is distinct from new.encrypted_password)
  execute procedure public.sync_user_password_status();

revoke all on function public.sync_user_password_status() from public, anon, authenticated;
