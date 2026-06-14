-- Migration 017: CRM & Salesforce Systems vertical
-- Treat Salesforce and CRM products as applications under a strategic business vertical.

alter table business_verticals drop constraint if exists business_verticals_type_check;
alter table business_verticals add constraint business_verticals_type_check
  check (type in ('brand', 'product', 'education', 'media', 'internal', 'client_service', 'experiment', 'lab', 'video', 'creative_tech', 'product_studio', 'service', 'crm', 'other'));

alter table applications drop constraint if exists applications_type_check;
alter table applications add constraint applications_type_check
  check (type in ('application', 'product', 'internal_system', 'automation', 'website', 'tool', 'service_product', 'salesforce_app', 'other'));

alter table applications add column if not exists next_action text;

insert into business_verticals (name, slug, type, status, description, owner, notes)
values (
  'CRM & Salesforce Systems',
  'crm-salesforce-systems',
  'crm',
  'active',
  'Strategic vertical for Salesforce, CRM, AppExchange, Service Cloud, Sales Cloud, Experience Cloud, and CRM automation products built by ZeroOrigins.',
  'Naveen',
  'Business Vertical -> Applications / Products -> Repo / Assets / Status / Purpose / Next Action.'
)
on conflict (slug) do update set
  name = excluded.name,
  type = excluded.type,
  status = excluded.status,
  description = excluded.description,
  owner = excluded.owner,
  notes = excluded.notes;

insert into applications (name, slug, description, vertical_id, stage, status, type, local_folder_path, next_action, notes)
values
  (
    'ServiceOps Pulse',
    'serviceops-pulse',
    'Salesforce-integrated service operations monitoring dashboard for support and delivery visibility.',
    (select id from business_verticals where slug = 'crm-salesforce-systems'),
    'concept',
    'active',
    'salesforce_app',
    null,
    'Confirm MVP scope and connect source assets.',
    'CRM & Salesforce Systems product.'
  ),
  (
    'OrgTrace',
    'orgtrace',
    'Product-ready developer and Salesforce metadata intelligence application.',
    (select id from business_verticals where slug = 'crm-salesforce-systems'),
    'production_ready',
    'active',
    'salesforce_app',
    'D:\AI-Workspace\Repos\orgtrace',
    'Package the Salesforce metadata intelligence workflow for first demos.',
    'CRM & Salesforce Systems product.'
  ),
  (
    'Perfect Store Scorecard',
    'perfect-store-scorecard',
    'Retail execution and CRM scorecard product for field audits, store scoring, and follow-up workflows.',
    (select id from business_verticals where slug = 'crm-salesforce-systems'),
    'prototype',
    'active',
    'salesforce_app',
    'D:\AI-Workspace\Repos\Perfect-Store-Scorecard',
    'Validate demo flow and identify Salesforce packaging path.',
    'CRM & Salesforce Systems product.'
  ),
  (
    'Salesforce Automation Packs',
    'salesforce-automation-packs',
    'Reusable Salesforce and CRM automation packs for lead follow-up, service workflows, alerts, and reporting.',
    (select id from business_verticals where slug = 'crm-salesforce-systems'),
    'concept',
    'active',
    'automation',
    null,
    'Define first three automation packs and required assets.',
    'CRM & Salesforce Systems product.'
  ),
  (
    'CRM Implementation Accelerators',
    'crm-implementation-accelerators',
    'Templates, scripts, discovery assets, and implementation shortcuts for CRM delivery projects.',
    (select id from business_verticals where slug = 'crm-salesforce-systems'),
    'concept',
    'active',
    'service_product',
    null,
    'Collect reusable delivery assets and publish accelerator checklist.',
    'CRM & Salesforce Systems product.'
  ),
  (
    'Experience Cloud / Portal Systems',
    'experience-cloud-portal-systems',
    'Customer and partner portal systems using Salesforce Experience Cloud and connected CRM workflows.',
    (select id from business_verticals where slug = 'crm-salesforce-systems'),
    'concept',
    'active',
    'salesforce_app',
    null,
    'Map portal use cases and reusable portal components.',
    'CRM & Salesforce Systems product.'
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  vertical_id = excluded.vertical_id,
  stage = excluded.stage,
  status = excluded.status,
  type = excluded.type,
  local_folder_path = coalesce(applications.local_folder_path, excluded.local_folder_path),
  next_action = excluded.next_action,
  notes = excluded.notes;

update business_ideas
set vertical_id = (select id from business_verticals where slug = 'crm-salesforce-systems')
where lower(coalesce(title, '')) in (
  'serviceops pulse',
  'orgtrace',
  'perfect store scorecard',
  'salesforce automation packs',
  'crm implementation accelerators',
  'experience cloud / portal systems'
);
