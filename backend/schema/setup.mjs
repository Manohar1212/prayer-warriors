#!/usr/bin/env node
// Idempotent Back4App setup for Prayer Warriors Phase 1.
// Usage: PARSE_APP_ID=... PARSE_MASTER_KEY=... node backend/schema/setup.mjs
// Optional: PARSE_SERVER_URL, GROUP_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME

const serverUrl = process.env.PARSE_SERVER_URL ?? 'https://parseapi.back4app.com';
const appId = process.env.PARSE_APP_ID;
const masterKey = process.env.PARSE_MASTER_KEY;
const groupName = process.env.GROUP_NAME ?? 'Prayer Warriors';

if (!appId || !masterKey) {
  console.error('Set PARSE_APP_ID and PARSE_MASTER_KEY.');
  process.exit(1);
}

const headers = {
  'X-Parse-Application-Id': appId,
  'X-Parse-Master-Key': masterKey,
  'Content-Type': 'application/json',
};

async function api(method, path, body) {
  const res = await fetch(`${serverUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function upsertSchema(schema) {
  const path = `/schemas/${schema.className}`;
  let res = await api('POST', path, schema);
  if (!res.ok && res.status === 400) res = await api('PUT', path, schema);
  if (!res.ok) throw new Error(`${schema.className}: ${JSON.stringify(res.data)}`);
  console.log(`✓ schema ${schema.className}`);
}

const authenticated = { requiresAuthentication: true };
const masterOnly = {};

const userSchema = {
  className: '_User',
  fields: {
    displayName: { type: 'String' },
    phone: { type: 'String' },
    avatar: { type: 'File' },
  },
  classLevelPermissions: {
    find: authenticated,
    get: authenticated,
    count: authenticated,
    create: masterOnly, // no public signup
    update: authenticated, // ACL restricts to the row owner
    delete: masterOnly,
    addField: masterOnly,
    protectedFields: { '*': ['email', 'phone', 'authData', 'emailVerified'] },
  },
};

const groupSchema = {
  className: 'Group',
  fields: {
    name: { type: 'String', required: true },
    description: { type: 'String' },
    createdBy: { type: 'Pointer', targetClass: '_User' },
  },
  classLevelPermissions: {
    find: authenticated,
    get: authenticated,
    count: authenticated,
    create: masterOnly,
    update: masterOnly,
    delete: masterOnly,
    addField: masterOnly,
    protectedFields: {},
  },
};

const groupMemberSchema = {
  className: 'GroupMember',
  fields: {
    group: { type: 'Pointer', targetClass: 'Group', required: true },
    user: { type: 'Pointer', targetClass: '_User', required: true },
    role: { type: 'String', required: true }, // 'admin' | 'member'
    status: { type: 'String', required: true, defaultValue: 'active' }, // 'active' | 'inactive'
    joinedAt: { type: 'Date' },
  },
  classLevelPermissions: {
    find: authenticated,
    get: authenticated,
    count: authenticated,
    create: masterOnly,
    update: masterOnly,
    delete: masterOnly,
    addField: masterOnly,
    protectedFields: {},
  },
};

async function findOne(className, where) {
  const query = encodeURIComponent(JSON.stringify(where));
  const res = await api('GET', `/classes/${className}?limit=1&where=${query}`);
  if (!res.ok) throw new Error(`query ${className}: ${JSON.stringify(res.data)}`);
  return res.data.results[0] ?? null;
}

async function ensureRole(name, acl) {
  const existing = await findOne('_Role', { name });
  if (existing) return existing.objectId;
  const res = await api('POST', '/roles', { name, ACL: acl });
  if (!res.ok) throw new Error(`role ${name}: ${JSON.stringify(res.data)}`);
  console.log(`✓ role ${name}`);
  return res.data.objectId;
}

async function ensureGroup() {
  const existing = await findOne('Group', { name: groupName });
  if (existing) return existing.objectId;
  const res = await api('POST', '/classes/Group', { name: groupName });
  if (!res.ok) throw new Error(`group: ${JSON.stringify(res.data)}`);
  console.log(`✓ group "${groupName}"`);
  return res.data.objectId;
}

function pointer(className, objectId) {
  return { __type: 'Pointer', className, objectId };
}

async function ensureAdmin(groupId, memberRole, adminRole) {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('· skipping admin user (ADMIN_EMAIL/ADMIN_PASSWORD not set)');
    return;
  }
  const username = email.trim().toLowerCase();
  let user = await findOne('_User', { username });
  if (!user) {
    const res = await api('POST', '/users', {
      username,
      email: username,
      password,
      displayName: process.env.ADMIN_NAME ?? '',
    });
    if (!res.ok) throw new Error(`admin user: ${JSON.stringify(res.data)}`);
    user = res.data;
    console.log(`✓ admin user ${username}`);
  }
  const userPointer = pointer('_User', user.objectId);
  const addUsers = { users: { __op: 'AddRelation', objects: [userPointer] } };
  await api('PUT', `/roles/${adminRole}`, addUsers);
  await api('PUT', `/roles/${memberRole}`, addUsers);

  const groupPointer = pointer('Group', groupId);
  const membership = await findOne('GroupMember', { user: userPointer, group: groupPointer });
  if (!membership) {
    const res = await api('POST', '/classes/GroupMember', {
      group: groupPointer,
      user: userPointer,
      role: 'admin',
      status: 'active',
      joinedAt: { __type: 'Date', iso: new Date().toISOString() },
      ACL: {
        [`role:group:${groupId}:member`]: { read: true },
        [`role:group:${groupId}:admin`]: { read: true },
      },
    });
    if (!res.ok) throw new Error(`membership: ${JSON.stringify(res.data)}`);
    console.log('✓ admin membership');
  }
  // Group members may read the admin's profile; email/phone stay protected by CLP.
  await api('PUT', `/users/${user.objectId}`, {
    ACL: {
      [user.objectId]: { read: true, write: true },
      [`role:group:${groupId}:member`]: { read: true },
      [`role:group:${groupId}:admin`]: { read: true },
    },
  });
}

await upsertSchema(userSchema);
await upsertSchema(groupSchema);
await upsertSchema(groupMemberSchema);

const groupId = await ensureGroup();
const memberRoleName = `group:${groupId}:member`;
const adminRoleName = `group:${groupId}:admin`;
const roleAcl = { '*': { read: true } };
const memberRole = await ensureRole(memberRoleName, roleAcl);
const adminRole = await ensureRole(adminRoleName, roleAcl);

// Admins inherit member permissions: the member role contains the admin role as a child.
await api('PUT', `/roles/${memberRole}`, {
  roles: { __op: 'AddRelation', objects: [pointer('_Role', adminRole)] },
});

// Group is readable by members; writes stay master-key only until Cloud Code arrives in Phase 2.
await api('PUT', `/classes/Group/${groupId}`, {
  ACL: { [`role:${memberRoleName}`]: { read: true }, [`role:${adminRoleName}`]: { read: true } },
});

await ensureAdmin(groupId, memberRole, adminRole);

console.log(`\nDone. groupId=${groupId}`);
