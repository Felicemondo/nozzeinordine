-- Modifiche alla dashboard: costi a persona nel budget, categorie dei fornitori, invitati con età,
-- menù e allergie, tavoli imperiali e degli sposi, programma diviso per persona, sola lettura per
-- la coppia quando il matrimonio è seguito da una planner.

-- ---------------------------------------------------------------- budget: quota singola
-- Le voci a persona (location, catering) e a nucleo (bomboniere, partecipazioni) si calcolano dagli invitati.
alter table public.budget_items
  add column unit_price numeric(12, 2) not null default 0 check (unit_price >= 0),
  add column unit_child numeric(12, 2) not null default 0 check (unit_child >= 0),
  add column rental_amount numeric(12, 2) check (rental_amount >= 0);

-- ---------------------------------------------------------------- fornitori: categorie aggiunte dalla coppia o dalla planner
alter table public.weddings
  add column vendor_categories text[] not null default '{}'
    check (cardinality(vendor_categories) <= 30 and char_length(array_to_string(vendor_categories, '|')) <= 2000);
grant update (vendor_categories) on public.weddings to authenticated;

-- ---------------------------------------------------------------- invitati: età, menù, allergie
alter table public.guests
  add column age_band text not null default 'adulto' check (age_band in ('adulto', 'bambino', 'under3')),
  add column allergies text[] not null default '{}'
    check (allergies <@ array['glutine', 'crostacei', 'uova', 'pesce', 'arachidi', 'soia', 'lattosio', 'frutta_guscio',
      'sedano', 'senape', 'sesamo', 'solfiti', 'lupini', 'molluschi', 'altro']),
  add column allergies_note text not null default '' check (char_length(allergies_note) <= 200);
update public.guests set age_band = 'bambino' where menu = 'bambini';
alter table public.guests drop constraint guests_menu_check;
update public.guests set menu = 'standard' where menu in ('bambini', 'altro');
alter table public.guests add constraint guests_menu_check check (menu in ('standard', 'vegetariano', 'vegano', 'no_carne', 'no_pesce'));

-- ---------------------------------------------------------------- tavoli: imperiali fino a 120 posti e tavolo degli sposi
alter table public.seating_tables drop constraint seating_tables_seats_check;
alter table public.seating_tables add constraint seating_tables_seats_check check (seats between 1 and 120);
alter table public.seating_tables drop constraint seating_tables_shape_check;
alter table public.seating_tables add constraint seating_tables_shape_check check (shape in ('rotondo', 'rettangolare', 'imperiale'));
alter table public.seating_tables add column kind text not null default 'ospiti' check (kind in ('ospiti', 'sposi'));
alter table public.guests drop constraint guests_seat_number_check;
alter table public.guests add constraint guests_seat_number_check check (seat_number between 1 and 120);

-- ---------------------------------------------------------------- programma: per la prima persona, la seconda o in comune
alter table public.timeline_items add column party text not null default 'comune' check (party in ('a', 'b', 'comune'));

-- ---------------------------------------------------------------- permessi
-- Se il matrimonio è seguito da una planner, solo lei modifica; la coppia legge tutto e modifica invitati e tavoli.
create function private.can_edit(w uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_planner_of(w) or (private.is_member(w) and not exists (
    select 1 from public.wedding_members where wedding_id = w and member_role = 'planner'));
$$;
revoke execute on function private.can_edit(uuid) from public, anon;
grant execute on function private.can_edit(uuid) to authenticated;

drop policy "modifica matrimonio" on public.weddings;
create policy "modifica matrimonio" on public.weddings for update to authenticated
  using (private.can_edit(id) or private.is_admin()) with check (private.can_edit(id) or private.is_admin());

drop policy "invita" on public.wedding_invites;
create policy "invita" on public.wedding_invites for insert to authenticated
  with check (private.can_edit(wedding_id) and invited_by = (select auth.uid()));
drop policy "annulla invito" on public.wedding_invites;
create policy "annulla invito" on public.wedding_invites for delete to authenticated
  using (private.can_edit(wedding_id) or private.is_admin());

drop policy "budget dei membri" on public.budget_items;
create policy "budget letto dai membri" on public.budget_items for select to authenticated using (private.is_member(wedding_id) or private.is_admin());
create policy "budget modificato da chi può" on public.budget_items for all to authenticated
  using (private.can_edit(wedding_id) or private.is_admin()) with check (private.can_edit(wedding_id) or private.is_admin());

drop policy "fornitori dei membri" on public.vendors;
create policy "fornitori letti dai membri" on public.vendors for select to authenticated using (private.is_member(wedding_id) or private.is_admin());
create policy "fornitori modificati da chi può" on public.vendors for all to authenticated
  using (private.can_edit(wedding_id) or private.is_admin()) with check (private.can_edit(wedding_id) or private.is_admin());

drop policy "preventivi dei membri" on public.quotes;
create policy "preventivi letti dai membri" on public.quotes for select to authenticated using (private.is_member(wedding_id) or private.is_admin());
create policy "preventivi modificati da chi può" on public.quotes for all to authenticated
  using (private.can_edit(wedding_id) or private.is_admin()) with check (private.can_edit(wedding_id) or private.is_admin());

drop policy "scadenze dei membri" on public.tasks;
create policy "scadenze lette dai membri" on public.tasks for select to authenticated using (private.is_member(wedding_id) or private.is_admin());
create policy "scadenze modificate da chi può" on public.tasks for all to authenticated
  using (private.can_edit(wedding_id) or private.is_admin()) with check (private.can_edit(wedding_id) or private.is_admin());

drop policy "scaletta dei membri" on public.timeline_items;
create policy "scaletta letta dai membri" on public.timeline_items for select to authenticated using (private.is_member(wedding_id) or private.is_admin());
create policy "scaletta modificata da chi può" on public.timeline_items for all to authenticated
  using (private.can_edit(wedding_id) or private.is_admin()) with check (private.can_edit(wedding_id) or private.is_admin());
