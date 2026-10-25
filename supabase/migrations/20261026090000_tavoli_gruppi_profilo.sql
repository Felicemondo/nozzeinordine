-- Tavoli e sala, gruppi degli invitati, nomi degli sposi, profilo più completo.

-- ---------------------------------------------------------------- nomi degli sposi (per i gruppi: "famiglia di Anna")
alter table public.weddings
  add column partner_a text not null default '' check (char_length(partner_a) <= 60),
  add column partner_b text not null default '' check (char_length(partner_b) <= 60);

-- ---------------------------------------------------------------- gruppi degli invitati
-- famiglia_a / amici_a = lei (o prima persona), famiglia_b / amici_b = lui (o seconda), amici_comuni.
alter table public.guests
  add column guest_group text not null default 'amici_comuni'
    check (guest_group in ('famiglia_a', 'famiglia_b', 'amici_a', 'amici_b', 'amici_comuni'));
update public.guests set guest_group = case side when 'sposa' then 'famiglia_a' when 'sposo' then 'famiglia_b' else 'amici_comuni' end;
alter table public.guests drop column side;

-- ---------------------------------------------------------------- tavoli
create table public.seating_tables (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  seats smallint not null default 10 check (seats between 8 and 12),
  shape text not null default 'rotondo' check (shape in ('rotondo', 'rettangolare')),
  -- posizione nella sala, in percentuale della pianta
  pos_x numeric(5, 2) not null default 50 check (pos_x between 0 and 100),
  pos_y numeric(5, 2) not null default 50 check (pos_y between 0 and 100),
  created_at timestamptz not null default now(),
  unique (id, wedding_id)
);
create index seating_tables_wedding_idx on public.seating_tables (wedding_id);

alter table public.guests
  add column table_id uuid,
  add column seat_number smallint check (seat_number between 1 and 12),
  add constraint guests_seat_pair check ((table_id is null) = (seat_number is null)),
  add constraint guests_table_fk foreign key (table_id, wedding_id) references public.seating_tables (id, wedding_id) on delete set null (table_id),
  add constraint guests_one_per_seat unique (table_id, seat_number);
create index guests_table_idx on public.guests (table_id, wedding_id);

-- Il posto deve esistere nel tavolo.
create function public.check_guest_seat() returns trigger
language plpgsql security definer set search_path = '' as $$
declare n smallint;
begin
  if new.table_id is null then return new; end if;
  select seats into n from public.seating_tables where id = new.table_id;
  if new.seat_number > n then raise exception 'Il tavolo ha solo % posti', n; end if;
  return new;
end $$;
create trigger guests_check_seat before insert or update of table_id, seat_number on public.guests
  for each row execute function public.check_guest_seat();

-- Non si tolgono posti occupati.
create function public.check_table_seats() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.seats < old.seats and exists (select 1 from public.guests where table_id = new.id and seat_number > new.seats) then
    raise exception 'Prima libera i posti oltre il numero %', new.seats;
  end if;
  return new;
end $$;
create trigger seating_tables_check_seats before update of seats on public.seating_tables
  for each row execute function public.check_table_seats();

-- Eliminando un tavolo, chi era seduto torna tra gli invitati da sistemare.
create function public.release_table_guests() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.guests set table_id = null, seat_number = null where table_id = old.id;
  return old;
end $$;
create trigger seating_tables_release before delete on public.seating_tables
  for each row execute function public.release_table_guests();

revoke execute on function public.check_guest_seat(), public.check_table_seats(), public.release_table_guests() from public, anon, authenticated;

alter table public.seating_tables enable row level security;
create policy "tavoli dei membri" on public.seating_tables for all to authenticated
  using (private.is_member(wedding_id) or private.is_admin()) with check (private.is_member(wedding_id) or private.is_admin());
revoke all on public.seating_tables from anon;

-- ---------------------------------------------------------------- profilo
alter table public.profiles
  add column phone text not null default '' check (char_length(phone) <= 40),
  add column business_name text not null default '' check (char_length(business_name) <= 120),
  add column city text not null default '' check (char_length(city) <= 80),
  add column notify_days smallint not null default 3 check (notify_days in (0, 1, 3, 7, 14));
-- Il ruolo resta escluso: si aggiornano solo i dati personali e le preferenze.
grant update (full_name, phone, business_name, city, notify_days) on public.profiles to authenticated;
