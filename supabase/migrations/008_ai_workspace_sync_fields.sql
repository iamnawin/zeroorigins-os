-- Migration 008: Add sync-related fields to ai_workspace_apps

ALTER TABLE ai_workspace_apps ADD COLUMN IF NOT EXISTS repo_path text;
ALTER TABLE ai_workspace_apps ADD COLUMN IF NOT EXISTS prototype_url text;
ALTER TABLE ai_workspace_apps ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE ai_workspace_apps ADD COLUMN IF NOT EXISTS brand_url text;
ALTER TABLE ai_workspace_apps ADD COLUMN IF NOT EXISTS folder_group text;
ALTER TABLE ai_workspace_apps ADD COLUMN IF NOT EXISTS owner text;
ALTER TABLE ai_workspace_apps ADD COLUMN IF NOT EXISTS is_live boolean default false;
ALTER TABLE ai_workspace_apps ADD COLUMN IF NOT EXISTS is_delivered boolean default false;
ALTER TABLE ai_workspace_apps ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

-- Fix RLS policy to use current roles (admin/employee)
DROP POLICY IF EXISTS "Internal users can manage AI Workspace Apps" ON ai_workspace_apps;

CREATE POLICY "Internal users can manage AI Workspace Apps"
  ON ai_workspace_apps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'employee')
    )
  );
