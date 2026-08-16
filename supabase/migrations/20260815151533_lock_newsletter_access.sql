create policy "Newsletter is server-only"
  on public.newsletter_subscribers
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);
