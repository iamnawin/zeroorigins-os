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

## Future Automation
In the future, a local script or GitHub integration will automatically sync the AI Workspace module with the local filesystem:
1. Scan `D:\AI-Workspace\Repos` for directories.
2. Detect project type (package.json, requirements.txt).
3. Check Git status and README quality.
4. Extract Vercel/live links from configurations.
5. Update ZeroOrigins OS records with real-time health data.

## Resource Kit Integration
AI Workspace uses standard Resource Kit components for consistent UI/UX:
- `ResourcePageHeader`: Standardized title and create actions.
- `ResourceViewTabs`: Active/All filtering (Archived and Paused are hidden by default).
- `ResourceStatusBadge`: Color-coded status visualization.
- `ResourceEmptyState`: Contextual empty states.
