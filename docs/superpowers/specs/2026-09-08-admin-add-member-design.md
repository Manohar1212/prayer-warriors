# Admin Add Member (Design)

Date: 2026-09-08 — first slice of Phase 2 (Group & Profiles).
Sign-in is email + password (see `2026-09-07-phase1-foundation-design.md`).

## Goal

A group admin (Shiny) can add members from the app. The Community tab lists the group's
members. A new member receives a starting password that the admin shares once.

## Flow

```
Community (member list) ──[admin only: Add member]──▶ Add member form
   name, email, phone?  ──Cloud addMember──▶  { startingPassword }  ──▶ Result: Share / Copy
```

## Backend (Cloud Code)

`members.js` — `createMemberHandlers({ memberships, users, roles, generatePassword })`
→ `addMember({ displayName, email, phone }, { callerId })` → `{ id, displayName, email,
phone, startingPassword }`. Pure and unit-tested with fakes.

Rules, in order:
1. Caller must be signed in and hold an active `admin` membership; otherwise
   "Only admins can add members." The admin's group is the target group.
2. `displayName` required (trimmed, ≤ 40) — "Enter the member's name."
3. `email` required, lower-cased, basic shape check — "Enter a valid email address."
4. `phone` optional; if present must be E.164 — "That doesn't look like a valid mobile number."
5. Email must be unused — "A member with that email already exists."
6. Create `_User` (username = email, generated 12-char password, displayName, phone) with the
   master key; add to role `group:<id>:member`; create `GroupMember` (role member, status
   active, joinedAt now, ACL read for the group's member and admin roles).
7. Return the starting password exactly once. It is never stored or logged.

`main.js` wires `addMember` (callerId = `request.user?.id`), keeps `ping`, and restores the
`_User` duplicate-phone `beforeSave` guard.

## Mobile

- `src/features/members/`: `types.ts`, `service.ts` (`createMembersService({ fetchMemberships,
  cloud })` → `list()`, `add(input)`), `useMembers()` hook, tests.
- `list()` maps raw `GroupMember` rows (with `user` included) to `Member { id, userId,
  displayName, role, status }`, admins first then by name. Membership rows are readable by
  members already (CLP authenticated + ACL role read); `_User.protectedFields` hides email
  and phone from other members, so the list only shows names.
- `isAdmin` = the signed-in user's own membership has role admin.
- Screens: `(tabs)/community.tsx` (count, list, admin-only "Add member" button);
  `app/add-member.tsx` modal (form → result with Share via the OS share sheet and Copy via
  `expo-clipboard`). Design language unchanged.

## Out of scope

Removing/deactivating members, editing others' profiles, multiple groups, emailing the
password automatically.
