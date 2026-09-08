# Bible — Telugu and English (Design)

Date: 2026-09-08. Owner request: an in-app Bible in Telugu and English from open sources.

## Texts and licences

| Language | Translation | Source | Licence | Attribution shown in app |
|---|---|---|---|---|
| English | Berean Standard Bible (BSB) | eBible.org `engbsb_usfm.zip` | Public domain | "Berean Standard Bible, public domain (berean.bible, via ebible.org)" |
| Telugu | పరిశుద్ధ గ్రంథము — Telugu Old Version (1880) | JSON per book from github.com/aruljohn/Bible-telugu (MIT) | Public domain text | "పరిశుద్ధ గ్రంథము (Telugu Old Version, 1880), public domain — data from github.com/aruljohn/Bible-telugu (MIT)" |

The owner chose these on 2026-09-08 because the group knows the Old Version wording (the IRV and
WEB were tried first and rejected). USFM is parsed per language; each keeps its own numbering.
Text is stored unmodified.

## Storage

`scripts/bible/build.mjs` (Node ≥ 22, `node:sqlite`, no dependencies) downloads the BSB USFM zip
and the 66 Telugu JSON files and writes `apps/mobile/assets/bible/bible-v2.db` (bump the name to
invalidate the copy cached on devices):

```
books(id INTEGER PK, code, testament, name_en, name_te, short_te, chapters_en, chapters_te)
verses(lang TEXT, book INTEGER, chapter INTEGER, verse INTEGER, label TEXT, text TEXT, PRIMARY KEY(lang, book, chapter, verse))
meta(key TEXT PK, value TEXT)   -- version, licences, source commit
```

The `.db` is a bundled asset (`metro.config.js` adds `db` to `assetExts`). On first open the app
copies it into the SQLite directory (versioned file name) and opens it with `expo-sqlite`. Search
uses `LIKE` (case-insensitive for English) — fast enough for 31k rows and needs no FTS build flags.
The database is git-committed (~15 MB) so builds are reproducible without network.

## Mobile

- `src/features/bible/` — `books.ts` (canon table, testament split), `service.ts`
  (`createBibleService(db)` → `books()`, `chapter(bookId, n, lang)`, `search(q, lang, limit)`),
  `useBibleLanguage()` (AsyncStorage-backed `'en' | 'te'`), tests against the built DB via
  `node:sqlite`-compatible fakes for the service mapping.
- Routes: `bible/index` (language toggle, OT/NT sections, book grid, search entry, attribution),
  `bible/[book]` (chapter grid), `bible/[book]/[chapter]` (reader, prev/next chapter, verse tap →
  action sheet: Copy, Share, Post to group), `bible/search`.
- "Post to group" opens `resources/new` prefilled (`type=scripture`, `title=<reference>`,
  `body=<verse text>`).
- Home "Word" quick action → `/bible`. Resources tab gets a "Read the Bible" link.
- Web: `bibleDb.web.ts` returns "Bible reading is available in the mobile app."; screens render the
  message. Verification happens on the iOS simulator via deep links and screenshots.

## Out of scope

Bookmarks/highlights, reading plans, audio, parallel two-column view, other languages.
