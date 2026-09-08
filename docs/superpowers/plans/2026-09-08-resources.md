# Resources Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Members share songs, scripture, and prayers (text + optional link) with the group.

**Architecture:** Same shape as the prayer module: pure Cloud Code handlers with injected repositories for writes, Parse SDK reads behind a small service and hook, three screens in the existing design language.

**Spec:** `docs/superpowers/specs/2026-09-08-resources-design.md`

## Global Constraints

- All earlier Global Constraints apply. Messages are exactly the spec's strings.
- The app never saves `Resource` directly; all writes go through Cloud Code.
- Links open in the system browser via `Linking.openURL`; the app never embeds players.

---

### Task 1: Backend — schema, handlers (TDD), wiring, deploy

**Files:** `backend/schema/setup.mjs` (+`Resource`), `backend/cloud/resources.js`, `backend/cloud/resources.test.js`, `backend/cloud/main.js`.

**Interfaces:**
```js
const TYPES = ['song', 'scripture', 'prayer'];
createResourceHandlers({
  memberships: { findGroupId(userId), findAdminGroupId(userId) },
  resources:   { create(fields) → dto, get(id) → dto|null, remove(id) },
}).createResource(params, { callerId }) → dto
  .deleteResource({ resourceId }, { callerId }) → { deleted: true }
// dto: { id, groupId, createdById, type, title, body, reference, url, note, createdAt }
```

- [ ] Tests: create happy path (trimmed, group from membership, empty optionals → ''), each validation message, `nothingToShare` when body and url are both empty, URL must be http(s); delete by creator, by admin, by other → notAllowed, missing → notFound, other group → notFound, non-member → notMember.
- [ ] Implement; wire in `main.js` (`resources` repository with group-read ACL; `createdBy` pointer; DTO mapper); add the schema; run setup; deploy `main.js` + `resources.js`; live-check create/delete with Shiny; clean up. Commit.

### Task 2: Mobile — service, hook, screens

**Files:** `src/features/resources/{types,service,service.test,useResources,index}.ts`, `app/(tabs)/resources.tsx`, `app/resources/new.tsx`, `app/resources/[id].tsx`, `app/_layout.tsx`, `src/lib/parse.ts`.

- [ ] `service.test.ts`: list maps rows (sharer name fallback "Member", newest first) and filters by type; `matches(resource, query)` case-insensitive over title/reference/body; `create`/`remove` call the cloud functions; cloud messages pass through.
- [ ] Implement service + `useResources(type)` (load, refresh on focus, `create`, `remove`) + Parse fetcher in `parse.ts`.
- [ ] Screens per spec; register `resources/new` (modal) and `resources/[id]` (card) routes.
- [ ] Typecheck, tests, web export; commit.

### Task 3: Verify and finish

- [ ] Web as Shiny: share a song with a link, a scripture, a prayer; search; open detail; open link; remove; console clean; clean up server data; merge per finishing-a-development-branch.
