-- Ogni voce del budget può avere un acconto con la sua scadenza; due_date diventa "saldo entro".
alter table public.budget_items
  add column deposit numeric(12, 2) not null default 0 check (deposit >= 0),
  add column deposit_due date;
comment on column public.budget_items.deposit is 'Importo dell''acconto concordato';
comment on column public.budget_items.deposit_due is 'Data entro cui versare l''acconto';
comment on column public.budget_items.due_date is 'Data entro cui saldare il resto';
