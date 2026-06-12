# ZeroOrigins CRM Source Of Truth Design

**Date:** 2026-06-13
**Status:** Approved for phased implementation
**Primary user:** ZeroOrigins internal team

## Goal

ZeroOrigins OS must become the internal source of truth for the company, not a decorative CRM shell. The first product shape is for a three-person internal team: the founder/admin plus two future admins or employees. External customers and partners remain supported, but they should not dominate the interface while there are no real external records.

The system should record every operating asset that matters: projects, tasks, meetings, documents, decisions, spending, vendors, leads, deals, AI workspace apps, and automation events.

## Current Problems

- Internal save flows can show generic errors even when Supabase environment variables are present.
- The migration checker only verifies schema through migration `009`, while the app now depends on later meetings and finance tables.
- Knowledge and Settings are placeholders, so documents, team management, and admin onboarding are not real workflows.
- Finance exists, but it is not visually or navigationally prominent enough for daily spending control.
- Customers and partners are visible as top-level CRM surfaces even when there are no real records.
- n8n and automation are conceptually part of the business, but there is no first-party registry for workflows.

## Product Principles

- Internal work first: optimize for the ZeroOrigins team before turning this into a sellable CRM.
- Real records only: no feature should pretend to save if the backend is not ready.
- Source of truth: documents, meeting notes, decisions, finances, and automation state belong inside the CRM.
- Upgradeable modules: keep CRM, Finance, Knowledge, Calendar, Settings, and Automations separated enough to become plugin-style modules later.
- Hide irrelevant empty areas: customers and partners should remain available but visually secondary until there is real data.
- Manual before automation: record data reliably before adding n8n or AI automation on top.

## Target Navigation

Primary internal navigation should be reorganized around daily operations:

1. Control Room
2. Projects
3. Tasks
4. Meetings / Calendar
5. Documents / Knowledge
6. Finance
7. AI Workspace
8. Automations
9. Leads
10. Deals
11. Customers
12. Partners
13. Settings

Customers and Partners should move into a growth/commercial section or lower navigation priority until real records exist.

## Phase 1: Foundation And Save Reliability

Objective: make the existing CRM trustworthy before adding larger modules.

Scope:
- Extend migration/schema checks to cover all tables and columns used by current forms.
- Add a CRM health check that verifies environment variables, schema sentinels, and internal profile readiness.
- Improve documentation for diagnosing save failures.
- Preserve current UI behavior except for clearer diagnostics where low-risk.

Acceptance:
- A developer can run one command and know whether Supabase schema and profile setup can support internal saves.
- Migration checks cover meetings, vendors, finance transactions, and other fields used by server actions.
- The handoff docs describe the current branch, phase status, commands, and next step.

## Phase 2: Internal CRM Navigation And Empty States

Objective: make the app feel like an internal operating system.

Scope:
- Reorder internal navigation around Projects, Tasks, Meetings, Knowledge, Finance, AI Workspace, and Automations.
- Move Customers and Partners below active internal workflows.
- Replace generic "No records" states with useful internal next actions.
- Surface Finance from the Control Room so spending is easy to find.

Acceptance:
- First viewport communicates internal operations, not sales theater.
- Empty partner/customer areas do not make the product feel fake.
- Finance is reachable and visible from daily operating screens.

## Phase 3: Documents And Knowledge Source Of Truth

Objective: replace the Knowledge placeholder with a usable internal document hub.

Document types:
- project document
- client requirement
- meeting note
- decision
- SOP/playbook
- finance/vendor document
- automation note
- product spec

Each document must have:
- title
- content
- category/type
- status
- tags
- owner
- optional links to project, customer, lead, deal, app, meeting, or vendor
- internal-only visibility in the first release

Acceptance:
- Users can create, list, view, and update internal documents.
- Documents can be categorized and linked to operating records.
- This becomes the durable memory layer for the company.

## Phase 4: Team And Calendar

Objective: make three-person team operations explicit.

Scope:
- Replace Settings placeholder with team/profile management foundations.
- Track admin/employee status, role, title, and calendar identity.
- Add calendar filtering for "My Calendar" and "Team Calendar" on first-party meeting records.
- Prepare for later Google Calendar sync without requiring it in this phase.

Acceptance:
- The founder can see internal users and whether they are active.
- Meetings can be understood by owner/attendee.
- External calendar sync remains a later integration, not a blocker.

## Phase 5: Finance Operating Console

Objective: make spending control obvious.

Scope:
- Rework Finance into an operating console for company spend.
- Emphasize monthly spend, AI/API spend, upcoming bills, overdue payments, vendors, recurring subscriptions, and project-linked costs.
- Keep this separate from sales revenue.

Acceptance:
- Finance answers "what are we spending and what is due next?" in one screen.
- Vendor and transaction creation remain real Supabase-backed records.

## Phase 6: Automations And n8n Registry

Objective: add first-party visibility into automation workflows.

Track:
- workflow name
- trigger type
- connected entity type/id
- status
- last run time
- external workflow id
- notes
- next action

Initial workflow targets:
- create follow-up task after a meeting
- notify admins before finance due dates
- create a document shell when a project starts
- create board/task structure when a project starts
- summarize meeting notes with AI
- sync AI workspace apps from local folders

Acceptance:
- Automations can be recorded, audited, and linked to CRM entities.
- n8n integration can be added without redesigning the data model.

## Release And Branching Plan

- Implement one phase per branch when practical.
- Commit documentation before code for each phase.
- Push each completed phase branch after verification.
- After Phases 1, 2, and 3 are complete and pushed, merge them into `main`.
- Keep `docs/CONTEXT_HANDOFF.md` updated after every phase so another agent can resume without the chat history.

## Known Risks

- Supabase RLS can make saves fail even when the schema exists.
- The current project has no full test runner; Phase 1 should add lightweight script-level tests for diagnostic tooling.
- Some docs are stale and refer to older role names. Phase work should update them as touched.
- External calendar and n8n sync should not be implemented until first-party records are reliable.
