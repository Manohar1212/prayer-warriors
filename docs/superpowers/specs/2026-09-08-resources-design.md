# Resources (Design)

Date: 2026-09-08 — Phase 4 of the product plan (sections 11, 21).

## Goal

Members share songs, scripture, and prayers with the group. Everything is text plus an
optional link (YouTube, Spotify, Bible app); no audio or document uploads in V1, which keeps
storage free and avoids redistributing copyrighted music.

## Data

`Resource` — `group` Pointer, `createdBy` Pointer<_User>, `type` (`song`|`scripture`|`prayer`),
`title` (≤120), `body` (≤4000: lyrics excerpt / verse text / prayer text, optional), `reference`
(≤80: artist for songs, Bible reference for scripture, optional), `url` (http(s) only, optional),
`note` (≤500, optional). Row ACL: read for the group's roles. CLP: reads authenticated, writes
master only.

## Cloud Code (`resources.js`, pure; wired in `main.js`)

| Function | Rule |
|---|---|
| `createResource({ type, title, body, reference, url, note })` | caller has an active membership → that group; validate; create with group-read ACL. Returns the DTO. |
| `deleteResource({ resourceId })` | caller is the creator or a group admin; resource belongs to the caller's group. |

Messages: `notMember` "You're not a member of this group yet."; `invalidType` "Choose songs,
scripture, or prayers."; `titleRequired` "Give it a title."; `titleTooLong` "Keep the title under
120 characters."; `bodyTooLong` "Keep the text under 4000 characters."; `referenceTooLong` "Keep
the reference under 80 characters."; `noteTooLong` "Keep the note under 500 characters.";
`invalidUrl` "Links must start with http:// or https://."; `nothingToShare` "Add some text or a
link."; `notFound` "That resource isn't available."; `notAllowed` "Only the person who shared
this, or an admin, can remove it."

## Mobile

- `src/features/resources/` — `types.ts`, `service.ts` (`createResourcesService({ fetchResources, cloud })` → `list(type)`, `create(input)`, `remove(id)`), `useResources(type)`, tests.
- `(tabs)/resources.tsx` — segments Songs / Scripture / Prayers, a search box that filters
  title, reference, and body client-side, a "Share" button, cards (title, reference, first lines
  of body, link chip, sharer name). Tapping a card opens the detail.
- `app/resources/new.tsx` modal — type chips, then fields that adapt: Songs = Title, Artist,
  Link, Lyrics or note; Scripture = Reference (e.g. James 5:16), Verse text, Note; Prayers =
  Title, Prayer text, Note. Requires a title and at least text or a link.
- `app/resources/[id].tsx` — full text, "Open link" (system browser), "Remove" for creator/admin
  with confirmation.
- Home quick actions Song and Word already deep-link to the Resources tab.

## Out of scope

Uploads (audio, PDFs, images), favourites, comments, categories beyond the three, push
notifications for new resources.
