# AI Workspace Sync

## Overview

The AI Workspace registry tracks all ZeroOrigins apps, repos, experiments, brands, tools, media, and products. Records can be added manually through the UI or synced from the local workspace folder.

**Browser limitation:** The web app cannot scan local folders directly. Sync is performed via a Node.js CLI script.

## Folder Structure

```
D:\AI-Workspace
├── Ideas/           → idea stage apps
├── Experiments/     → experimental prototypes
├── Projects/        → active projects
├── Repos/           → git repositories
├── Tools/           → internal utilities
├── Media/           → media assets
├── Video-Outputs/   → rendered video content
├── Delivered/       → finished/handed-off products
├── Live/            → publicly deployed apps/sites
├── Backups/         → archived backups
├── Sandbox/         → throwaway experiments
├── Temp/            → temporary work
├── Alwithnobrain Audio Labs  → brand folder
├── Alwithnobrain Stuff       → brand folder
├── EpicsToYou                → brand folder
```

## Sync Command

```bash
# Dry run (prints detected apps, no DB writes)
pnpm sync:workspace --dry-run

# Live sync (upserts to Supabase)
pnpm sync:workspace
```

## Required Environment Variables

| Variable | Required For | Description |
|----------|-------------|-------------|
| `AI_WORKSPACE_ROOT` | Optional | Defaults to `D:\AI-Workspace` |
| `NEXT_PUBLIC_SUPABASE_URL` | Live sync | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Live sync | Service role key (not exposed to browser) |

Dry-run mode works without Supabase credentials.

## App Type Detection

The sync script infers `app_type` from files in each folder:

| File Present | Detected Type |
|-------------|---------------|
| `next.config.ts/js/mjs` | `nextjs_app` |
| `vite.config.*` | `vite_app` |
| `sfdx-project.json` | `salesforce_app` |
| `pyproject.toml` or `requirements.txt` | `python_app` |
| `package.json` (no framework config) | `node_app` |
| `README.md` only | `documentation_or_concept` |
| Media/Video-Outputs group | `media_project` |
| None of the above | `workspace_folder` |

## zo.meta.json Override

Place a `zo.meta.json` file inside any app folder to override inferred values:

```json
{
  "name": "PlotDNA",
  "status": "live",
  "category": "product",
  "app_type": "web_app",
  "github_url": "https://github.com/...",
  "vercel_url": "https://...",
  "live_url": "https://...",
  "prototype_url": "https://...",
  "website_url": "https://...",
  "target_user": "Founders, agencies, creators",
  "business_value": "AI-assisted plot and story intelligence",
  "monetization_idea": "Subscription or lifetime deal",
  "is_internal_tool": false,
  "is_client_demo": true,
  "is_sellable_product": true,
  "is_open_source": false,
  "is_live": true,
  "is_delivered": true,
  "priority": "high",
  "next_action": "Add landing page and waitlist",
  "owner": "Naveen"
}
```

## Delivered vs Live

**Delivered:** Finished assets, products, client builds, or internal systems that are ready/handoff-ready.

**Live:** Publicly available deployed sites, apps, demos, channels, or company assets (e.g., ZeroOrigins website, PlotDNA live site, AIwithNoBrain public channel).

## Manual Add vs Sync

- **Manual:** Use the "Add App" button in the UI to register apps not in the workspace folder.
- **Sync:** Run `pnpm sync:workspace` to discover and register apps from the local folder structure.
- Re-running sync is safe — it upserts by slug, avoiding duplicates.
- Manual edits are preserved; sync only updates fields it detects.

## Ignored Folders

The script skips these inside app directories:
- `node_modules`, `.git`, `.next`, `dist`, `build`, `.turbo`, `coverage`, `.cache`, `__pycache__`, `.venv`, `target`

Top-level non-app folders like `AGENTS`, `AI_WORKSPACE_RULES`, `CLAUDE` are also skipped.

## Scan Depth

- Top-level: identifies folder groups and brand folders
- One level deep: identifies individual apps within groups
- Inside apps: reads only metadata files (package.json, zo.meta.json, config files)

No recursive deep scanning.
