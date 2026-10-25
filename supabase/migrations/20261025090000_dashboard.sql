-- Nozze in Ordine: dashboard per coppie, wedding planner e amministratori.
-- Ruoli utente: admin, coppia, planner. Ogni matrimonio ha i suoi membri (sposi, planner).
-- Tutto passa dalle regole RLS: il sito usa solo la chiave publishable.

-- ---------------------------------------------------------------- tipi
create type public.user_role as enum ('admin', 'coppia', 'planner');
create type public.member_role as enum ('sposi', 'planner');
create type public.vendor_status as enum ('da_scegliere', 'in_trattativa', 'confermato', 'scartato');
create type public.rsvp_status as enum ('in_attesa', 'si', 'no');

-- ---------------------------------------------------------------- profili
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'coppia',
  full_name text not null default '' check (char_length(full_name) <= 120),
  email text not null default '',
  created_at timestamptz not null default now()
);

-- Il ruolo scelto alla registrazione può essere solo coppia o planner: admin si assegna a mano.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'role' = 'planner' then 'planner'::public.user_role else 'coppia'::public.user_role end,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    coalesce(new.email, '')
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- matrimoni e membri
create table public.weddings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  wedding_date date,
  city text not null default '' check (char_length(city) <= 80),
  ceremony text not null default 'da_decidere' check (ceremony in ('civile', 'religioso', 'simbolico', 'da_decidere')),
  budget_total numeric(12, 2) not null default 0 check (budget_total >= 0),
  guests_expected integer not null default 0 check (guests_expected between 0 and 5000),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.wedding_members (
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  member_role public.member_role not null,
  created_at timestamptz not null default now(),
  primary key (wedding_id, user_id)
);
create index wedding_members_user_idx on public.wedding_members (user_id);

create table public.wedding_invites (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  member_role public.member_role not null,
  token uuid not null unique default gen_random_uuid(),
  invited_by uuid default auth.uid() references auth.users (id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now()
);
create index wedding_invites_wedding_idx on public.wedding_invites (wedding_id);
create index wedding_invites_email_idx on public.wedding_invites (lower(email));

-- ---------------------------------------------------------------- funzioni di controllo (usate dalle regole)
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

create function public.is_member(w uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.wedding_members where wedding_id = w and user_id = (select auth.uid()));
$$;

create function public.is_planner_of(w uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.wedding_members where wedding_id = w and user_id = (select auth.uid()) and member_role = 'planner');
$$;

create function public.shares_wedding_with(other uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.wedding_members a join public.wedding_members b on a.wedding_id = b.wedding_id
    where a.user_id = (select auth.uid()) and b.user_id = other
  );
$$;

-- Chi crea un matrimonio ne diventa membro: planner se il suo profilo è planner, altrimenti sposi.
create function public.handle_new_wedding() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r public.user_role;
begin
  if new.created_by is null then return new; end if;
  select role into r from public.profiles where id = new.created_by;
  insert into public.wedding_members (wedding_id, user_id, member_role)
  values (new.id, new.created_by, case when r = 'planner' then 'planner'::public.member_role else 'sposi'::public.member_role end)
  on conflict do nothing;
  perform public.seed_tasks(new.id);
  return new;
end $$;

-- ---------------------------------------------------------------- moduli del matrimonio
create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  category text not null check (char_length(category) between 1 and 80),
  description text not null default '' check (char_length(description) <= 200),
  planned numeric(12, 2) not null default 0 check (planned >= 0),
  contracted numeric(12, 2) not null default 0 check (contracted >= 0),
  paid numeric(12, 2) not null default 0 check (paid >= 0),
  due_date date,
  created_at timestamptz not null default now()
);
create index budget_items_wedding_idx on public.budget_items (wedding_id);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  category text not null check (char_length(category) between 1 and 80),
  name text not null check (char_length(name) between 1 and 120),
  contact text not null default '' check (char_length(contact) <= 200),
  status public.vendor_status not null default 'da_scegliere',
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  unique (id, wedding_id)
);
create index vendors_wedding_idx on public.vendors (wedding_id);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null,
  vendor_id uuid not null,
  label text not null check (char_length(label) between 1 and 120),
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  per_person boolean not null default false,
  includes text not null default '' check (char_length(includes) <= 500),
  expires_on date,
  chosen boolean not null default false,
  created_at timestamptz not null default now(),
  -- il preventivo deve appartenere a un fornitore dello stesso matrimonio
  foreign key (vendor_id, wedding_id) references public.vendors (id, wedding_id) on delete cascade
);
create index quotes_wedding_idx on public.quotes (wedding_id);
create index quotes_vendor_idx on public.quotes (vendor_id, wedding_id);

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  household text not null default '' check (char_length(household) <= 120),
  name text not null check (char_length(name) between 1 and 120),
  side text not null default 'entrambi' check (side in ('sposa', 'sposo', 'entrambi')),
  rsvp public.rsvp_status not null default 'in_attesa',
  menu text not null default 'standard' check (menu in ('standard', 'vegetariano', 'vegano', 'bambini', 'altro')),
  notes text not null default '' check (char_length(notes) <= 500),
  created_at timestamptz not null default now()
);
create index guests_wedding_idx on public.guests (wedding_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  phase smallint not null default 0 check (phase between 0 and 5),
  due_date date,
  done boolean not null default false,
  assignee text not null default 'sposi' check (assignee in ('sposi', 'planner')),
  -- solo per le attività generate dal modello: servono a ricalcolare la scadenza se cambia la data
  offset_months integer,
  offset_days integer,
  created_at timestamptz not null default now()
);
create index tasks_wedding_idx on public.tasks (wedding_id, due_date);

create table public.timeline_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  start_time time not null,
  title text not null check (char_length(title) between 1 and 120),
  place text not null default '' check (char_length(place) <= 120),
  owner text not null default '' check (char_length(owner) <= 120),
  created_at timestamptz not null default now()
);
create index timeline_items_wedding_idx on public.timeline_items (wedding_id, start_time);

-- Note interne: le vedono solo le planner del matrimonio.
create table public.internal_notes (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index internal_notes_wedding_idx on public.internal_notes (wedding_id);

-- ---------------------------------------------------------------- checklist che segue la data
create function public.seed_tasks(w uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare d date;
begin
  select wedding_date into d from public.weddings where id = w;
  insert into public.tasks (wedding_id, title, phase, offset_months, offset_days, due_date)
  select w, t.title, t.phase, t.m, t.dd,
         case when d is null then null else (d - make_interval(months => t.m, days => t.dd))::date end
  from (values
    ('Fissare la data e il tipo di rito', 0, 14, 0),
    ('Definire il budget complessivo', 0, 13, 0),
    ('Scegliere e prenotare la location', 0, 12, 0),
    ('Stilare la prima lista degli invitati', 0, 12, 0),
    ('Fotografo e video: confrontare e prenotare', 1, 10, 0),
    ('Catering: chiedere e confrontare i preventivi', 1, 10, 0),
    ('Musica e intrattenimento', 1, 9, 0),
    ('Prenotare il rito in comune o in parrocchia', 1, 9, 0),
    ('Inviare i save the date', 2, 8, 0),
    ('Scegliere gli abiti', 2, 7, 0),
    ('Fiori e allestimenti', 2, 6, 0),
    ('Ordinare partecipazioni e bomboniere', 2, 6, 0),
    ('Inviare le partecipazioni', 3, 5, 0),
    ('Definire il menù con il catering', 3, 4, 0),
    ('Documenti per le pubblicazioni', 3, 3, 0),
    ('Raccogliere le risposte degli invitati', 4, 2, 0),
    ('Saldi dei fornitori principali', 4, 1, 0),
    ('Confermare orari con tutti i fornitori', 4, 0, 14),
    ('Ultima conferma dei numeri al catering', 5, 0, 7),
    ('Condividere la scaletta con fornitori e testimoni', 5, 0, 5)
  ) as t(title, phase, m, dd);
end $$;
revoke execute on function public.seed_tasks(uuid) from public, anon, authenticated;

create trigger on_wedding_created after insert on public.weddings
  for each row execute function public.handle_new_wedding();

create function public.handle_wedding_date_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.wedding_date is distinct from old.wedding_date then
    update public.tasks
       set due_date = case when new.wedding_date is null then null
                           else (new.wedding_date - make_interval(months => offset_months, days => offset_days))::date end
     where wedding_id = new.id and not done and offset_months is not null;
  end if;
  return new;
end $$;

create trigger on_wedding_date_changed after update of wedding_date on public.weddings
  for each row execute function public.handle_wedding_date_change();

-- ---------------------------------------------------------------- inviti
-- Accetta un invito: solo se l'email dell'invito è quella dell'utente collegato.
create function public.accept_invite(invite_token uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare inv public.wedding_invites; my_email text;
begin
  if (select auth.uid()) is null then raise exception 'Accesso richiesto'; end if;
  select email into my_email from auth.users where id = (select auth.uid());
  select * into inv from public.wedding_invites where token = invite_token;
  if inv.id is null or inv.accepted_at is not null or inv.expires_at < now() then
    raise exception 'Invito non valido o scaduto';
  end if;
  if lower(inv.email) <> lower(my_email) then
    raise exception 'Questo invito è per un altro indirizzo email';
  end if;
  insert into public.wedding_members (wedding_id, user_id, member_role)
  values (inv.wedding_id, (select auth.uid()), inv.member_role)
  on conflict (wedding_id, user_id) do nothing;
  update public.wedding_invites set accepted_at = now() where id = inv.id;
  return inv.wedding_id;
end $$;

-- Gli inviti in sospeso per la mia email, con il nome del matrimonio.
create function public.my_pending_invites()
returns table (token uuid, wedding_title text, member_role public.member_role, expires_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select i.token, w.title, i.member_role, i.expires_at
  from public.wedding_invites i
  join public.weddings w on w.id = i.wedding_id
  join auth.users u on u.id = (select auth.uid())
  where lower(i.email) = lower(u.email) and i.accepted_at is null and i.expires_at > now();
$$;

-- ---------------------------------------------------------------- amministrazione
create function public.admin_set_role(target uuid, new_role public.user_role) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Solo un amministratore può cambiare i ruoli'; end if;
  if target = (select auth.uid()) and new_role <> 'admin' then
    raise exception 'Non puoi togliere a te stesso il ruolo di amministratore';
  end if;
  update public.profiles set role = new_role where id = target;
end $$;

-- ---------------------------------------------------------------- regole di accesso (RLS)
alter table public.profiles enable row level security;
alter table public.weddings enable row level security;
alter table public.wedding_members enable row level security;
alter table public.wedding_invites enable row level security;
alter table public.budget_items enable row level security;
alter table public.vendors enable row level security;
alter table public.quotes enable row level security;
alter table public.guests enable row level security;
alter table public.tasks enable row level security;
alter table public.timeline_items enable row level security;
alter table public.internal_notes enable row level security;

-- profili: vedo il mio, quelli di chi condivide un matrimonio con me; l'admin vede tutti.
create policy "profili leggibili" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_wedding_with(id) or public.is_admin());
create policy "profilo modificabile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- Il ruolo non si cambia da qui: si può aggiornare solo il nome.
revoke update on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;

-- matrimoni
create policy "matrimoni dei membri" on public.weddings for select to authenticated
  using (public.is_member(id) or public.is_admin());
create policy "crea matrimonio" on public.weddings for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy "modifica matrimonio" on public.weddings for update to authenticated
  using (public.is_member(id) or public.is_admin()) with check (public.is_member(id) or public.is_admin());
create policy "elimina matrimonio" on public.weddings for delete to authenticated
  using (created_by = (select auth.uid()) or public.is_admin());

-- membri: li vedono gli altri membri; si entra solo con un invito; si può uscire o essere tolti dalla planner.
create policy "membri visibili" on public.wedding_members for select to authenticated
  using (public.is_member(wedding_id) or public.is_admin());
create policy "esci o togli" on public.wedding_members for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_planner_of(wedding_id) or public.is_admin());

-- inviti
create policy "inviti visibili ai membri" on public.wedding_invites for select to authenticated
  using (public.is_member(wedding_id) or public.is_admin());
create policy "invita" on public.wedding_invites for insert to authenticated
  with check (public.is_member(wedding_id) and invited_by = (select auth.uid()));
create policy "annulla invito" on public.wedding_invites for delete to authenticated
  using (public.is_member(wedding_id) or public.is_admin());

-- moduli: tutti i membri del matrimonio leggono e scrivono; l'admin vede e corregge.
create policy "budget dei membri" on public.budget_items for all to authenticated
  using (public.is_member(wedding_id) or public.is_admin()) with check (public.is_member(wedding_id) or public.is_admin());
create policy "fornitori dei membri" on public.vendors for all to authenticated
  using (public.is_member(wedding_id) or public.is_admin()) with check (public.is_member(wedding_id) or public.is_admin());
create policy "preventivi dei membri" on public.quotes for all to authenticated
  using (public.is_member(wedding_id) or public.is_admin()) with check (public.is_member(wedding_id) or public.is_admin());
create policy "invitati dei membri" on public.guests for all to authenticated
  using (public.is_member(wedding_id) or public.is_admin()) with check (public.is_member(wedding_id) or public.is_admin());
create policy "scadenze dei membri" on public.tasks for all to authenticated
  using (public.is_member(wedding_id) or public.is_admin()) with check (public.is_member(wedding_id) or public.is_admin());
create policy "scaletta dei membri" on public.timeline_items for all to authenticated
  using (public.is_member(wedding_id) or public.is_admin()) with check (public.is_member(wedding_id) or public.is_admin());
create policy "note interne delle planner" on public.internal_notes for all to authenticated
  using (public.is_planner_of(wedding_id) or public.is_admin()) with check (public.is_planner_of(wedding_id) or public.is_admin());

-- lista d'attesa: resta scrivibile dal sito; solo l'admin la legge.
create policy "lista leggibile dall'admin" on public.waitlist for select to authenticated
  using (public.is_admin());

-- Nessun accesso anonimo alle nuove tabelle.
revoke all on public.profiles, public.weddings, public.wedding_members, public.wedding_invites,
  public.budget_items, public.vendors, public.quotes, public.guests, public.tasks,
  public.timeline_items, public.internal_notes from anon;

-- Le funzioni di sistema non si chiamano dall'esterno.
revoke execute on function public.handle_new_user(), public.handle_new_wedding(), public.handle_wedding_date_change() from public, anon, authenticated;
revoke execute on function public.accept_invite(uuid), public.my_pending_invites(), public.admin_set_role(uuid, public.user_role) from public, anon;
grant execute on function public.accept_invite(uuid), public.my_pending_invites(), public.admin_set_role(uuid, public.user_role) to authenticated;
