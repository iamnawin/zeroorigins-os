# AI Workspace Sync

The AI Workspace sync system automatically reads your local `D:\AI-Workspace` folder structure and populates the AI Workspace registry in ZeroOrigins OS.

## Overview

The sync script scans your local workspace and detects:
- Apps in standard folder groups (Ideas, Experiments, Projects, Repos, etc.)
- Top-level brand folders (Alwithnobrain Audio Labs, EpicsToYou, etc.)
- App types (Next.js, Vite, Python, Node.js, etc.)
- URLs from package.json and README.md files
- Metadata overrides from zo.meta.json files

## Folder Structure

The sync system expects this folder structure:

```
D:\AI-Workspace\
├── Ideas\                  # Early concepts and ideas
│   ├── app-idea-1\
│   └── app-idea-2\
├── Experiments\            # Proof of concepts and prototypes
│   ├── experiment-1\
│   └── experiment-2\
├── Projects\               # Active development projects
│   ├── project-1\
│   └── project-2\
├── Repos\                  # Code repositories
│   ├── zeroorigins-os\
│   ├── plotdna\
│   └── applyo-platform\
├── Tools\                  # Internal tools and utilities
│   └── db\
├── Media\                  # Media projects and assets
├── Video-Outputs\          # Video content and outputs
├── Delivered\              # Finished/delivered products
├── Live\                   # Publicly available products
├── Backups\                # Backup files
├── Sandbox\                # Testing and temporary work
├── Temp\                   # Temporary files
├── Brands\                 # Brand assets and sites
├── Alwithnobrain Audio Labs\  # Brand folder (top-level)
├── Alwithnobrain Stuff\       # Brand folder (top-level)
└── EpicsToYou\               # Brand folder (top-level)
```

## Commands

### Dry Run (recommended first)
```bash
npm run sync:workspace -- --dry-run
```

This scans the workspace and shows what would be synced without making database changes.

### Full Sync
```bash
npm run sync:workspace
```

This syncs all detected apps to the database.

## Environment Variables

Required in `.env.local`:

```bash
# Supabase connection
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Workspace location (optional - defaults to D:\AI-Workspace)
AI_WORKSPACE_ROOT=D:\AI-Workspace
```

## App Type Detection

The sync script automatically detects app types:

- **nextjs_app** - Contains `next.config.js` or `next.config.ts`
- **vite_app** - Contains `vite.config.*` files
- **node_app** - Contains `package.json` (fallback)
- **python_app** - Contains `pyproject.toml` or `requirements.txt`
- **salesforce_app** - Contains `sfdx-project.json`
- **documentation_or_concept** - Only README.md and minimal files
- **workspace_folder** - Default fallback

## URL Detection

The script extracts URLs from:

1. **package.json** - `homepage` and `repository` fields
2. **README.md** - HTTP/HTTPS URLs (first 2000 characters, max 3 URLs)
   - GitHub URLs → `github_url`
   - Vercel/Netlify URLs → `vercel_url` 
   - Other URLs → `website_url`

## Metadata Override (zo.meta.json)

Place a `zo.meta.json` file in any app folder to override detected values:

```json
{
  "name": "PlotDNA",
  "description": "AI-powered story plotting and character development",
  "status": "live",
  "category": "saas_product",
  "app_type": "nextjs_app",
  "priority": "high",
  "github_url": "https://github.com/plotdna/plotdna",
  "vercel_url": "https://plotdna.vercel.app",
  "live_url": "https://plotdna.com",
  "prototype_url": "https://prototype.plotdna.com",
  "website_url": "https://plotdna.com",
  "target_user": "Writers, storytellers, creative agencies",
  "business_value": "AI-assisted plot and story intelligence platform",
  "monetization_idea": "Subscription model with freemium tier",
  "next_action": "Launch beta waitlist campaign",
  "is_internal_tool": false,
  "is_client_demo": true,
  "is_sellable_product": true,
  "is_open_source": false,
  "is_live": true,
  "is_delivered": true
}
```

## Folder Group Mappings

| Folder Group | Category | Status | Sellable | Live | Delivered |
|--------------|----------|---------|----------|------|-----------|
| Ideas | idea | idea | false | false | false |
| Experiments | experimental | planned | false | false | false |
| Projects | saas_product | in_progress | true | false | false |
| Repos | repo | active | false | false | false |
| Tools | internal_tool | active | false | false | false |
| Media | media | active | false | false | false |
| Video-Outputs | media | active | false | false | false |
| Delivered | delivered | delivered | true | false | true |
| Live | live | live | true | true | false |
| Brands | brand | active | true | false | false |

## Status Meanings

- **idea** - Early concept or idea phase
- **planned** - Defined and ready for development
- **in_progress** - Active development
- **active** - Functioning/maintained
- **delivered** - Completed and handed off
- **live** - Publicly available/deployed
- **mvp_ready** - Minimum viable product complete
- **testing** - In testing phase
- **deployed** - Deployed but not public
- **broken** - Not functioning
- **paused** - Development paused
- **archived** - No longer maintained

## Delivered vs Live

- **Delivered**: Finished assets, products, client builds, or internal systems that are complete and ready for handoff
- **Live**: Publicly available deployed sites, apps, demos, channels, or company assets that are accessible to users

## Ignored Folders

The sync script ignores common development folders:
- `node_modules`
- `.git`
- `.next`
- `dist`
- `build`
- `.turbo`
- `coverage`
- `.cache`
- `AGENTS`
- `AI_WORKSPACE_RULES`
- `CLAUDE`

## Browser Limitation

⚠️ **Important**: The web application cannot directly scan `D:\AI-Workspace` from the browser due to security restrictions. The sync must be run as a local Node.js script.

## Manual vs Sync

- **Manual Add**: Use the "Add App" button in the UI to manually create entries
- **Sync**: Run the sync script to automatically detect and import apps from the file system
- **Coexistence**: Both approaches work together - manually added apps won't be overwritten by sync

## Troubleshooting

### "Workspace directory not found"
- Verify `AI_WORKSPACE_ROOT` path exists
- Check folder permissions
- Use forward slashes or escaped backslashes in paths

### "No database connection"
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not the anon key)
- Check `.env.local` file exists and is properly formatted

### Apps not appearing in UI
- Check sync completed successfully
- Verify apps weren't filtered out by ignored patterns
- Check database permissions/RLS policies
- Refresh the AI Workspace page

## Development Notes

The sync script uses:
- **Upsert by slug** - Prevents duplicates on repeated syncs  
- **Safe metadata parsing** - Handles missing/malformed files gracefully
- **Limited file reading** - Reads only first 2KB of README files
- **Shallow scanning** - Only scans 2 levels deep (folder group → app folder)