-- Una scadenza calcolata nel passato (matrimonio vicino) non nasce già in ritardo: si sposta a una settimana da oggi.
create or replace function public.seed_tasks(w uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare d date;
begin
  select wedding_date into d from public.weddings where id = w;
  insert into public.tasks (wedding_id, title, phase, offset_months, offset_days, due_date)
  select w, t.title, t.phase, t.m, t.dd,
         case when d is null then null
              else greatest((d - make_interval(months => t.m, days => t.dd))::date, least(current_date + 7, d)) end
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
