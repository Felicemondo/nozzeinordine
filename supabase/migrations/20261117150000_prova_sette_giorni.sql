-- La prova gratuita delle wedding planner dura 7 giorni (la demo pubblica è stata tolta: si prova registrandosi).
alter table public.profiles alter column trial_ends_at set default now() + interval '7 days';
update public.profiles set trial_ends_at = least(trial_ends_at, created_at + interval '7 days') where plan = 'prova';
