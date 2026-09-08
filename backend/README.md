# Backend (Back4App / Parse Server)

Prayer Warriors uses a dedicated Back4App app named **PrayerWarriors**. Never point
this at an app that hosts another product: `_User`, `_Role`, and `_Session` are shared
across the whole Parse app.

## First-time setup

    cp backend/.env.example backend/.env   # fill in keys from App Settings → Security & Keys
    set -a; source backend/.env; set +a
    node backend/schema/setup.mjs

The script is idempotent. It creates/updates `_User` fields, `Group`, `GroupMember`,
the first group, its `group:<id>:member` / `group:<id>:admin` roles, and (if
`ADMIN_EMAIL`/`ADMIN_PASSWORD` are set) the first admin user.

## Access model

- Sign-up is master-key only (admins create members). Username = email.
- Admins add members with Cloud Code `addMember`: it creates the user with a one-time
  starting password (returned once, never stored), adds the `group:<id>:member` role, and
  creates the `GroupMember` row. Only callers holding an active admin membership may use it.
- Every class requires authentication to read; other writes are master-key only.
- Per-group Parse Roles are the equivalent of row-level security. Objects carry ACLs
  granting read to `role:group:<id>:member`.

## Cloud Code

Deploy `backend/cloud/main.js` and `members.js` together (Back4App dashboard → Cloud Code, or
the MCP deploy tool). Unit tests: `npm test -w backend`.
