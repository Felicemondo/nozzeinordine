-- Se la riga del profilo manca (cancellata per errore), chi accede la ricrea dai dati della registrazione.
create function public.ensure_profile() returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, role, full_name, email)
  select u.id,
    case when u.raw_user_meta_data ->> 'role' = 'planner' then 'planner'::public.user_role else 'coppia'::public.user_role end,
    left(coalesce(u.raw_user_meta_data ->> 'full_name', ''), 120), coalesce(u.email, '')
  from auth.users u where u.id = (select auth.uid())
  on conflict (id) do nothing;
end $$;
revoke execute on function public.ensure_profile() from public, anon;
grant execute on function public.ensure_profile() to authenticated;
