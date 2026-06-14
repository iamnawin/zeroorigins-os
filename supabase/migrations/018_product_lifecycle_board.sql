-- Migration 018: product lifecycle board
-- Adds safe lifecycle metadata without renaming or dropping existing data.

alter table business_ideas add column if not exists linked_application_id uuid references applications(id) on delete set null;
alter table business_ideas add column if not exists promoted_at timestamptz;
alter table business_ideas add column if not exists promoted_by uuid references profiles(id) on delete set null;

update business_ideas
set linked_application_id = promoted_application_id
where linked_application_id is null and promoted_application_id is not null;

alter table business_ideas drop constraint if exists business_ideas_status_check;
alter table business_ideas add constraint business_ideas_status_check
  check (status in (
    'idea',
    'raw',
    'evaluating',
    'reviewing',
    'approved',
    'validated',
    'experiment',
    'testing',
    'prototype',
    'tested',
    'rejected',
    'archived',
    'promoted_to_application'
  ));

alter table applications add column if not exists next_action text;

alter table applications drop constraint if exists applications_stage_check;
alter table applications add constraint applications_stage_check
  check (stage in (
    'concept',
    'experiment',
    'prototype',
    'mvp',
    'application',
    'testing',
    'production_ready',
    'live',
    'paused',
    'archived',
    'reverted_to_idea'
  ));

alter table applications drop constraint if exists applications_status_check;
alter table applications add constraint applications_status_check
  check (status in ('active', 'paused', 'archived', 'reverted_to_idea'));

create index if not exists idx_business_ideas_linked_application_id on business_ideas(linked_application_id);
create index if not exists idx_business_ideas_promoted_by on business_ideas(promoted_by);
create index if not exists idx_activity_logs_entity on activity_logs(entity_type, entity_id);
