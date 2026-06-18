-- Allow ZO_Agent to draft and confirm lead creation requests.

alter table ai_assist_requests drop constraint if exists ai_assist_requests_intent_check;

alter table ai_assist_requests add constraint ai_assist_requests_intent_check check (intent in (
  'create_task', 'schedule_meeting', 'create_spending', 'draft_reply', 'summarize_email', 'create_followup', 'create_lead',
  'draft_email', 'classify_lead', 'summarize_day',
  'create_project', 'create_proposal', 'create_idea', 'create_deal', 'promote_idea_to_application', 'create_application',
  'query_emails', 'query_tasks', 'query_projects', 'query_ideas', 'query_applications', 'query_verticals',
  'find_missing_sources', 'update_application_source', 'sync_repo_details', 'summarize_today', 'unknown'
));
