-- Correzioni dalla revisione di sicurezza (OWASP).

-- 1. Chi crea il matrimonio, l'id e la data di creazione non si cambiano: i membri modificano solo i dati del matrimonio.
revoke update on public.weddings from authenticated;
grant update (title, wedding_date, city, ceremony, budget_total, guests_expected, partner_a, partner_b) on public.weddings to authenticated;

-- 2. Gli inviti valgono solo per email confermate.
create or replace function public.accept_invite(invite_token uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare inv public.wedding_invites; my_email text; confirmed timestamptz;
begin
  if (select auth.uid()) is null then raise exception 'Accesso richiesto'; end if;
  select email, email_confirmed_at into my_email, confirmed from auth.users where id = (select auth.uid());
  if confirmed is null then raise exception 'Conferma prima il tuo indirizzo email'; end if;
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

create or replace function public.my_pending_invites()
returns table (token uuid, wedding_title text, member_role public.member_role, expires_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select i.token, w.title, i.member_role, i.expires_at
  from public.wedding_invites i
  join public.weddings w on w.id = i.wedding_id
  join auth.users u on u.id = (select auth.uid())
  where u.email_confirmed_at is not null
    and lower(i.email) = lower(u.email) and i.accepted_at is null and i.expires_at > now();
$$;
revoke execute on function public.accept_invite(uuid), public.my_pending_invites() from public, anon;
grant execute on function public.accept_invite(uuid), public.my_pending_invites() to authenticated;

-- 3. Lista d'attesa: email valida, niente formule, dati piccoli e un limite di iscrizioni.
alter table public.waitlist
  add constraint waitlist_email_format check (email ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$') not valid,
  add constraint waitlist_dati_size check (dati is null or pg_column_size(dati) <= 2048) not valid;

-- Al massimo 3 iscrizioni per la stessa email e 300 in tutto nell'ultima ora.
create function public.waitlist_rate_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.waitlist where lower(email) = lower(new.email)) >= 3 then
    raise exception 'Questa email è già in lista';
  end if;
  if (select count(*) from public.waitlist where created_at > now() - interval '1 hour') >= 300 then
    raise exception 'Troppe iscrizioni in poco tempo, riprova più tardi';
  end if;
  return new;
end $$;
revoke execute on function public.waitlist_rate_limit() from public, anon, authenticated;
create trigger waitlist_rate_limit before insert on public.waitlist
  for each row execute function public.waitlist_rate_limit();
create index if not exists waitlist_email_idx on public.waitlist (lower(email));
create index if not exists waitlist_created_idx on public.waitlist (created_at);
