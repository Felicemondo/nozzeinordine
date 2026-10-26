-- Prova delle regole di accesso per ruolo. Crea utenti finti dentro una transazione e alla fine
-- solleva un'eccezione con i risultati: tutto viene annullato. Si lancia dall'editor SQL di Supabase.
do $test$
declare
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid(); d uuid := gen_random_uuid();
  w uuid := gen_random_uuid(); w2 uuid := gen_random_uuid(); v uuid; v2 uuid; tok uuid; n int; i int; log text := ''; t text;
begin
  insert into auth.users (id, email, raw_user_meta_data, aud, role, email_confirmed_at) values
    (a, 'test-a@nozzeinordine.test', '{"role":"coppia","full_name":"Anna"}', 'authenticated', 'authenticated', now()),
    (b, 'test-b@nozzeinordine.test', '{"role":"planner","full_name":"Bea"}', 'authenticated', 'authenticated', null),
    (c, 'test-c@nozzeinordine.test', '{"role":"admin","full_name":"Carlo"}', 'authenticated', 'authenticated', now()),
    (d, 'test-d@nozzeinordine.test', '{}', 'authenticated', 'authenticated', now());
  select string_agg(role::text, ',' order by email) into t from public.profiles where id in (a,b,c,d);
  log := 'ruoli a,b,c,d (atteso coppia,planner,coppia,coppia)=' || t || E'\n';
  update public.profiles set role = 'admin' where id = d;

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  insert into public.weddings (id, title, wedding_date, city) values (w, 'Anna e Marco', '2027-06-12', 'Caserta');
  select count(*) into n from public.tasks where wedding_id = w; log := log || 'A scadenze generate (20)=' || n || E'\n';
  insert into public.vendors (wedding_id, category, name) values (w, 'Catering', 'Prova') returning id into v;
  insert into public.wedding_invites (wedding_id, email, member_role, invited_by) values (w, 'TEST-B@nozzeinordine.test', 'planner', a) returning token into tok;
  begin update public.profiles set role = 'admin' where id = a; log := log || 'A cambia ruolo: PERMESSO (male)' || E'\n';
  exception when others then log := log || 'A cambia ruolo: negato' || E'\n'; end;
  begin perform public.admin_set_role(a, 'admin'); log := log || 'A admin_set_role: PERMESSO (male)' || E'\n';
  exception when others then log := log || 'A admin_set_role: negato' || E'\n'; end;
  begin update public.weddings set created_by = c where id = w; log := log || 'A cambia created_by: PERMESSO (male)' || E'\n';
  exception when others then log := log || 'A cambia created_by: negato' || E'\n'; end;
  update public.weddings set city = 'Napoli' where id = w; log := log || 'A cambia citta: ok' || E'\n';
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.weddings; log := log || 'C vede matrimoni altrui (0)=' || n || E'\n';
  select count(*) into n from public.waitlist; log := log || 'C vede lista attesa (0)=' || n || E'\n';
  update public.waitlist set stato = 'pilota'; get diagnostics n = row_count; log := log || 'C cambia stato lista (0)=' || n || E'\n';
  begin insert into public.budget_items (wedding_id, category) values (w, 'Intrusione'); log := log || 'C scrive budget di A: PERMESSO (male)' || E'\n';
  exception when others then log := log || 'C scrive budget di A: negato' || E'\n'; end;
  begin perform public.accept_invite(tok); log := log || 'C usa invito di B: PERMESSO (male)' || E'\n';
  exception when others then log := log || 'C usa invito di B: negato' || E'\n'; end;
  insert into public.weddings (id, title) values (w2, 'Carlo e Chiara');
  begin insert into public.quotes (wedding_id, vendor_id, label) values (w2, v, 'Furbo'); log := log || 'preventivo su fornitore altrui: PERMESSO (male)' || E'\n';
  exception when others then log := log || 'preventivo su fornitore altrui: negato' || E'\n'; end;
  execute 'reset role';

  -- B non ha ancora confermato l'email: non vede l'invito e non può usarlo
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.my_pending_invites(); log := log || 'B non confermata vede inviti (0)=' || n || E'\n';
  begin perform public.accept_invite(tok); log := log || 'B non confermata accetta invito: PERMESSO (male)' || E'\n';
  exception when others then log := log || 'B non confermata accetta invito: negato' || E'\n'; end;
  execute 'reset role';
  update auth.users set email_confirmed_at = now() where id = b;

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.my_pending_invites(); log := log || 'B confermata vede inviti (1)=' || n || E'\n';
  perform public.accept_invite(tok);
  select count(*) into n from public.weddings where id = w; log := log || 'B vede matrimonio dopo invito (1)=' || n || E'\n';
  insert into public.internal_notes (wedding_id, body) values (w, 'Nota riservata');
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.internal_notes; log := log || 'A vede note interne (0)=' || n || E'\n';
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.weddings where id in (w, w2); log := log || 'D admin vede matrimoni (2)=' || n || E'\n';
  perform public.admin_set_role(c, 'planner');
  execute 'reset role';
  select role::text into t from public.profiles where id = c; log := log || 'C dopo admin_set_role (planner)=' || t || E'\n';

  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
  begin select count(*) into n from public.weddings; log := log || 'anon legge matrimoni: PERMESSO (male)' || E'\n';
  exception when others then log := log || 'anon legge matrimoni: negato' || E'\n'; end;
  begin insert into public.waitlist (profilo, email, consenso) values ('coppia', '=HYPERLINK("x")@a.it', true); log := log || 'lista: email-formula PERMESSA (male)' || E'\n';
  exception when others then log := log || 'lista: email-formula negata' || E'\n'; end;
  begin insert into public.waitlist (profilo, email, consenso, dati) values ('coppia', 'grande@nozzeinordine.test', true, jsonb_build_object('x', repeat('a', 7000))); log := log || 'lista: dati enormi PERMESSI (male)' || E'\n';
  exception when others then log := log || 'lista: dati enormi negati' || E'\n'; end;
  for i in 1..3 loop insert into public.waitlist (profilo, email, consenso) values ('coppia', 'ripetuta@nozzeinordine.test', true); end loop;
  begin insert into public.waitlist (profilo, email, consenso) values ('coppia', 'RIPETUTA@nozzeinordine.test', true); log := log || 'lista: quarta iscrizione PERMESSA (male)' || E'\n';
  exception when others then log := log || 'lista: quarta iscrizione negata' || E'\n'; end;
  begin insert into public.waitlist (profilo, email, consenso, stato) values ('planner', 'stato@nozzeinordine.test', true, 'pilota'); log := log || 'lista: stato scelto da chi si iscrive PERMESSO (male)' || E'\n';
  exception when others then log := log || 'lista: stato scelto da chi si iscrive negato' || E'\n'; end;
  begin update public.waitlist set stato = 'pilota'; log := log || 'lista: anon cambia stato PERMESSO (male)' || E'\n';
  exception when others then log := log || 'lista: anon cambia stato negato' || E'\n'; end;
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  update public.waitlist set stato = 'contattata' where email ilike 'ripetuta@nozzeinordine.test'; get diagnostics n = row_count;
  log := log || 'D admin cambia stato (3)=' || n || E'\n';
  begin update public.waitlist set email = 'cambiata@nozzeinordine.test' where email ilike 'ripetuta@nozzeinordine.test'; log := log || 'D admin cambia email iscritto: PERMESSO (male)' || E'\n';
  exception when others then log := log || 'D admin cambia email iscritto: negato' || E'\n'; end;
  execute 'reset role';

  raise exception E'RISULTATI (tutto annullato)\n%', log;
end $test$;
