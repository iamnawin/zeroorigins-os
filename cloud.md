# ZeroOrigins OS Cloud Notes

## 2026-06-19 Command Center

- Renamed the visible `ZO_Agent Command Bar` surface to `Command Center`.
- Changed create actions to run in one click: the server still drafts structured output internally, then confirms and creates records without a second UI confirmation.
- One instruction can create multiple records when it mentions multiple actionable intents, for example a meeting plus a task reminder.
- Created-record responses show links back to the records that were created.
- Lead, task, deal, proposal, project, idea, meeting, and finance records now have delete affordances.
- Spending records now support a first-class `paid_by` field, with a compatibility fallback that keeps creation working before the migration is applied.
- Meeting creation from Command Center now falls back to the legacy meeting payload if production Supabase is missing calendar-sync columns such as `meetings.notes`.

## Cloud Schema Follow-up

- Production Supabase currently reports `column meetings.notes does not exist`; migrations `013` and `016` include this column, but the remote database has not fully applied it.
- Migration `024_finance_paid_by.sql` adds `finance_transactions.paid_by`.
- Apply pending Supabase migrations through the project’s normal migration path, then redeploy Vercel from the latest `main` commit.
