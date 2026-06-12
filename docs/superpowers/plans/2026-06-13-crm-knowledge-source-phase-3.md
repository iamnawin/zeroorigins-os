# CRM Knowledge Source Phase 3 Implementation Plan

> **For agentic workers:** Execute this plan task-by-task from `phase/crm-knowledge-source-phase-3`, stacked on the pushed Phase 2 branch.

**Goal:** Replace the Knowledge placeholder with a real internal document/source-of-truth module backed by Supabase `knowledge_articles`.

**Architecture:** Reuse the existing `knowledge_articles` table from migration `001_initial_schema.sql`. Do not add schema unless the current table cannot support a usable first release. Keep the first release focused on title, content, category, tags, owner, and timestamps.

---

## Task 1: Lock Knowledge Backend Coverage

- [ ] Extend migration sentinels with `knowledge_articles.title`, `knowledge_articles.content`, `knowledge_articles.category`, and `knowledge_articles.tags`.
- [ ] Add a lightweight source test that requires `createKnowledgeArticle` and `updateKnowledgeArticle` exports in `src/lib/actions/internal-resources.ts`.
- [ ] Add a package script `test:crm-knowledge`.
- [ ] Verify the new test fails before implementing actions.

## Task 2: Add Knowledge Types And Actions

- [ ] Add `KnowledgeArticle` and `KnowledgeArticleFormInput` typing.
- [ ] Add `createKnowledgeArticle` and `updateKnowledgeArticle` server actions.
- [ ] Parse comma-separated tags into `text[]`.
- [ ] Revalidate `/internal/knowledge` and detail routes after save.
- [ ] Require an active internal user before writes.

## Task 3: Add Knowledge UI

- [ ] Create `src/components/forms/KnowledgeArticleForm.tsx`.
- [ ] Replace `/internal/knowledge` placeholder with a list/table page.
- [ ] Add `/internal/knowledge/new`.
- [ ] Add `/internal/knowledge/[id]`.
- [ ] Add `/internal/knowledge/[id]/edit`.
- [ ] Include practical document categories:
  - project_document
  - client_requirement
  - meeting_note
  - decision
  - sop_playbook
  - finance_vendor_document
  - automation_note
  - product_spec

## Task 4: Surface Knowledge In Control Room

- [ ] Replace the static Knowledge shortcut meta text with a live article count.
- [ ] Keep the Knowledge link in the top navigation from Phase 2.

## Task 5: Documentation And Verification

- [ ] Update `docs/CONTEXT_HANDOFF.md` with Phase 3 branch, scope, shipped routes, and resume commands.
- [ ] Update `docs/project-status.md`.
- [ ] Run:

```powershell
npm run test:crm-knowledge
npm run test:crm-navigation
npm run test:crm-foundation
npm run check:migrations
npm run check:crm
npm run lint
npm run build
```

## Commit Plan

Commit 1: Phase 3 plan and failing knowledge contract test.

Commit 2: knowledge backend actions, types, and sentinel coverage.

Commit 3: knowledge UI routes and Control Room count.

Commit 4: handoff/status docs after verification.

All commits must follow the Lore Commit Protocol.
