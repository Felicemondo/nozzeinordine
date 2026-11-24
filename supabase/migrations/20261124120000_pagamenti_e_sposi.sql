-- Proposta A e sposi in lista (24/11/2026): acconti, saldi e date dei pagamenti fanno parte del piano Completo.
-- Gratis e Pass Tableau tengono il budget per voce (costo e già pagato), senza acconto né scadenze.
-- Si blocca solo chi prova a impostare o cambiare questi campi: i valori già presenti restano.

create or replace function public.enforce_budget_payments() returns trigger
language plpgsql security definer set search_path = '' as $$
declare pl text;
begin
  select plan into pl from public.weddings where id = new.wedding_id;
  if pl not in ('gratis', 'tableau') or private.is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    if coalesce(new.deposit, 0) > 0 or new.deposit_due is not null or new.due_date is not null then
      raise exception 'Acconti, saldi e date dei pagamenti fanno parte del piano Completo.';
    end if;
  elsif (coalesce(new.deposit, 0), new.deposit_due, new.due_date) is distinct from (coalesce(old.deposit, 0), old.deposit_due, old.due_date) then
    raise exception 'Acconti, saldi e date dei pagamenti fanno parte del piano Completo.';
  end if;
  return new;
end $$;
revoke execute on function public.enforce_budget_payments() from public, anon, authenticated;

drop trigger if exists budget_items_payments_plan on public.budget_items;
create trigger budget_items_payments_plan before insert or update on public.budget_items
  for each row execute function public.enforce_budget_payments();

-- Nuova voce tra i clic su «Sblocca»
alter table public.unlock_clicks drop constraint if exists unlock_clicks_feature_check;
alter table public.unlock_clicks add constraint unlock_clicks_feature_check
  check (feature in ('invitati', 'tavoli', 'stampa', 'esporta', 'fornitori', 'preventivi', 'programma', 'planner', 'pagamenti', 'altro'));

-- ---------------------------------------------------------------- gli sposi sono già nella lista e al loro tavolo
-- Ogni matrimonio nasce con il tavolo degli sposi e i due sposi seduti (couple_side 'a' e 'b').
-- Non contano nei limiti del piano (50 invitati, 3 tavoli) né nelle partecipazioni da spedire.
alter table public.guests add column if not exists couple_side text check (couple_side in ('a', 'b'));
create unique index if not exists guests_one_couple_side on public.guests (wedding_id, couple_side) where couple_side is not null;
comment on column public.guests.couple_side is 'a o b per i due sposi (creati in automatico), null per gli invitati.';

create or replace function private.ensure_couple(wid uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare w record; t uuid; side text; nm text; seat integer; found_id uuid;
begin
  select id, partner_a, partner_b into w from public.weddings where id = wid;
  if not found then return; end if;
  select id into t from public.seating_tables where wedding_id = wid and kind = 'sposi' order by created_at limit 1;
  if t is null then
    insert into public.seating_tables (wedding_id, name, seats, shape, kind, pos_x, pos_y)
      values (wid, 'Sposi', 2, 'rettangolare', 'sposi', 50, 12) returning id into t;
  end if;
  foreach side in array array['a', 'b'] loop
    if exists (select 1 from public.guests where wedding_id = wid and couple_side = side) then continue; end if;
    nm := nullif(trim(case side when 'a' then w.partner_a else w.partner_b end), '');
    -- sposi già inseriti a mano: si riconoscono dal nome (es. «Stefania» → «Stefania Raucci»), preferendo chi siede al tavolo degli sposi
    found_id := null;
    if nm is not null then
      select id into found_id from public.guests
        where wedding_id = wid and couple_side is null and (lower(name) = lower(nm) or lower(name) like lower(nm) || ' %')
        order by (table_id = t) desc nulls last, created_at limit 1;
    end if;
    if found_id is not null then
      update public.guests set couple_side = side, rsvp = 'si' where id = found_id;
      continue;
    end if;
    seat := case side when 'a' then 1 else 2 end;
    if exists (select 1 from public.guests where table_id = t and seat_number = seat)
       or seat > (select seats from public.seating_tables where id = t) then
      select min(n) into seat from generate_series(1, (select seats from public.seating_tables where id = t)) n
        where not exists (select 1 from public.guests where table_id = t and seat_number = n);
    end if;
    insert into public.guests (wedding_id, name, guest_group, rsvp, couple_side, table_id, seat_number)
      values (wid, coalesce(nm, case side when 'a' then 'Sposo/a 1' else 'Sposo/a 2' end), case side when 'a' then 'famiglia_a' else 'famiglia_b' end,
              'si', side, case when seat is null then null else t end, seat);
  end loop;
end $$;
revoke execute on function private.ensure_couple(uuid) from public, anon, authenticated;

create or replace function public.wedding_couple_on_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin perform private.ensure_couple(new.id); return new; end $$;
-- se cambiano i nomi degli sposi, cambia anche il nome in lista quando era rimasto quello automatico
create or replace function public.wedding_couple_names() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if nullif(trim(new.partner_a), '') is not null then update public.guests set name = trim(new.partner_a)
    where wedding_id = new.id and couple_side = 'a' and name in (trim(old.partner_a), 'Sposo/a 1'); end if;
  if nullif(trim(new.partner_b), '') is not null then update public.guests set name = trim(new.partner_b)
    where wedding_id = new.id and couple_side = 'b' and name in (trim(old.partner_b), 'Sposo/a 2'); end if;
  return new;
end $$;
-- gli sposi non si cancellano dalla lista (si cancellano solo con il matrimonio)
create or replace function public.keep_couple_guests() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.couple_side is not null and not private.is_admin() and exists (select 1 from public.weddings where id = old.wedding_id) then
    raise exception 'Gli sposi restano nella lista: potete cambiare posto, menù e allergie.';
  end if;
  return old;
end $$;
revoke execute on function public.wedding_couple_on_insert(), public.wedding_couple_names(), public.keep_couple_guests() from public, anon, authenticated;

drop trigger if exists weddings_couple_on_insert on public.weddings;
create trigger weddings_couple_on_insert after insert on public.weddings for each row execute function public.wedding_couple_on_insert();
drop trigger if exists weddings_couple_names on public.weddings;
create trigger weddings_couple_names after update of partner_a, partner_b on public.weddings for each row execute function public.wedding_couple_names();
drop trigger if exists guests_keep_couple on public.guests;
create trigger guests_keep_couple before delete on public.guests for each row execute function public.keep_couple_guests();

-- I limiti del piano non contano gli sposi né il loro tavolo
create or replace function public.enforce_plan_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare pl text; n integer; lim integer := tg_argv[0]::integer;
  plans text[] := string_to_array(coalesce(nullif(tg_argv[2], ''), 'gratis'), ',');
begin
  if tg_table_name = 'guests' then
    if new.couple_side is not null then return new; end if;
  elsif tg_table_name = 'seating_tables' then
    if new.kind = 'sposi' then return new; end if;
  end if;
  select plan into pl from public.weddings where id = new.wedding_id;
  if not (pl = any (plans)) or private.is_admin() then return new; end if;
  if lim > 0 then
    if tg_table_name = 'guests' then
      select count(*) into n from public.guests where wedding_id = new.wedding_id and couple_side is null;
    elsif tg_table_name = 'seating_tables' then
      select count(*) into n from public.seating_tables where wedding_id = new.wedding_id and kind <> 'sposi';
    else
      execute format('select count(*) from public.%I where wedding_id = $1', tg_table_name) into n using new.wedding_id;
    end if;
    if n < lim then return new; end if;
  end if;
  raise exception '%', tg_argv[1];
end $$;
revoke execute on function public.enforce_plan_limit() from public, anon, authenticated;

-- Matrimoni già esistenti: aggiunge tavolo e sposi dove mancano
select private.ensure_couple(id) from public.weddings;
