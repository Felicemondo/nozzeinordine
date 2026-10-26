-- Avvio guidato (mockup "OC/OP"): priorità e fase del matrimonio, dati dell'attività per le planner,
-- e una regola nuova: senza data non nascono scadenze automatiche. Nascono quando la data viene scelta.

alter table public.weddings
  add column priorities text[] not null default '{}'
    check (priorities <@ array['spese', 'fornitori', 'invitati']::text[]),
  add column stage text check (stage in ('inizio', 'qualcosa', 'dettagli'));
grant update (priorities, stage) on public.weddings to authenticated;

alter table public.profiles
  add column weddings_per_year text check (weddings_per_year in ('1-5', '6-10', '11-20', '20+')),
  add column work_mode text check (work_mode in ('autonomia', 'team'));
grant update (weddings_per_year, work_mode) on public.profiles to authenticated;

-- Data ignota: nessuna attività del modello.
create or replace function public.seed_tasks(w uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare d date;
begin
  select wedding_date into d from public.weddings where id = w;
  if d is null then return; end if;
  if exists (select 1 from public.tasks where wedding_id = w and offset_months is not null) then return; end if;
  insert into public.tasks (wedding_id, title, phase, offset_months, offset_days, due_date)
  select w, t.title, t.phase, t.m, t.dd,
         greatest((d - make_interval(months => t.m, days => t.dd))::date, least(current_date + 7, d))
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

-- Cambio data: si spostano solo le attività automatiche non completate. La prima data scelta crea le scadenze.
create or replace function public.handle_wedding_date_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.wedding_date is distinct from old.wedding_date then
    if old.wedding_date is null and not exists (select 1 from public.tasks where wedding_id = new.id and offset_months is not null) then
      perform public.seed_tasks(new.id);
      return new;
    end if;
    update public.tasks
       set due_date = case when new.wedding_date is null then null
                           else (new.wedding_date - make_interval(months => offset_months, days => offset_days))::date end
     where wedding_id = new.id and not done and offset_months is not null;
  end if;
  return new;
end $$;
