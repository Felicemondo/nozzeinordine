-- Proposta A (24/11/2026): acconti, saldi e date dei pagamenti fanno parte del piano Completo.
-- Gratis e Pass Tableau tengono il budget per voce (costo e già pagato), senza acconto né scadenze.
-- Si blocca solo chi prova a impostare o cambiare questi campi: i valori già presenti restano.

create or replace function public.enforce_budget_payments() returns trigger
language plpgsql security definer set search_path = '' as $$
declare pl text;
begin
  select plan into pl from public.weddings where id = new.wedding_id;
  if pl not in ('gratis', 'tableau') or private.is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    if coalesce(new.deposit, 0) > 0 or new.deposit_due is not null or new.due_date is not null then
      raise exception 'Acconti, saldi e date dei pagamenti fanno parte del piano Completo.';
    end if;
  elsif (coalesce(new.deposit, 0), new.deposit_due, new.due_date) is distinct from (coalesce(old.deposit, 0), old.deposit_due, old.due_date) then
    raise exception 'Acconti, saldi e date dei pagamenti fanno parte del piano Completo.';
  end if;
  return new;
end $$;
revoke execute on function public.enforce_budget_payments() from public, anon, authenticated;

drop trigger if exists budget_items_payments_plan on public.budget_items;
create trigger budget_items_payments_plan before insert or update on public.budget_items
  for each row execute function public.enforce_budget_payments();

-- Nuova voce tra i clic su «Sblocca»
alter table public.unlock_clicks drop constraint if exists unlock_clicks_feature_check;
alter table public.unlock_clicks add constraint unlock_clicks_feature_check
  check (feature in ('invitati', 'tavoli', 'stampa', 'esporta', 'fornitori', 'preventivi', 'programma', 'planner', 'pagamenti', 'altro'));
