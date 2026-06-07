-- Migration 003: AI Workspace Apps tracking

create table if not exists ai_workspace_apps (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text,
  description text,
  category text,
  app_type text,

  status text default 'idea',
  priority text default 'medium',

  local_path text,
  github_url text,
  vercel_url text,
  live_url text,
  docs_url text,

  tech_stack text[],
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),

  is_client_demo boolean default false,
  is_sellable_product boolean default false,
  is_internal_tool boolean default true,
  is_open_source boolean default false,

  current_version text,
  current_issue text,
  next_action text,
  blockers text,

  business_value text,
  target_user text,
  monetization_idea text,

  last_checked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table ai_workspace_apps enable row level security;

create policy "Internal users can manage AI Workspace Apps" 
  on ai_workspace_apps for all 
  using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role in ('SUPER_ADMIN', 'FOUNDER', 'DIRECTOR', 'STAFF', 'CONTRACTOR')
    )
  );

-- Seed Data
insert into ai_workspace_apps (name, category, app_type, status, local_path, business_value, next_action)
values 
('ZeroOrigins OS', 'internal_tool', 'web_app', 'in_progress', 'D:\AI-Workspace\Repos\zeroorigins-os', 'Internal company operating system for ideas, leads, partners, projects, and execution.', 'Stabilize auth gateway and internal dashboard.'),
('OrgTrace', 'saas_product', 'web_app', 'idea', 'D:\AI-Workspace\Repos\orgtrace', 'Organizational tracing and mapping tool.', 'Define MVP scope.'),
('DeskKeeper AI', 'ai_agent', 'desktop_app', 'idea', 'D:\AI-Workspace\Repos\deskkeeper-ai', 'AI-powered desktop management assistant.', 'Research local LLM integration.'),
('Retail Execution', 'experimental', 'web_app', 'mvp_ready', 'D:\AI-Workspace\Repos\retail-execution', 'Perfect Store Scorecard for retail audits.', 'Deploy demo for potential client.'),
('IgnAIte', 'automation', 'n8n_workflow', 'in_progress', 'D:\AI-Workspace\Repos\ignite', 'AI automation catalyst for business workflows.', 'Connect to internal lead flow.'),
('AIwithNoBrains', 'content_system', 'content_pipeline', 'idea', 'D:\AI-Workspace\Repos\ai-with-no-brains', 'Automated content creation and distribution system.', 'Prototype content generator.'),
('PlotDNA', 'saas_product', 'ai_agent', 'testing', 'D:\AI-Workspace\Repos\plotdna', 'AI story plotting and DNA analysis for writers.', 'Finalize beta testing feedback.'),
('FreeLLM API', 'internal_tool', 'api', 'deployed', 'D:\AI-Workspace\Repos\freellm-api', 'Internal API gateway for accessing various LLM providers.', 'Monitor usage and quotas.'),
('QureWell', 'saas_product', 'web_app', 'idea', 'D:\AI-Workspace\Repos\qurewell', 'Health and wellness tracking platform.', 'Market research phase.');
