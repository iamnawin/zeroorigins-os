-- Contact and automation fields for leads and partners
-- Enables public form capture of contact details and n8n/AI pipeline metadata

-- Leads
alter table leads add column if not exists phone text;
alter table leads add column if not exists whatsapp text;
alter table leads add column if not exists website text;
alter table leads add column if not exists source_detail text;
alter table leads add column if not exists preferred_contact_method text;
alter table leads add column if not exists preferred_call_time text;
alter table leads add column if not exists last_contacted_at timestamptz;
alter table leads add column if not exists automation_status text default 'not_started';
alter table leads add column if not exists automation_source text;
alter table leads add column if not exists n8n_workflow_id text;
alter table leads add column if not exists external_reference_id text;
alter table leads add column if not exists ai_summary text;
alter table leads add column if not exists ai_score numeric;
alter table leads add column if not exists qualification_notes text;

-- Partners
alter table partners add column if not exists phone text;
alter table partners add column if not exists whatsapp text;
alter table partners add column if not exists website text;
alter table partners add column if not exists linkedin text;
alter table partners add column if not exists source_detail text;
alter table partners add column if not exists automation_status text default 'not_started';
alter table partners add column if not exists automation_source text;
alter table partners add column if not exists n8n_workflow_id text;
alter table partners add column if not exists external_reference_id text;
alter table partners add column if not exists ai_summary text;
alter table partners add column if not exists ai_score numeric;
alter table partners add column if not exists qualification_notes text;
