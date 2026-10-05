# Integration branch — conflicts in your PRs, and what we need from you

**From:** Ajay · **Date:** 18 Sep 2026 · **Status:** integration branches built locally, parked, nothing pushed

---

## TL;DR

1. **47 PRs are open across both repos and nothing has merged since 15 Sep.** Our chains are 5 and 7 deep. Plan: build **one integration branch per repo** containing all our September work, test it properly, then ask Jayadev to merge one branch instead of 34 PRs.
2. **FE-21 landed and decomposed `DashboardLayout.tsx` from 3894 lines to 756.** This is the thing most likely to surprise you. Details in §2.
3. **Your PRs came through well** — 7 of your 13 merge completely clean, and all 5 of your backend PRs pass CI 6/6 (ours don't).
4. **6 of your PRs conflict.** All are collisions on shared registration points, not design problems. §3 and §4 list every file.
5. **We found two real bugs in BE-6 territory** — one is a genuine API bug, not a test problem. §5.
6. **We need three things from you.** §6.
7. **BE-1 (DAT-5) status question** — it blocks two of my tickets. §7.

Nothing has been pushed. No PR has been modified. All 34 PRs are still Open and unmerged. If we scrap this plan, nothing is lost.

---

## 1. Why we're doing this

| | Yours | Mine | Stale (others) | Open total |
|---|---|---|---|---|
| Frontend | 8 | 10 | 5 | 23 |
| Backend | 5 | 11 | 8 | 24 |

34 of those 47 are ours. They collapse to **22 merges**, because our chains are linear — merging my `fe21-layout-split` tip brings 5 PRs with it, and `be16-search` brings 9.

The deeper problem: a reviewer starting at the top of a 7-deep chain has to either trust six unreviewed ancestors or walk the whole thing. And if the bottom PR needs a change, every descendant rebases.

---

## 2. Heads-up: FE-21 decomposed DashboardLayout.tsx

`DashboardLayout.tsx` went from **3894 lines to 756**. About 3138 lines moved into `src/components/layout/dashboard/`:

| New file | What moved into it |
|---|---|
| `hooks/useDashboardTabs.ts` | all tab state, persistence, handlers, section auto-select, keyboard, `beforeunload` |
| `hooks/useTabFileEvents.ts` | all window CustomEvent listeners — `fileDeleted`, `folderDeleted`, `openFileInTab`, `projectFileChanged`, `fileRenamed`, `forceRefreshOpenTabs` |
| `hooks/useSectionRouting.ts` | route → section derivation |
| `hooks/useActiveProject.ts` | project/route context |
| `hooks/useDbtDocsGeneration.ts`, `hooks/useDagsterUi.ts`, `hooks/useIsDarkTheme.ts` | those clusters |
| `DbtDocsTerminal.tsx`, `DagsterUiTerminal.tsx`, `UnsavedChangesDialog.tsx` | extracted components |
| `types.ts`, `sections.ts`, `sectionConfig.tsx`, `SubSidebarRefContext.ts` | component-free files |

Two things worth knowing:

- **No React contexts were introduced.** Every cluster is still a hook called in the shell body with props threaded, so state ownership and re-render behaviour are unchanged. If your code needs tab state, read it off `useDashboardTabs`'s return value.
- **`src/__tests__/dashboard-layout.test.tsx` now has 27 characterization tests** that mount the real `DashboardLayout`. Nothing had ever mounted it before. They pin current behaviour, so if a change breaks something they'll tell you — please don't weaken them to get green.

Also relevant: **FE-14 (#174) did the same to `JupyterNotebook.tsx`**, which is now decomposed into `src/components/notebook/`. That's why your FE-5-adjacent files show conflicts.

---

## 3. Your backend PRs

All five pass CI 6/6. One merged clean; four conflicted and have been resolved on the parked branch.

| PR | Branch | Result |
|---|---|---|
| #231 | `manohar/feature/be-7-chat-upload` | **clean** |
| #237 | `manohar/feature/be-12-storage-connectors` | conflict — 3 files |
| #230 | `manohar/feature/be-15-data-contracts` | conflict — 2 files |
| #233 | `manohar/feature/be-6-audit-trail` | conflict — 3 files |
| #232 | `manohar/feature/be-8-git-ops` | conflict — 7 files |

### How each was resolved — please sanity-check these

The rule applied throughout was **preserve both sides**. Nothing of yours was dropped, stubbed or commented out. Where a genuine either/or came up it was flagged rather than decided.

**`src/connectors_service/main.py`** — the hotspot, conflicted in every merge. Every import and registration was unioned: `internal_router` **and** `budgets_router`/`events_router`; `_migrate_settings_tables()` **and** `ensure_platform_events_schema` + rollup + telemetry sink; `conn_config_from_row` **and** `fetch_columns` + storage imports; `sql_runner.models` **and** `data_contracts.models`.

**`src/connectors_service/security.py`** — two different `get_fernet()` implementations. Kept **both behaviours**: my platform-wide `resolve_encryption_keys()` (one env var) *and* your comma-split multi-key rotation, by splitting each resolved value. Both verified working. **Worth your review** — this is the one where the two designs genuinely overlapped.

**`src/connectors_service/db_utils.py`** — not a git conflict, but it would have silently broken your feature. Your BE-12 extended the in-place `_conn_config_from_row`, which my branch had relocated into `db_utils`. A clean merge would have lost storage-connector resolution for sql_runner. Your `STORAGE_CONNECTORS` branch was moved into `db_utils.conn_config_from_row` instead, so sql_runner resolves storage connectors too. **Please confirm that's what you intended.**

**`src/connectors_service/tests/conftest.py`** — kept my Postgres-preferred harness *and* your clean-SQLite-file + per-table tolerant creation, branching on dialect. Also had to alias `sys.modules["connectors_service.main"]` because the two sides import via different roots.

**`src/api-gateway/main.py`** — both middlewares wanted to be outermost. The security guard stays outermost (its contract requires it); audit goes just inside, still outside `AuthenticationMiddleware` so it keeps 401/403 visibility. **Tell us if audit needs to be strictly outermost** — that would change the resolution.

**`src/chat_service/fastapi_server/app.py`** — audit added inside `RequestContextMiddleware` so audit records carry the `X-Request-Id`.

**`src/auth-service/app/api/v1/auth.py`** — kept BE-4's telemetry `emit` *and* BE-6's `_audit_auth` call.

**`tests/common/` → `tests/common_middleware/`** (your 7 files) — accepted your rename. All 8 files are `R100` renames, nothing lost, and you'd already updated `ci.yml` to the new path.

**`deployment/.env.example`** — both doc blocks unioned.

---

## 4. Your frontend PRs

| PR | Branch | Result |
|---|---|---|
| #161 | `manohar/feature/fe-17-onboarding` | **clean** |
| #162 | `manohar/fix/e2e-stale-specs` | **clean** |
| #167 | `manohar/feature/be-15-contracts-ui` | **clean** |
| #171 | `manohar/feature/fe-12-storage-connectors` | **clean** |
| #172 | `manohar/feature/fe-8-chat-upload` | **clean** |
| #177 | `manohar/feature/fe-6-audit-viewer` | **clean** |
| #160 | `manohar/feature/fe-19-in-app-docs` | conflict — `DashboardLayout.tsx` |
| #173 | `manohar/feature/fe-10-source-control` | conflict — `DashboardLayout.tsx` |

**6 of 8 clean, including FE-6, FE-8 and FE-12** — the three we expected to conflict worst with FE-21. They didn't, because FE-21 moved *state out of* the shell while your features mostly *add* components and routes.

Only #160 and #173 modify the shell itself, and each conflicts on that one file. **These are not yet resolved** — work was stopped so you could be briefed first. The resolution will be to re-wire whatever those two read from the shell onto the new hooks, keeping your features unchanged. You'll get the result to review.

---

## 5. Two bugs found in BE-6 territory

Both pre-existing, neither introduced by the merge. Flagging because the second looks real.

**`test_audit_trail.py::test_ingest_stores_service_ts_and_redacts` fails.** It hardcodes `ts="2026-01-02"`, now 258 days old, so the 90-day retention purge deletes the row on ingest. Reproduces on your own SQLite harness. Easy fix: make the timestamp relative.

**Behind it, a likely real API bug:** the read API returns `ts` in **server-local time (`+05:30`)** rather than UTC, so the assertion also fails on Postgres. That's a genuine API contract issue, not a test problem — **your call on whether it's worth a ticket.**

Also, not a bug: `moto[server]>=5.0` is correctly declared in `src/connectors_service/requirements.txt` by BE-12 but isn't in our shared local venv, so `test_storage_connectors.py` fails at collection locally. It passes on CI. Nothing to fix.

---

## 6. What we need from you

1. **Review the backend resolutions in §3**, especially `security.py` (the dual `get_fernet()`) and `db_utils.py` (your `STORAGE_CONNECTORS` branch moving). Those are the two where your intent mattered and we inferred it.
2. **Confirm the middleware ordering in `api-gateway/main.py`** — audit sits inside the security guard. Say so if audit must be outermost.
3. **Update your Linear states.** 11 of your 19 beta-hardening tickets have open PRs but still read *Todo* — so from the board it looks like nothing has been built. Specifically: DAT-10, 11, 12, 16, 19, 29, 31, 33, 35, 40, 42.

---

## 7. BE-1 (DAT-5) — the one that's blocking me

**BE-1 has no PR and no conflicts** — it's not part of the integration work. Raising it because it's the only cross-person dependency in our 19/19 split (`BE-11 → BE-1 → BE-9`), and it's blocking two of my tickets:

- **DAT-13 BE-9** Terminal / PTY service — can't start
- **DAT-30 FE-7** Terminal panel — can't start

My BE-11 shipped as #195 on 13 Sep, so BE-1 has been unblocked for five days. It's marked *In Progress* in Linear with nothing visible.

**What's the actual status, and is there an ETA?** If it's going to be a while, I'd rather drop BE-9/FE-7 down my queue than keep holding a slot for them. Same question for **DAT-24 FE-1**, also *In Progress* with no PR.

---

## 8. Current state of the integration branches

Both are **local and unpushed**, parked pending a conversation with Jayadev about whether he'll accept one branch per repo instead of 34 PRs.

| | Branch | State |
|---|---|---|
| Backend | `integration/beta-2026-09-17` | 91 commits ahead of main; all 16 of our backend PRs merged; conflicts resolved |
| Frontend | `integration/beta-2026-09-17` | 51 commits ahead; my chain + 6 of yours merged; stopped before resolving #160/#173 |

**No PR has been modified and neither `main` has moved.** All 34 PRs still read Open / unmerged. One more thing to know: when Jayadev eventually merges an integration branch, **the 34 PRs will still show as Open**, because their base is `main` and the commits arrive via a different branch. They'll need closing by hand as superseded.
