-- Piani e limiti. I pagamenti non sono attivi: i piani a pagamento li assegna l'amministrazione,
-- gli utenti li chiedono con plan_requests. I limiti stanno qui, nel database, non solo nell'interfaccia.

-- ---------------------------------------------------------------- colonne
alter table public.profiles
  add column plan text not null default 'prova' check (plan in ('prova', 'planner', 'team', 'studio', 'libero')),
  add column trial_ends_at timestamptz not null default now() + interval '30 days',
  add column max_weddings integer check (max_weddings is null or max_weddings >= 0),
  add column max_collaborators integer check (max_collaborators is null or max_collaborators >= 0);
comment on column public.profiles.plan is 'Piano della wedding planner. libero = nessun limite (account precedenti ai piani). Per le coppie il piano sta sul matrimonio.';

alter table public.weddings
  add column plan text not null default 'gratis' check (plan in ('gratis', 'completo', 'planner')),
  add column plan_since timestamptz not null default now();
comment on column public.weddings.plan is 'gratis e completo per le coppie; planner per i matrimoni creati da una wedding planner.';

-- Chi c'era prima dei piani resta senza limiti.
update public.profiles set plan = 'libero';
update public.weddings w set plan = case when exists (
  select 1 from public.wedding_members m where m.wedding_id = w.id and m.member_role = 'planner') then 'planner' else 'completo' end;

-- ---------------------------------------------------------------- limiti del piano della planner
create function private.plan_caps(uid uuid, out plan text, out max_w integer, out max_c integer, out expired boolean)
language sql stable security definer set search_path = '' as $$
  select p.plan,
    case p.plan when 'planner' then 5 when 'team' then 15 when 'prova' then 15 when 'studio' then coalesce(p.max_weddings, 100000) else null end,
    case p.plan when 'planner' then 0 when 'team' then 3 when 'prova' then 3 when 'studio' then coalesce(p.max_collaborators, 100000) else null end,
    p.plan = 'prova' and p.trial_ends_at < now()
  from public.profiles p where p.id = uid;
$$;
revoke execute on function private.plan_caps(uuid) from public, anon;
grant execute on function private.plan_caps(uuid) to authenticated;

-- ---------------------------------------------------------------- il piano di un matrimonio nasce dal ruolo di chi lo crea
create function public.wedding_plan_on_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r public.user_role; c record; n integer;
begin
  new.plan_since := now();
  if private.is_admin() then return new; end if;
  select role into r from public.profiles where id = new.created_by;
  if r = 'planner' then
    new.plan := 'planner';
    select * into c from private.plan_caps(new.created_by);
    if c.expired then
      raise exception 'La prova gratuita è terminata. Per aggiungere nuovi matrimoni chiedi un piano dal tuo profilo.';
    end if;
    if c.max_w is not null then
      select count(*) into n from public.wedding_members m join public.weddings w on w.id = m.wedding_id
        where m.user_id = new.created_by and m.member_role = 'planner' and (w.wedding_date is null or w.wedding_date >= current_date);
      if n >= c.max_w then
        raise exception 'Il tuo piano include fino a % matrimoni attivi. Per aggiungerne altri chiedi il piano superiore dal tuo profilo.', c.max_w;
      end if;
    end if;
  else
    new.plan := 'gratis';
  end if;
  return new;
end $$;
create trigger weddings_plan_on_insert before insert on public.weddings
  for each row execute function public.wedding_plan_on_insert();

-- ---------------------------------------------------------------- piano Gratis: quantità e funzioni
-- Argomenti: numero massimo di righe per matrimonio (0 = funzione non inclusa) e messaggio.
create function public.enforce_plan_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare pl text; n integer; lim integer := tg_argv[0]::integer;
begin
  select plan into pl from public.weddings where id = new.wedding_id;
  if pl is distinct from 'gratis' or private.is_admin() then return new; end if;
  if lim > 0 then
    execute format('select count(*) from public.%I where wedding_id = $1', tg_table_name) into n using new.wedding_id;
    if n < lim then return new; end if;
  end if;
  raise exception '%', tg_argv[1];
end $$;
create trigger guests_plan_limit before insert on public.guests
  for each row execute function public.enforce_plan_limit('50', 'Il piano Gratis include fino a 50 invitati. Con il piano Completo sono illimitati.');
create trigger vendors_plan_limit before insert on public.vendors
  for each row execute function public.enforce_plan_limit('3', 'Il piano Gratis include fino a 3 fornitori. Con il piano Completo sono illimitati.');
create trigger seating_tables_plan_limit before insert on public.seating_tables
  for each row execute function public.enforce_plan_limit('0', 'I tavoli e la sala in pianta fanno parte del piano Completo.');
create trigger timeline_items_plan_limit before insert on public.timeline_items
  for each row execute function public.enforce_plan_limit('0', 'Il programma del giorno fa parte del piano Completo.');

-- Un preventivo per fornitore: il confronto tra più preventivi è del piano Completo.
create function public.enforce_quote_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare pl text;
begin
  select plan into pl from public.weddings where id = new.wedding_id;
  if pl is distinct from 'gratis' or private.is_admin() then return new; end if;
  if exists (select 1 from public.quotes where vendor_id = new.vendor_id) then
    raise exception 'Il piano Gratis include un preventivo per fornitore. Con il piano Completo li confrontate fianco a fianco.';
  end if;
  return new;
end $$;
create trigger quotes_plan_limit before insert on public.quotes
  for each row execute function public.enforce_quote_limit();

-- ---------------------------------------------------------------- piano Completo: i nomi degli sposi si fissano
create function public.lock_wedding_names() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.plan = 'completo' and not private.is_admin()
     and (new.title, new.partner_a, new.partner_b) is distinct from (old.title, old.partner_a, old.partner_b) then
    raise exception 'Con il piano Completo i nomi degli sposi non si possono più cambiare. Per correggere un errore scrivi a info@nozzeinordine.com.';
  end if;
  return new;
end $$;
create trigger weddings_lock_names before update of title, partner_a, partner_b on public.weddings
  for each row execute function public.lock_wedding_names();

-- ---------------------------------------------------------------- inviti: planner dal piano Completo, collaboratori dal piano Team
create function public.enforce_invite_plan() returns trigger
language plpgsql security definer set search_path = '' as $$
declare pl text; r public.user_role; c record; n integer;
begin
  if new.member_role <> 'planner' or private.is_admin() then return new; end if;
  select role into r from public.profiles where id = new.invited_by;
  if r = 'planner' then
    select * into c from private.plan_caps(new.invited_by);
    if c.max_c is null then return new; end if;
    if c.max_c = 0 then raise exception 'I collaboratori fanno parte del piano Team.'; end if;
    select count(distinct lower(email)) into n from public.wedding_invites
      where invited_by = new.invited_by and member_role = 'planner' and lower(email) <> lower(new.email);
    if n >= c.max_c then raise exception 'Il tuo piano include fino a % collaboratori.', c.max_c; end if;
  else
    select plan into pl from public.weddings where id = new.wedding_id;
    if pl = 'gratis' then raise exception 'Invitare la wedding planner fa parte del piano Completo.'; end if;
  end if;
  return new;
end $$;
create trigger wedding_invites_plan before insert on public.wedding_invites
  for each row execute function public.enforce_invite_plan();

revoke execute on function public.wedding_plan_on_insert(), public.enforce_plan_limit(), public.enforce_quote_limit(),
  public.lock_wedding_names(), public.enforce_invite_plan() from public, anon, authenticated;

-- ---------------------------------------------------------------- richieste di piano
create table public.plan_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  wedding_id uuid references public.weddings (id) on delete cascade,
  plan text not null check (plan in ('completo', 'planner', 'team', 'studio')),
  stato text not null default 'nuova' check (stato in ('nuova', 'attivata', 'chiusa')),
  created_at timestamptz not null default now()
);
create unique index plan_requests_open on public.plan_requests
  (user_id, plan, coalesce(wedding_id, '00000000-0000-0000-0000-000000000000'::uuid)) where stato = 'nuova';
create index plan_requests_wedding_idx on public.plan_requests (wedding_id);

alter table public.plan_requests enable row level security;
revoke all on public.plan_requests from anon, authenticated;
grant select, insert on public.plan_requests to authenticated;
grant update (stato) on public.plan_requests to authenticated;
create policy "richieste proprie o admin" on public.plan_requests for select to authenticated
  using (user_id = (select auth.uid()) or private.is_admin());
create policy "chiedi un piano" on public.plan_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and stato = 'nuova' and (wedding_id is null or private.is_member(wedding_id)));
create policy "stato richiesta dall'admin" on public.plan_requests for update to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- ---------------------------------------------------------------- l'amministrazione assegna i piani
create function public.admin_set_wedding_plan(target uuid, new_plan text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'Solo un amministratore può cambiare i piani'; end if;
  update public.weddings set plan = new_plan, plan_since = now() where id = target;
end $$;

create function public.admin_set_profile_plan(target uuid, new_plan text, trial_days integer default null,
  new_max_weddings integer default null, new_max_collaborators integer default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'Solo un amministratore può cambiare i piani'; end if;
  update public.profiles set plan = new_plan,
    trial_ends_at = case when trial_days is not null then now() + make_interval(days => trial_days) else trial_ends_at end,
    max_weddings = new_max_weddings, max_collaborators = new_max_collaborators
  where id = target;
end $$;

revoke execute on function public.admin_set_wedding_plan(uuid, text), public.admin_set_profile_plan(uuid, text, integer, integer, integer) from public, anon;
grant execute on function public.admin_set_wedding_plan(uuid, text), public.admin_set_profile_plan(uuid, text, integer, integer, integer) to authenticated;
