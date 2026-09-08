# Admin Add Member Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a group admin add members from the app and let everyone see the member list.

**Architecture:** One master-key Cloud Code function (`addMember`) guarded by the caller's admin membership, with pure handler logic unit-tested via injected fakes. The app reads memberships directly with the Parse SDK and calls the function through a small `membersService`; a `useMembers` hook feeds the Community list and the Add member modal.

**Tech Stack:** Back4App Cloud Code (CommonJS), Parse JS SDK 8, Expo Router 57, NativeWind, `expo-clipboard`, Jest.

**Spec:** `docs/superpowers/specs/2026-09-08-admin-add-member-design.md`

## Global Constraints

- Earlier plans' Global Constraints apply (versions, palette, `expo install`, RNTL 14 async, commit trailer).
- The starting password is returned once by `addMember` and never stored or logged anywhere.
- Member-facing messages are exactly the strings in the spec.
- Backend tests run with `npm test -w backend`; the `backend` workspace exists on `main`? **No** — it was added on the OTP branch. Task 1 recreates `backend/package.json` and `jest.config.js` and adds `"backend"` to root `workspaces`.

---

### Task 1: Backend workspace + `addMember` handler (TDD)

**Files:** Create `backend/package.json`, `backend/jest.config.js`, `backend/cloud/members.js`, `backend/cloud/members.test.js`. Modify root `package.json`.

**Interfaces:**
```js
const MESSAGES = { adminOnly, nameRequired, invalidEmail, invalidPhone, duplicate }
createMemberHandlers({
  memberships: { findAdminGroupId(userId) → groupId | null, create({ groupId, userId, role }) },
  users:       { findByEmail(email) → user | null, create({ username, email, password, displayName, phone }) → { id } },
  roles:       { addUser(groupId, roleName, userId) },
  generatePassword: () → string,
}).addMember(params, { callerId }) → { id, displayName, email, phone, startingPassword }
```

- [ ] **Step 1: Workspace** — `backend/package.json` `{ "name": "prayer-warriors-backend", "private": true, "scripts": { "test": "jest" }, "devDependencies": { "jest": "~29.7.0" } }`; `backend/jest.config.js` `module.exports = { testEnvironment: 'node', testMatch: ['**/*.test.js'] };`; root `workspaces: ["apps/*", "backend"]`; `npm install`.

- [ ] **Step 2: Failing test** — `members.test.js`
```js
const { createMemberHandlers, MESSAGES } = require('./members');

function deps({ adminGroupId = 'g1', existing = null } = {}) {
  return {
    memberships: {
      findAdminGroupId: jest.fn(async () => adminGroupId),
      create: jest.fn(async () => ({ id: 'gm1' })),
    },
    users: {
      findByEmail: jest.fn(async () => existing),
      create: jest.fn(async () => ({ id: 'u2' })),
    },
    roles: { addUser: jest.fn(async () => undefined) },
    generatePassword: jest.fn(() => 'Starting123'),
  };
}
const caller = { callerId: 'admin1' };
const input = { displayName: '  Mary ', email: 'Mary@Example.com', phone: '+919876543210' };

describe('addMember', () => {
  it('creates the user, role, and membership and returns the starting password once', async () => {
    const d = deps();
    const result = await createMemberHandlers(d).addMember(input, caller);
    expect(d.users.create).toHaveBeenCalledWith({
      username: 'mary@example.com', email: 'mary@example.com', password: 'Starting123',
      displayName: 'Mary', phone: '+919876543210',
    });
    expect(d.roles.addUser).toHaveBeenCalledWith('g1', 'member', 'u2');
    expect(d.memberships.create).toHaveBeenCalledWith({ groupId: 'g1', userId: 'u2', role: 'member' });
    expect(result).toEqual({ id: 'u2', displayName: 'Mary', email: 'mary@example.com', phone: '+919876543210', startingPassword: 'Starting123' });
  });
  it('allows a missing phone', async () => {
    const d = deps();
    const result = await createMemberHandlers(d).addMember({ displayName: 'Mary', email: 'm@e.com' }, caller);
    expect(d.users.create.mock.calls[0][0].phone).toBeUndefined();
    expect(result.phone).toBeNull();
  });
  it('rejects anonymous callers', async () => {
    const d = deps();
    await expect(createMemberHandlers(d).addMember(input, {})).rejects.toThrow(MESSAGES.adminOnly);
    expect(d.memberships.findAdminGroupId).not.toHaveBeenCalled();
  });
  it('rejects non-admins before touching users', async () => {
    const d = deps({ adminGroupId: null });
    await expect(createMemberHandlers(d).addMember(input, caller)).rejects.toThrow(MESSAGES.adminOnly);
    expect(d.users.findByEmail).not.toHaveBeenCalled();
  });
  it.each([
    ['missing name', { ...input, displayName: '  ' }, 'nameRequired'],
    ['bad email', { ...input, email: 'nope' }, 'invalidEmail'],
    ['bad phone', { ...input, phone: '12345' }, 'invalidPhone'],
  ])('rejects %s', async (_, bad, key) => {
    const d = deps();
    await expect(createMemberHandlers(d).addMember(bad, caller)).rejects.toThrow(MESSAGES[key]);
    expect(d.users.create).not.toHaveBeenCalled();
  });
  it('rejects a duplicate email', async () => {
    const d = deps({ existing: { id: 'u9' } });
    await expect(createMemberHandlers(d).addMember(input, caller)).rejects.toThrow(MESSAGES.duplicate);
    expect(d.users.create).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run to fail. Step 4: Implement** — `members.js`
```js
'use strict';

const E164 = /^\+[1-9]\d{7,14}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MESSAGES = {
  adminOnly: 'Only admins can add members.',
  nameRequired: "Enter the member's name.",
  invalidEmail: 'Enter a valid email address.',
  invalidPhone: "That doesn't look like a valid mobile number.",
  duplicate: 'A member with that email already exists.',
};

function fail(message) { return new Error(message); }

function createMemberHandlers({ memberships, users, roles, generatePassword }) {
  return {
    async addMember({ displayName, email, phone } = {}, { callerId } = {}) {
      if (!callerId) throw fail(MESSAGES.adminOnly);
      const groupId = await memberships.findAdminGroupId(callerId);
      if (!groupId) throw fail(MESSAGES.adminOnly);

      const name = typeof displayName === 'string' ? displayName.trim().slice(0, 40) : '';
      if (!name) throw fail(MESSAGES.nameRequired);
      const address = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (!EMAIL.test(address)) throw fail(MESSAGES.invalidEmail);
      const mobile = typeof phone === 'string' && phone.trim() ? phone.trim() : null;
      if (mobile && !E164.test(mobile)) throw fail(MESSAGES.invalidPhone);

      if (await users.findByEmail(address)) throw fail(MESSAGES.duplicate);

      const password = generatePassword();
      const user = await users.create({
        username: address, email: address, password, displayName: name,
        ...(mobile ? { phone: mobile } : {}),
      });
      await roles.addUser(groupId, 'member', user.id);
      await memberships.create({ groupId, userId: user.id, role: 'member' });
      return { id: user.id, displayName: name, email: address, phone: mobile, startingPassword: password };
    },
  };
}

module.exports = { createMemberHandlers, MESSAGES };
```
Note for the "allows a missing phone" test: `users.create` receives no `phone` key when absent — the test checks `.phone` is `undefined`, satisfied by the spread above.

- [ ] **Step 5: Pass (8 tests), commit** — `feat(backend): addMember cloud handler`.

---

### Task 2: Parse wiring and deploy

**Files:** Modify `backend/cloud/main.js`, `backend/README.md`.

- [ ] **Step 1: main.js**
```js
'use strict';

const crypto = require('crypto');
const { createMemberHandlers } = require('./members');

function pointer(className, id) { return { __type: 'Pointer', className, objectId: id }; }

const memberships = {
  async findAdminGroupId(userId) {
    const row = await new Parse.Query('GroupMember')
      .equalTo('user', pointer('_User', userId))
      .equalTo('role', 'admin')
      .equalTo('status', 'active')
      .first({ useMasterKey: true });
    return row ? row.get('group').id : null;
  },
  async create({ groupId, userId, role }) {
    const row = new Parse.Object('GroupMember');
    row.set('group', pointer('Group', groupId));
    row.set('user', pointer('_User', userId));
    row.set('role', role);
    row.set('status', 'active');
    row.set('joinedAt', new Date());
    const acl = new Parse.ACL();
    acl.setRoleReadAccess(`group:${groupId}:member`, true);
    acl.setRoleReadAccess(`group:${groupId}:admin`, true);
    row.setACL(acl);
    await row.save(null, { useMasterKey: true });
    return { id: row.id };
  },
};

const users = {
  async findByEmail(email) {
    return new Parse.Query(Parse.User).equalTo('email', email).first({ useMasterKey: true });
  },
  async create(fields) {
    const user = new Parse.User();
    Object.entries(fields).forEach(([k, v]) => user.set(k, v));
    await user.save(null, { useMasterKey: true });
    return { id: user.id };
  },
};

const roles = {
  async addUser(groupId, roleName, userId) {
    const role = await new Parse.Query(Parse.Role)
      .equalTo('name', `group:${groupId}:${roleName}`)
      .first({ useMasterKey: true });
    if (!role) throw new Error(`Role group:${groupId}:${roleName} is missing.`);
    role.getUsers().add(pointer('_User', userId));
    await role.save(null, { useMasterKey: true });
  },
};

const generatePassword = () => crypto.randomBytes(9).toString('base64url').slice(0, 12);

const handlers = createMemberHandlers({ memberships, users, roles, generatePassword });

Parse.Cloud.define('addMember', async (request) =>
  handlers.addMember(request.params, { callerId: request.user ? request.user.id : null }),
);

// A phone number belongs to at most one member.
Parse.Cloud.beforeSave(Parse.User, async (request) => {
  const user = request.object;
  const phone = user.get('phone');
  if (!phone || !user.dirty('phone')) return;
  const clash = await new Parse.Query(Parse.User)
    .equalTo('phone', phone).notEqualTo('objectId', user.id ?? '').first({ useMasterKey: true });
  if (clash) throw new Parse.Error(Parse.Error.DUPLICATE_VALUE, 'That phone number is already registered.');
});

Parse.Cloud.define('ping', () => 'pong');
```
`role.getUsers().add(pointer)` — if the SDK rejects a raw pointer, use `Parse.User.createWithoutData(userId)` instead.

- [ ] **Step 2: README** — under "Access model" add: "Admins add members with Cloud Code `addMember` (creates the user with a one-time starting password, adds the member role and a `GroupMember` row)."
- [ ] **Step 3: Deploy** `main.js` + `members.js` via `deploy_cloud_code_files`; verify `ping`, then `addMember` with no session → "Only admins can add members."; with Shiny's session token (from `/login` with the JS key) and a throwaway email → returns a password; sign in as that member via REST; then delete the throwaway user, its `GroupMember` row, and remove it from the role (master key). Commit `feat(backend): wire addMember`.

---

### Task 3: Mobile members service and hook (TDD)

**Files:** Create `apps/mobile/src/features/members/{types.ts,service.ts,service.test.ts,useMembers.ts,index.ts}`. Modify `src/lib/parse.ts`.

**Interfaces:**
```ts
type MemberRole = 'admin' | 'member';
type Member = { id: string; userId: string; displayName: string; role: MemberRole; status: 'active' | 'inactive' };
type NewMember = { displayName: string; email: string; phone?: string };
type AddedMember = { id: string; displayName: string; email: string; phone: string | null; startingPassword: string };
type RawMembership = { id: string; role: string; status: string; user: { id: string; displayName?: string } | null };
createMembersService({ fetchMemberships: () => Promise<RawMembership[]>, cloud: { run(name, params) } })
  .list(): Promise<Member[]>        // admins first, then displayName A→Z; rows without a user are dropped
  .add(input: NewMember): Promise<AddedMember>
useMembers(): { members, loading, error, refresh, isAdmin, add }
```

- [ ] **Step 1: Failing test** — `service.test.ts`
```ts
import { createMembersService } from './service';

const rows = [
  { id: 'm2', role: 'member', status: 'active', user: { id: 'u2', displayName: 'Mary' } },
  { id: 'm1', role: 'admin', status: 'active', user: { id: 'u1', displayName: 'Shiny' } },
  { id: 'm3', role: 'member', status: 'active', user: { id: 'u3', displayName: 'Anna' } },
  { id: 'm4', role: 'member', status: 'active', user: null },
];

function svc(cloudResult: unknown = {}) {
  const cloud = { run: jest.fn(async () => cloudResult) };
  return { service: createMembersService({ fetchMemberships: async () => rows, cloud }), cloud };
}

describe('membersService', () => {
  it('lists admins first, then members by name, dropping rows without a user', async () => {
    const { service } = svc();
    const members = await service.list();
    expect(members.map((m) => m.displayName)).toEqual(['Shiny', 'Anna', 'Mary']);
    expect(members[0]).toEqual({ id: 'm1', userId: 'u1', displayName: 'Shiny', role: 'admin', status: 'active' });
  });
  it('falls back to "Member" when a name is missing', async () => {
    const service = createMembersService({
      fetchMemberships: async () => [{ id: 'm', role: 'member', status: 'active', user: { id: 'u' } }],
      cloud: { run: jest.fn() },
    });
    expect((await service.list())[0].displayName).toBe('Member');
  });
  it('adds a member through the cloud function', async () => {
    const added = { id: 'u9', displayName: 'Mary', email: 'm@e.com', phone: null, startingPassword: 'x' };
    const { service, cloud } = svc(added);
    await expect(service.add({ displayName: 'Mary', email: 'm@e.com' })).resolves.toEqual(added);
    expect(cloud.run).toHaveBeenCalledWith('addMember', { displayName: 'Mary', email: 'm@e.com', phone: undefined });
  });
  it('passes cloud messages through', async () => {
    const { service, cloud } = svc();
    cloud.run.mockRejectedValueOnce(Object.assign(new Error('Only admins can add members.'), { code: 141 }));
    await expect(service.add({ displayName: 'M', email: 'm@e.com' })).rejects.toThrow('Only admins can add members.');
  });
});
```

- [ ] **Step 2: Implement** `types.ts`, `service.ts` (map + sort + `mapParseError`), `useMembers.ts`:
```ts
export function useMembers(): MembersState {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setError(null); setMembers(await membersService.list()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load members.'); }
  }, []);
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);
  const isAdmin = members.some((m) => m.userId === user?.id && m.role === 'admin');
  const add = useCallback(async (input: NewMember) => { const added = await membersService.add(input); await load(); return added; }, [load]);
  return { members, loading, error, refresh: load, isAdmin, add };
}
```
`src/lib/parse.ts`:
```ts
export const membersService = createMembersService({
  fetchMemberships: async () => {
    const rows = await new Parse.Query('GroupMember').include('user').ascending('joinedAt').limit(200).find();
    return rows.map((row) => {
      const u = row.get('user') as Parse.User | undefined;
      return { id: row.id ?? '', role: row.get('role'), status: row.get('status'), user: u ? { id: u.id ?? '', displayName: u.get('displayName') } : null };
    });
  },
  cloud: Parse.Cloud,
});
```
- [ ] **Step 3: Typecheck, test (4 new), commit** `feat(members): members service and hook`.

---

### Task 4: Community screen and Add member modal

**Files:** Modify `app/(tabs)/community.tsx`, `app/_layout.tsx`. Create `app/add-member.tsx`. Install `expo-clipboard`.

- [ ] **Step 1: Community** — header row "N members" + admin-only `Button title="Add member"` → `router.push('/add-member')`; `FlatList` of rows: initial disc (blush for admin, sage for member), name (`title` variant at 17px), muted role line "Admin" or nothing; pull-to-refresh; loading spinner; empty state "No members yet."; error text.
- [ ] **Step 2: Add member modal** — form (Name, Email, Phone optional using `toE164('91', …)` when given; show the E.164 preview), submit → `add()`; on success swap to a result view: Card with name, email, phone, and the starting password in a large monospace-free `font-semibold text-[22px] tracking-[2px]` line; `Button "Share details"` → `Share.share({ message })` with a short message ("Hi Mary, here is your Prayer Warriors sign-in…"), `Button "Copy password" variant="secondary"` → `Clipboard.setStringAsync`, and a muted note "This password is shown only once. The member can change it with Forgot password."; "Done" → `router.back()`.
- [ ] **Step 3: Root layout** — inside the `gate === 'app'` `Stack.Protected`, add `<Stack.Screen name="add-member" options={{ presentation: 'modal', headerShown: true, title: 'Add member', …same header styling as profile }} />`.
- [ ] **Step 4: Verify** — typecheck, tests, web export; on web signed in as Shiny: Community shows Shiny with Admin; Add member with a throwaway email returns a password; the new member appears; sign in as that member on web sees the list but no button; then remove the throwaway (master key: user, GroupMember, role relation). Commit `feat(members): Community list and admin Add member flow`.

- [ ] **Step 5:** Merge per finishing-a-development-branch.

## Self-review

- Spec coverage: rules 1–7 (T1/T2), list/sort/isAdmin (T3), screens + share/copy + once-only note (T4), live verification (T2/T4).
- Placeholders: none beyond described UI composition in T4, which follows the existing screen patterns.
- Types: `NewMember`/`AddedMember` identical in service, hook, and modal; `MESSAGES` strings match the spec.
