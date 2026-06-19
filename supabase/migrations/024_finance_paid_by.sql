-- Track who paid for a spending record.

alter table finance_transactions
  add column if not exists paid_by text;

create index if not exists idx_finance_transactions_paid_by on finance_transactions(paid_by);
