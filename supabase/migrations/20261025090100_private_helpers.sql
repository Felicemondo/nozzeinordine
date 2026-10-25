-- Le funzioni usate dalle regole non devono essere chiamabili dall'API: le sposto in uno schema non esposto.
create schema if not exists private;
grant usage on schema private to authenticated;
alter function public.is_admin() set schema private;
alter function public.is_member(uuid) set schema private;
alter function public.is_planner_of(uuid) set schema private;
alter function public.shares_wedding_with(uuid) set schema private;
revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

create or replace function public.admin_set_role(target uuid, new_role public.user_role) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'Solo un amministratore può cambiare i ruoli'; end if;
  if target = (select auth.uid()) and new_role <> 'admin' then
    raise exception 'Non puoi togliere a te stesso il ruolo di amministratore';
  end if;
  update public.profiles set role = new_role where id = target;
end $$;
revoke execute on function public.admin_set_role(uuid, public.user_role) from public, anon;
grant execute on function public.admin_set_role(uuid, public.user_role) to authenticated;
