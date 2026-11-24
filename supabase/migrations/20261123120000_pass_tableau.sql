-- Linea prezzi C (23/11/2026): nuovo piano di coppia "tableau" (Pass Tableau, 19 € una tantum),
-- registro dei pagamenti e conteggio dei clic su "Sblocca". I limiti restano nel database.

-- ---------------------------------------------------------------- piano tableau
alter table public.weddings drop constraint if exists weddings_plan_check;
alter table public.weddings add constraint weddings_plan_check check (plan in ('gratis', 'tableau', 'completo', 'planner'));
comment on column public.weddings.plan is 'gratis, tableau (Pass Tableau) e completo per le coppie; planner per i matrimoni creati da una wedding planner.';

alter table public.plan_requests drop constraint if exists plan_requests_plan_check;
alter table public.plan_requests add constraint plan_requests_plan_check check (plan in ('tableau', 'completo', 'planner', 'team', 'studio'));

-- ---------------------------------------------------------------- limiti per piano
-- Argomenti del trigger: limite (0 = funzione non inclusa), messaggio, piani a cui si applica (separati da virgola).
create or replace function public.enforce_plan_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare pl text; n integer; lim integer := tg_argv[0]::integer;
  plans text[] := string_to_array(coalesce(nullif(tg_argv[2], ''), 'gratis'), ',');
begin
  select plan into pl from public.weddings where id = new.wedding_id;
  if not (pl = any (plans)) or private.is_admin() then return new; end if;
  if lim > 0 then
    execute format('select count(*) from public.%I where wedding_id = $1', tg_table_name) into n using new.wedding_id;
    if n < lim then return new; end if;
  end if;
  raise exception '%', tg_argv[1];
end $$;

drop trigger if exists guests_plan_limit on public.guests;
create trigger guests_plan_limit before insert on public.guests
  for each row execute function public.enforce_plan_limit('50', 'Avete più di 50 invitati: sbloccate il tableau completo con il Pass Tableau a 19 €.', 'gratis');
drop trigger if exists vendors_plan_limit on public.vendors;
create trigger vendors_plan_limit before insert on public.vendors
  for each row execute function public.enforce_plan_limit('3', 'Il vostro piano include fino a 3 fornitori. Con il piano Completo sono illimitati.', 'gratis,tableau');
drop trigger if exists seating_tables_plan_limit on public.seating_tables;
create trigger seating_tables_plan_limit before insert on public.seating_tables
  for each row execute function public.enforce_plan_limit('3', 'Con il piano Gratis provate il tableau fino a 3 tavoli. Con il Pass Tableau (19 €) i tavoli sono illimitati.', 'gratis');
drop trigger if exists timeline_items_plan_limit on public.timeline_items;
create trigger timeline_items_plan_limit before insert on public.timeline_items
  for each row execute function public.enforce_plan_limit('0', 'Il programma del giorno fa parte del piano Completo.', 'gratis,tableau');

-- Preventivi: Gratis e Pass ne tengono uno per fornitore; il confronto fianco a fianco è del Completo.
create or replace function public.enforce_quote_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare pl text;
begin
  select plan into pl from public.weddings where id = new.wedding_id;
  if pl not in ('gratis', 'tableau') or private.is_admin() then return new; end if;
  if exists (select 1 from public.quotes where vendor_id = new.vendor_id) then
    raise exception 'Il vostro piano include un preventivo per fornitore. Con il piano Completo li confrontate fianco a fianco.';
  end if;
  return new;
end $$;

-- I nomi degli sposi si fissano con qualsiasi piano a pagamento della coppia.
create or replace function public.lock_wedding_names() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.plan in ('tableau', 'completo') and not private.is_admin()
     and (new.title, new.partner_a, new.partner_b) is distinct from (old.title, old.partner_a, old.partner_b) then
    raise exception 'Con un piano a pagamento i nomi degli sposi non si possono più cambiare. Per correggere un errore scrivi a info@nozzeinordine.com.';
  end if;
  return new;
end $$;

-- Invitare la planner resta del Completo (anche il Pass non lo include).
create or replace function public.enforce_invite_plan() returns trigger
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
    if pl in ('gratis', 'tableau') then raise exception 'Invitare la wedding planner fa parte del piano Completo.'; end if;
  end if;
  return new;
end $$;

revoke execute on function public.enforce_plan_limit(), public.enforce_quote_limit(), public.lock_wedding_names(), public.enforce_invite_plan()
  from public, anon, authenticated;

-- ---------------------------------------------------------------- registro dei pagamenti (lo scrive solo il webhook con la service role)
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references public.weddings (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  product text not null check (product in ('tableau', 'completo', 'upgrade_completo', 'planner', 'team')),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'eur',
  provider text not null default 'stripe' check (provider in ('stripe')),
  provider_ref text not null unique,
  status text not null default 'paid' check (status in ('pending', 'paid', 'refunded', 'failed')),
  created_at timestamptz not null default now()
);
create index purchases_wedding_idx on public.purchases (wedding_id);
create index purchases_user_idx on public.purchases (user_id);
alter table public.purchases enable row level security;
revoke all on public.purchases from anon, authenticated;
grant select on public.purchases to authenticated;
create policy "acquisti propri o admin" on public.purchases for select to authenticated
  using (user_id = (select auth.uid()) or private.is_admin());

-- ---------------------------------------------------------------- clic su "Sblocca": dice se la linea C funziona
create table public.unlock_clicks (
  id bigint generated always as identity primary key,
  wedding_id uuid references public.weddings (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  feature text not null check (feature in ('invitati', 'tavoli', 'stampa', 'esporta', 'fornitori', 'preventivi', 'programma', 'planner', 'altro')),
  created_at timestamptz not null default now()
);
create index unlock_clicks_wedding_idx on public.unlock_clicks (wedding_id);
create index unlock_clicks_user_idx on public.unlock_clicks (user_id);
alter table public.unlock_clicks enable row level security;
revoke all on public.unlock_clicks from anon, authenticated;
grant select, insert on public.unlock_clicks to authenticated;
create policy "registra un clic" on public.unlock_clicks for insert to authenticated
  with check (user_id = (select auth.uid()) and (wedding_id is null or private.is_member(wedding_id)));
create policy "clic letti dall'admin" on public.unlock_clicks for select to authenticated
  using (private.is_admin());
