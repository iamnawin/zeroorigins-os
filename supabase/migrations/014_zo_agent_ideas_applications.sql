-- Migration 014: ZO_Agent, Ideas Vault, Application Registry, Source Registry
--
-- Corrects the information architecture:
--   Business Verticals = business lines/brands under ZeroOrigins
--   Ideas Vault (business_ideas) = raw concepts, rooted at D:\AI-Workspace\Ideas
--   Application Registry (applications) = built products/repos, rooted at D:\AI-Workspace\Repos
--   Source Registry (source_registry) = where files/repos/docs/deployments live
-- and widens ai_assist_requests for the full ZO_Agent intent set.

-- 1. Business verticals: broaden allowed types, correct seed identities
alter table business_verticals drop constraint if exists business_verticals_type_check;
alter table business_verticals add constraint business_verticals_type_check
  check (type in ('brand', 'product', 'education', 'media', 'internal', 'client_service', 'experiment', 'lab', 'video', 'creative_tech', 'product_studio', 'service', 'other'));

  update business_verticals set name = 'AIWithNoBrain Labs', slug = 'aiwithnobrain-labs' where slug = 'aiwithnobrain-audio-labs';
  update business_verticals set name = 'ZeroOrigins Internal / Studio', slug = 'zeroorigins-internal' where slug = 'zeroorigins-os';

  insert into business_verticals (name, slug, type, status, description)
  values
    ('AIWithNoBrain', 'aiwithnobrain', 'media', 'active', 'AI content and media brand under ZeroOrigins.'),
      ('AIWithNoBrain Labs', 'aiwithnobrain-labs', 'lab', 'active', 'Experimental AI lab and product exploration vertical under ZeroOrigins.'),
        ('IgnAIte', 'ignaite', 'education', 'active', 'AI education, workshops, bootcamps, and learning products vertical.'),
          ('EpicsToYou', 'epicstoyou', 'creative_tech', 'active', 'Video storytelling and creative-tech vertical focused on cinematic video creation, story-driven content, brand films, short-form videos, and AI-assisted visual storytelling.'),
            ('ZeroOrigins Internal / Studio', 'zeroorigins-internal', 'internal', 'active', 'Internal systems, operating infrastructure, automation, and product studio work for ZeroOrigins.')
            on conflict (slug) do update set
              name = excluded.name,
                type = excluded.type,
                  status = excluded.status,
                    description = excluded.description;

                    -- 2. Ideas Vault
                    create table if not exists business_ideas (
                      id uuid primary key default uuid_generate_v4(),
                        title text not null,
                          slug text unique,
                            description text,
                              vertical_id uuid references business_verticals(id) on delete set null,
                                status text not null default 'raw' check (status in ('raw', 'reviewing', 'validated', 'testing', 'tested', 'rejected', 'archived', 'promoted_to_application')),
                                  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
                                    source text,
                                      local_folder_path text,
                                        owner_id uuid references profiles(id),
                                          ai_summary text,
                                            next_action text,
                                              promoted_application_id uuid,
                                                created_at timestamptz default now(),
                                                  updated_at timestamptz default now()
                                                  );

                                                  -- Carry legacy ideas into the vault (ids preserved so old links keep working).
                                                  -- The legacy ideas table is left untouched (no hard delete policy).
                                                  insert into business_ideas (id, title, description, status, priority, source, owner_id, created_at, updated_at)
                                                  select
                                                    id,
                                                      title,
                                                        description,
                                                          case status::text
                                                              when 'draft' then 'raw'
                                                                  when 'submitted' then 'raw'
                                                                      when 'under_review' then 'reviewing'
                                                                          when 'approved' then 'validated'
                                                                              when 'rejected' then 'rejected'
                                                                                  when 'on_hold' then 'reviewing'
                                                                                      when 'converted_to_project' then 'promoted_to_application'
                                                                                          when 'archived' then 'archived'
                                                                                              else 'raw'
                                                                                                end,
                                                                                                  case priority
                                                                                                      when 'low' then 'low'
                                                                                                          when 'medium' then 'normal'
                                                                                                              when 'high' then 'high'
                                                                                                                  when 'critical' then 'urgent'
                                                                                                                      else 'normal'
                                                                                                                        end,
                                                                                                                          'legacy_ideas_table',
                                                                                                                            owner_id,
                                                                                                                              created_at,
                                                                                                                                updated_at
                                                                                                                                from ideas
                                                                                                                                on conflict (id) do nothing;

                                                                                                                                -- 3. Application Registry
                                                                                                                                create table if not exists applications (
                                                                                                                                  id uuid primary key default uuid_generate_v4(),
                                                                                                                                    name text not null,
                                                                                                                                      slug text unique,
                                                                                                                                        description text,
                                                                                                                                          vertical_id uuid references business_verticals(id) on delete set null,
                                                                                                                                            stage text not null default 'concept' check (stage in ('concept', 'prototype', 'testing', 'production_ready', 'live', 'paused', 'archived')),
                                                                                                                                              status text not null default 'active' check (status in ('active', 'paused', 'archived')),
                                                                                                                                                type text not null default 'application' check (type in ('application', 'product', 'internal_system', 'automation', 'website', 'tool', 'service_product', 'other')),
                                                                                                                                                  repo_url text,
                                                                                                                                                    local_folder_path text,
                                                                                                                                                      docs_url text,
                                                                                                                                                        docs_folder_path text,
                                                                                                                                                          website_url text,
                                                                                                                                                            deployment_url text,
                                                                                                                                                              database_url text,
                                                                                                                                                                n8n_workflow_url text,
                                                                                                                                                                  figma_url text,
                                                                                                                                                                    owner_id uuid references profiles(id),
                                                                                                                                                                      tech_stack text[] not null default '{}',
                                                                                                                                                                        build_status text,
                                                                                                                                                                          last_synced_at timestamptz,
                                                                                                                                                                            source_idea_id uuid references business_ideas(id) on delete set null,
                                                                                                                                                                              notes text,
                                                                                                                                                                                created_at timestamptz default now(),
                                                                                                                                                                                  updated_at timestamptz default now()
                                                                                                                                                                                  );

                                                                                                                                                                                  alter table business_ideas drop constraint if exists business_ideas_promoted_application_id_fkey;
                                                                                                                                                                                  alter table business_ideas add constraint business_ideas_promoted_application_id_fkey
                                                                                                                                                                                    foreign key (promoted_application_id) references applications(id) on delete set null;

                                                                                                                                                                                    insert into applications (name, slug, description, vertical_id, stage, status, type, local_folder_path)
                                                                                                                                                                                    values
                                                                                                                                                                                      ('PlotDNA', 'plotdna', 'Product-ready application under ZeroOrigins. Add repo/local folder/docs/site details when available.', null, 'production_ready', 'active', 'product', null),
                                                                                                                                                                                        ('OrgTrace', 'orgtrace', 'Product-ready developer/Salesforce metadata intelligence application. Add repo/local folder/docs/site details when available.', null, 'production_ready', 'active', 'product', null),
                                                                                                                                                                                          ('ZeroOrigins OS', 'zeroorigins-os', 'Internal operating system for ZeroOrigins.', (select id from business_verticals where slug = 'zeroorigins-internal'), 'live', 'active', 'internal_system', 'D:\AI-Workspace\Repos\zeroorigins-os')
                                                                                                                                                                                          on conflict (slug) do update set
                                                                                                                                                                                            description = excluded.description,
                                                                                                                                                                                              stage = excluded.stage,
                                                                                                                                                                                                status = excluded.status,
                                                                                                                                                                                                  type = excluded.type;

                                                                                                                                                                                                  -- 4. Source Registry
                                                                                                                                                                                                  create table if not exists source_registry (
                                                                                                                                                                                                    id uuid primary key default uuid_generate_v4(),
                                                                                                                                                                                                      name text not null unique,
                                                                                                                                                                                                        source_type text not null default 'other' check (source_type in ('ideas_root', 'repos_root', 'repo', 'local_folder', 'docs', 'deployment', 'website', 'figma', 'n8n', 'supabase', 'google_drive', 'other')),
                                                                                                                                                                                                          local_path text,
                                                                                                                                                                                                            source_url text,
                                                                                                                                                                                                              related_vertical_id uuid references business_verticals(id) on delete set null,
                                                                                                                                                                                                                related_idea_id uuid references business_ideas(id) on delete set null,
                                                                                                                                                                                                                  related_application_id uuid references applications(id) on delete set null,
                                                                                                                                                                                                                    status text not null default 'active' check (status in ('active', 'paused', 'archived')),
                                                                                                                                                                                                                      last_checked_at timestamptz,
                                                                                                                                                                                                                        last_synced_at timestamptz,
                                                                                                                                                                                                                          notes text,
                                                                                                                                                                                                                            created_at timestamptz default now(),
                                                                                                                                                                                                                              updated_at timestamptz default now()
                                                                                                                                                                                                                              );

                                                                                                                                                                                                                              insert into source_registry (name, source_type, local_path, status)
                                                                                                                                                                                                                              values
                                                                                                                                                                                                                                ('AI Workspace Ideas', 'ideas_root', 'D:\AI-Workspace\Ideas', 'active'),
                                                                                                                                                                                                                                  ('AI Workspace Repos', 'repos_root', 'D:\AI-Workspace\Repos', 'active')
                                                                                                                                                                                                                                  on conflict (name) do update set
                                                                                                                                                                                                                                    source_type = excluded.source_type,
                                                                                                                                                                                                                                      local_path = excluded.local_path,
                                                                                                                                                                                                                                        status = excluded.status;

                                                                                                                                                                                                                                        -- 5. AI assist requests: full ZO_Agent intent set + idea/application links.
                                                                                                                                                                                                                                        -- Legacy intent values stay valid so existing rows keep passing the check.
                                                                                                                                                                                                                                        alter table ai_assist_requests drop constraint if exists ai_assist_requests_intent_check;
                                                                                                                                                                                                                                        alter table ai_assist_requests add constraint ai_assist_requests_intent_check check (intent in (
                                                                                                                                                                                                                                          'draft_email', 'classify_lead', 'summarize_day',
                                                                                                                                                                                                                                            'create_task', 'schedule_meeting', 'draft_reply', 'summarize_email', 'create_followup',
                                                                                                                                                                                                                                              'create_project', 'create_proposal', 'create_idea', 'promote_idea_to_application', 'create_application',
                                                                                                                                                                                                                                                'query_emails', 'query_tasks', 'query_projects', 'query_ideas', 'query_applications', 'query_verticals',
                                                                                                                                                                                                                                                  'find_missing_sources', 'update_application_source', 'sync_repo_details', 'summarize_today', 'unknown'
                                                                                                                                                                                                                                                  ));

                                                                                                                                                                                                                                                  alter table ai_assist_requests add column if not exists related_idea_id uuid references business_ideas(id) on delete set null;
                                                                                                                                                                                                                                                  alter table ai_assist_requests add column if not exists related_application_id uuid references applications(id) on delete set null;

                                                                                                                                                                                                                                                  -- 6. Indexes
                                                                                                                                                                                                                                                  create index if not exists idx_business_ideas_status on business_ideas(status);
                                                                                                                                                                                                                                                  create index if not exists idx_business_ideas_vertical_id on business_ideas(vertical_id);
                                                                                                                                                                                                                                                  create index if not exists idx_business_ideas_priority on business_ideas(priority);
                                                                                                                                                                                                                                                  create index if not exists idx_applications_stage on applications(stage);
                                                                                                                                                                                                                                                  create index if not exists idx_applications_status on applications(status);
                                                                                                                                                                                                                                                  create index if not exists idx_applications_vertical_id on applications(vertical_id);
                                                                                                                                                                                                                                                  create index if not exists idx_applications_source_idea_id on applications(source_idea_id);
                                                                                                                                                                                                                                                  create index if not exists idx_source_registry_source_type on source_registry(source_type);
                                                                                                                                                                                                                                                  create index if not exists idx_source_registry_related_application_id on source_registry(related_application_id);
                                                                                                                                                                                                                                                  create index if not exists idx_ai_assist_requests_related_idea_id on ai_assist_requests(related_idea_id);
                                                                                                                                                                                                                                                  create index if not exists idx_ai_assist_requests_related_application_id on ai_assist_requests(related_application_id);

                                                                                                                                                                                                                                                  -- 7. Triggers
                                                                                                                                                                                                                                                  drop trigger if exists set_updated_at on business_ideas;
                                                                                                                                                                                                                                                  create trigger set_updated_at before update on business_ideas for each row execute function update_updated_at();

                                                                                                                                                                                                                                                  drop trigger if exists set_updated_at on applications;
                                                                                                                                                                                                                                                  create trigger set_updated_at before update on applications for each row execute function update_updated_at();

                                                                                                                                                                                                                                                  drop trigger if exists set_updated_at on source_registry;
                                                                                                                                                                                                                                                  create trigger set_updated_at before update on source_registry for each row execute function update_updated_at();

                                                                                                                                                                                                                                                  -- 8. RLS
                                                                                                                                                                                                                                                  alter table business_ideas enable row level security;
                                                                                                                                                                                                                                                  alter table applications enable row level security;
                                                                                                                                                                                                                                                  alter table source_registry enable row level security;

                                                                                                                                                                                                                                                  drop policy if exists "Internal can manage business ideas" on business_ideas;
                                                                                                                                                                                                                                                  create policy "Internal can manage business ideas" on business_ideas
                                                                                                                                                                                                                                                    for all
                                                                                                                                                                                                                                                      using (is_internal_user())
                                                                                                                                                                                                                                                        with check (is_internal_user());

                                                                                                                                                                                                                                                        drop policy if exists "Internal can manage applications" on applications;
                                                                                                                                                                                                                                                        create policy "Internal can manage applications" on applications
                                                                                                                                                                                                                                                          for all
                                                                                                                                                                                                                                                            using (is_internal_user())
                                                                                                                                                                                                                                                              with check (is_internal_user());

                                                                                                                                                                                                                                                              drop policy if exists "Internal can manage source registry" on source_registry;
                                                                                                                                                                                                                                                              create policy "Internal can manage source registry" on source_registry
                                                                                                                                                                                                                                                                for all
                                                                                                                                                                                                                                                                  using (is_internal_user())
                                                                                                                                                                                                                                                                    with check (is_internal_user());
                                                                                                                                                                                                                                                                    