-- Migration 003: Add missing proposal fields and customer contact fields

-- Proposals: add service_type, scope, timeline, proposal_url, internal_notes, sent_at, expires_at
alter table proposals
  add column if not exists service_type text,
  add column if not exists scope text,
  add column if not exists timeline text,
  add column if not exists proposal_url text,
  add column if not exists internal_notes text,
  add column if not exists sent_at timestamptz,
  add column if not exists expires_at timestamptz;

-- Customers: add contact fields for lead conversion
alter table customers
  add column if not exists phone text,
  add column if not exists website text;
