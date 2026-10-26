-- Richieste dalle pagine dedicate (coppie e planner): più campi in "dati" e uno stato
-- che solo l'amministrazione può cambiare (nuova, contattata, in pilota, scartata).

alter table public.waitlist
  add column stato text not null default 'nuova' check (stato in ('nuova', 'contattata', 'pilota', 'scartata'));

-- I moduli in tre passaggi mandano fino a una ventina di campi: il limite sale, resta un oggetto.
alter table public.waitlist drop constraint waitlist_dati_size;
alter table public.waitlist
  add constraint waitlist_dati_size check (pg_column_size(dati) <= 6144 and jsonb_typeof(dati) = 'object');

-- Chi si iscrive non sceglie lo stato.
drop policy "iscrizione pubblica" on public.waitlist;
create policy "iscrizione pubblica" on public.waitlist for insert to anon, authenticated
  with check (consenso = true and stato = 'nuova');

-- L'amministrazione aggiorna solo lo stato.
revoke update, delete, truncate on public.waitlist from anon, authenticated;
grant update (stato) on public.waitlist to authenticated;
create policy "stato aggiornato dall'admin" on public.waitlist for update to authenticated
  using (private.is_admin()) with check (private.is_admin());
