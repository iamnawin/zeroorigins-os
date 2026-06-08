# AI Workspace Module

The **AI Workspace** is the central repository for all internal apps, products, and experiments within ZeroOrigins. It serves as a product inventory and status tracker for everything being built or explored.

## Purpose
- Track internal repositories (`D:\AI-Workspace\Repos`)
- Monitor app health (Working, Broken, MVP Ready)
- Evaluate business value and monetization potential
- Centralize links (GitHub, Vercel, Live, Docs)
- Plan next actions and identify blockers

## Database Schema (`ai_workspace_apps`)
The module is powered by the `ai_workspace_apps` table, which includes:
- **Identity**: Name, Slug, Description, Category, App Type
- **Status**: Status (idea to ready_to_sell), Priority
- **Infrastructure**: Local Path, GitHub URL, Vercel URL, Live URL
- **Technical**: Tech Stack (array), Current Issue, Next Action, Blockers
- **Business**: Business Value, Target User, Monetization Idea
- **Attributes**: Client Demo?, Sellable?, Internal Tool?, Open Source?

## Status Lifecycle
- `idea`: Initial concept
- `planned`: Scope defined, ready to build
- `in_progress`: Active development
- `mvp_ready`: Functional prototype available
- `testing`: Beta testing phase
- `deployed`: Live and operational
- `broken`: Needs repair or refactoring
- `paused`: On hold
- `archived`: Historical record
- `ready_to_sell`: Productized and marketable
- `client_demo`: Optimized for presentations

## How to Add Apps Manually
The AI Workspace is **manual-first** — every app is entered by hand. There is no automatic discovery yet.

1. Go to **Internal Workspace → AI Workspace** (`/internal/ai-workspace`).
2. Click **Add App** (`/internal/ai-workspace/new`).
3. Fill in at minimum: **Name**, **Status**, **Category**, **App Type**.
4. Add links you have (GitHub, Vercel, Live, Docs) and a **Next Action** so the Control Room snapshot is useful.
5. Save. The app appears in the list and in the Control Room **AI Workspace Snapshot**.
6. To update health, open the app and use **Edit** (`/internal/ai-workspace/[id]/edit`). Set status to `archived` or `paused` to remove it from the default Active view.

Records are never hard-deleted — use `archived`/`paused` to close them out (consistent with the rest of ZeroOrigins OS).

## Field Reference
- **name / slug** — display name and URL-safe identifier.
- **description** — one-line summary of what the app does.
- **category** — business classification (e.g. `saas_product`, `internal_tool`, `client_demo`).
- **app_type** — technical shape (e.g. `web_app`, `chrome_extension`, `n8n_workflow`, `api`).
- **status** — lifecycle stage (see below). Drives the Active/All filter.
- **priority** — `low` / `medium` / `high` / `critical`.
- **local_path** — path on disk under `D:\AI-Workspace\Repos`.
- **github_url / vercel_url / live_url / docs_url** — external links surfaced in the UI.
- **tech_stack** — array of technologies (e.g. `["Next.js", "Supabase"]`).
- **current_version / current_issue / next_action / blockers** — live operational health.
- **business_value / target_user / monetization_idea** — why it exists and how it could earn.
- **is_client_demo / is_sellable_product / is_internal_tool / is_open_source** — boolean attributes for filtering.
- **last_checked_at** — when health was last manually verified.

## Future Automation (Deferred)
**GitHub/Vercel sync is intentionally NOT built yet.** The module is manual-first by design: we want a curated, accurate inventory before adding automation that could overwrite human judgement with noisy filesystem/repo state. Manual entry also forces us to think about business value and next actions per app — data a scanner can't infer.

When we do build sync (a later phase), the plan is a local script or GitHub integration that:
1. Scans `D:\AI-Workspace\Repos` for directories.
2. Detects project type (package.json, requirements.txt).
3. Checks Git status and README quality.
4. Extracts Vercel/live links from configurations.
5. Updates ZeroOrigins OS records with real-time health data — without clobbering manually curated business fields.

## Resource Kit Integration
AI Workspace uses standard Resource Kit components for consistent UI/UX:
- `ResourcePageHeader`: Standardized title and create actions.
- `ResourceViewTabs`: Active/All filtering (Archived and Paused are hidden by default).
- `ResourceStatusBadge`: Color-coded status visualization.
- `ResourceEmptyState`: Contextual empty states.
