# ZeroOrigins Sync Inbox Design

**Date:** 2026-06-15
**Status:** Draft for review
**Primary user:** ZeroOrigins internal team

## Goal

ZeroOrigins OS needs a sync layer that turns external activity into clean operating records without creating duplicates or forcing the team to fill forms for everything.

The first problem to solve is Google Calendar duplication: the same meeting can appear on admin, support, and personal calendars, and the CRM should show one canonical meeting instead of multiple signals. The broader system should later ingest Drive files, finance/subscription data, local workspace files, Gmail, GitHub, YouTube/content assets, and forms through the same review-and-confirm pattern.

## Product Principle

External systems produce signals. ZeroOrigins OS owns the final business records.

Trusted sources can create or update records automatically, but every sync should remain auditable. Untrusted or personal sources should enrich known records or enter a review inbox before creating anything final.

## Business Verticals

All synced records should be linkable to one primary ZeroOrigins vertical:

1. ZeroOrigins CRM Systems
   - Salesforce, CRM, Service Cloud, Field Service, dashboards, automation, and AppExchange products.
2. ZeroOrigins AI Systems
   - SaaS apps, AI agents, voice apps, automations, internal tools, and business operating systems.
3. ZeroOrigins Media Lab
   - YouTube, AI videos, technical content, cinematic content, brand storytelling, and creative experiments.
4. ZeroOrigins Academy
   - AI training, Salesforce training, job readiness, bootcamps, and placement-focused programs.

The vertical is a routing and reporting field, not a hard storage boundary. Meetings, documents, tasks, subscriptions, vendors, projects, and content assets can all point to a vertical.

## Core Model

### Sync Signal

`sync_signals` is the intake table for raw external data.

Each signal should track:
- source provider, such as `google_calendar`, `google_drive`, `finance`, `local_folder`, `gmail`, `github`, `youtube`, or `form`
- source account, such as admin, support, or a personal team account
- source object id, such as Google event id or Drive file id
- source payload as JSON
- title, occurred/scheduled time, source URL, and extracted text where available
- suggested record type
- suggested business vertical
- confidence score
- status: `new`, `needs_review`, `matched`, `created`, `ignored`, or `error`
- related final record ids after confirmation or matching

Signals are append-friendly. The CRM can update the latest interpretation, but raw source data should remain available for audit and debugging.

### Canonical Records

Canonical records remain in the existing domain tables where possible:
- `meetings`
- `knowledge_articles`
- `vendors`
- `finance_transactions`
- `tasks`
- `projects`
- `ai_workspace_apps`
- `business_verticals`

The Sync Inbox should avoid inventing duplicate final tables. It should route clean data into existing operating records.

### Source Links

For records that may have multiple external origins, use link tables rather than stuffing all source identity into the final record.

For calendar phase 1:
- `calendar_event_signals` or generic `sync_signals` stores raw imported events.
- `meeting_sync_links` connects one canonical meeting to one or more calendar signals.

This lets one CRM meeting be backed by admin calendar, support calendar, and personal calendar events at the same time.

## Trusted Source Rules

Admin and support calendars are company source-of-truth calendars.

Calendar priority:
1. Admin calendar
2. Support calendar
3. Personal/team member calendars

Trusted company calendars can create or update canonical meetings automatically when the match confidence is high.

Personal calendars should not freely create final meetings. Personal events should:
- match and enrich an existing canonical meeting when possible
- enter the review inbox when no canonical match exists
- never create duplicate meetings for an event already represented by admin or support

Later sources should follow the same trust model:
- approved Drive folders can create document signals
- approved finance sources can create vendor/spend signals
- local folders can create app/document/content signals
- forms can create low-trust signals unless submitted by an internal active user

## Calendar Dedupe

The app should create one canonical `meetings` row per real meeting.

Matching should use, in priority order:
1. exact source link match: same provider, source account, and source object id
2. Google recurring event identity where available
3. meeting link match, such as Google Meet URL
4. title normalization plus close start time
5. attendee overlap
6. source priority

If admin and support both contain the same meeting, admin wins for canonical ownership unless the support event has richer operational metadata. The lower-priority event becomes an additional source link.

If a personal calendar contains a matching event, it should add attendee/context signal only.

If a personal calendar contains a new event that does not match admin/support, the signal status becomes `needs_review`.

## Review Inbox

The Sync Inbox should provide a small operational queue before expanding automation.

Inbox statuses:
- `new`: imported but not yet classified
- `needs_review`: requires human decision
- `matched`: linked to an existing record
- `created`: created a final record
- `ignored`: intentionally dismissed
- `error`: sync or classification failed

Primary actions:
- create meeting
- create document
- create vendor/spend
- create task
- link to existing
- merge duplicate
- assign vertical
- ignore

Review actions should record who confirmed the action and when.

## Document And Asset Types

The sync classifier should support these first-party asset types:
- PRD
- BRD
- company doc
- SOP/playbook
- storyboard
- content plan
- training material
- vendor bill
- subscription
- project note
- meeting note

AI may suggest the type and vertical, but the first release should require confirmation for anything that creates or mutates important records outside trusted calendar sync.

## Phase 1 Scope: Calendar Dedupe

Objective: stop duplicate meeting creation and establish the sync signal pattern.

Included:
- add raw calendar signal storage
- add meeting-to-signal links
- define admin/support calendar source priority
- update Google Calendar sync to match before insert
- allow trusted admin/support events to create canonical meetings
- route personal-calendar-only events to review
- show source/account context on meeting detail or list surfaces
- add focused tests for dedupe behavior

Excluded:
- Google Drive sync
- Gmail sync
- finance provider sync
- YouTube/content sync
- full AI classification UI
- broad automation rules

## Phase 1 Acceptance

- The same meeting appearing on admin and support calendars produces one CRM meeting.
- A matching personal calendar event attaches to the existing meeting instead of creating a duplicate.
- A personal-only event appears in the review inbox and does not auto-create a meeting.
- Each synced meeting can show which calendar accounts contributed source signals.
- The sync path is idempotent: running sync twice does not duplicate meetings.
- Existing manual meeting creation still works.

## Later Phases

### Phase 2: Company Intake Inbox

Expand `sync_signals` UI beyond calendar. Add review filters, status counts, source filters, and vertical assignment.

### Phase 3: Vertical Routing

Make every major operating record linkable to the four business verticals. Add dashboards per vertical for meetings, docs, spend, apps, tasks, and content.

### Phase 4: Document And Workspace Sync

Sync approved Drive folders and local workspace inventories into document/app/content signals.

### Phase 5: Finance And Subscription Sync

Sync vendors, recurring subscriptions, bills, and app fees into finance signals before creating vendor or transaction records.

### Phase 6: Trusted Automation

Allow selected trusted sources to auto-create records with audit trails, confidence thresholds, and rollback/ignore controls.

## Risks

- Calendar APIs expose different ids for copied or forwarded events, so dedupe cannot rely on Google event id alone.
- Over-aggressive auto-creation can pollute the CRM with personal or irrelevant events.
- Remote Supabase schema drift can break sync routes if migrations are not applied consistently.
- AI classification should not be trusted as the system of record in early phases.

## Implementation Notes

- Prefer source links over duplicate final records.
- Keep raw signals for audit and future reprocessing.
- Treat admin/support as trusted calendars, but still store every imported event as a signal.
- Keep personal calendar imports review-gated unless they match an existing canonical record.
- Implement calendar first and reuse the same pattern for Drive, finance, local folders, and later sources.
