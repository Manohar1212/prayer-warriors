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
    notificationPrefs: { type: 'Object' },
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

const prayerRequestSchema = {
  className: 'PrayerRequest',
  fields: {
    group: { type: 'Pointer', targetClass: 'Group', required: true },
    author: { type: 'Pointer', targetClass: '_User', required: true },
    title: { type: 'String', required: true },
    description: { type: 'String' },
    category: { type: 'String', required: true },
    urgency: { type: 'String', required: true, defaultValue: 'normal' },
    status: { type: 'String', required: true, defaultValue: 'active' },
    prayingCount: { type: 'Number', defaultValue: 0 },
    answeredAt: { type: 'Date' },
    testimony: { type: 'String' },
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

const prayerResponseSchema = {
  className: 'PrayerResponse',
  fields: {
    prayerRequest: { type: 'Pointer', targetClass: 'PrayerRequest', required: true },
    user: { type: 'Pointer', targetClass: '_User', required: true },
    responseType: { type: 'String', required: true, defaultValue: 'praying' },
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

const journalSchema = {
  className: 'PrayerJournalEntry',
  fields: {
    user: { type: 'Pointer', targetClass: '_User', required: true },
    title: { type: 'String', required: true },
    body: { type: 'String' },
    category: { type: 'String' },
    answered: { type: 'Boolean', defaultValue: false },
    answeredAt: { type: 'Date' },
  },
  classLevelPermissions: {
    find: authenticated,
    get: authenticated,
    count: authenticated,
    create: authenticated, // beforeSave pins the owner and an owner-only ACL
    update: authenticated,
    delete: authenticated,
    addField: masterOnly,
    protectedFields: {},
  },
};

const resourceSchema = {
  className: 'Resource',
  fields: {
    group: { type: 'Pointer', targetClass: 'Group', required: true },
    createdBy: { type: 'Pointer', targetClass: '_User', required: true },
    type: { type: 'String', required: true },
    title: { type: 'String', required: true },
    body: { type: 'String' },
    reference: { type: 'String' },
    url: { type: 'String' },
    note: { type: 'String' },
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

const contributionSchema = {
  className: 'Contribution',
  fields: {
    group: { type: 'Pointer', targetClass: 'Group', required: true },
    member: { type: 'Pointer', targetClass: '_User', required: true },
    amountPaise: { type: 'Number', required: true },
    transactionDate: { type: 'Date', required: true },
    paymentMethod: { type: 'String', required: true },
    reference: { type: 'String' },
    note: { type: 'String' },
    createdBy: { type: 'Pointer', targetClass: '_User' },
    updatedBy: { type: 'Pointer', targetClass: '_User' },
  },
  classLevelPermissions: {
    find: authenticated, get: authenticated, count: authenticated,
    create: masterOnly, update: masterOnly, delete: masterOnly, addField: masterOnly, protectedFields: {},
  },
};

const expenseSchema = {
  className: 'Expense',
  fields: {
    group: { type: 'Pointer', targetClass: 'Group', required: true },
    category: { type: 'String', required: true },
    amountPaise: { type: 'Number', required: true },
    paidTo: { type: 'String', required: true },
    description: { type: 'String' },
    transactionDate: { type: 'Date', required: true },
    createdBy: { type: 'Pointer', targetClass: '_User' },
    updatedBy: { type: 'Pointer', targetClass: '_User' },
  },
  classLevelPermissions: {
    find: authenticated, get: authenticated, count: authenticated,
    create: masterOnly, update: masterOnly, delete: masterOnly, addField: masterOnly, protectedFields: {},
  },
};

const auditSchema = {
  className: 'FinancialAuditLog',
  fields: {
    group: { type: 'Pointer', targetClass: 'Group', required: true },
    user: { type: 'Pointer', targetClass: '_User', required: true },
    entityType: { type: 'String', required: true },
    entityId: { type: 'String', required: true },
    action: { type: 'String', required: true },
    oldValues: { type: 'Object' },
    newValues: { type: 'Object' },
    reason: { type: 'String' },
  },
  classLevelPermissions: {
    find: authenticated, get: authenticated, count: authenticated,
    create: masterOnly, update: masterOnly, delete: masterOnly, addField: masterOnly, protectedFields: {},
  },
};

const callSchema = {
  className: 'Call',
  fields: {
    group: { type: 'Pointer', targetClass: 'Group', required: true },
    title: { type: 'String', required: true },
    scheduledAt: { type: 'Date', required: true },
    roomName: { type: 'String' },
    status: { type: 'String', required: true, defaultValue: 'scheduled' },
    startedAt: { type: 'Date' },
    endedAt: { type: 'Date' },
    createdBy: { type: 'Pointer', targetClass: '_User' },
  },
  classLevelPermissions: {
    find: authenticated, get: authenticated, count: authenticated,
    create: masterOnly, update: masterOnly, delete: masterOnly, addField: masterOnly, protectedFields: {},
  },
};

const callParticipantSchema = {
  className: 'CallParticipant',
  fields: {
    call: { type: 'Pointer', targetClass: 'Call', required: true },
    user: { type: 'Pointer', targetClass: '_User', required: true },
    joinedAt: { type: 'Date' },
    leftAt: { type: 'Date' },
  },
  classLevelPermissions: {
    find: authenticated, get: authenticated, count: authenticated,
    create: masterOnly, update: masterOnly, delete: masterOnly, addField: masterOnly, protectedFields: {},
  },
};

const prayerCommentSchema = {
  className: 'PrayerComment',
  fields: {
    prayerRequest: { type: 'Pointer', targetClass: 'PrayerRequest', required: true },
    user: { type: 'Pointer', targetClass: '_User', required: true },
    body: { type: 'String', required: true },
  },
  classLevelPermissions: {
    find: authenticated, get: authenticated, count: authenticated,
    create: masterOnly, update: masterOnly, delete: masterOnly, addField: masterOnly, protectedFields: {},
  },
};

const prayerPointSchema = {
  className: 'PrayerPoint',
  fields: {
    group: { type: 'Pointer', targetClass: 'Group', required: true },
    title: { type: 'String', required: true },
    order: { type: 'Number', defaultValue: 0 },
    active: { type: 'Boolean', defaultValue: true },
    answeredAt: { type: 'Date' },
    testimony: { type: 'String' },
    request: { type: 'Pointer', targetClass: 'PrayerRequest' },
  },
  classLevelPermissions: {
    find: authenticated, get: authenticated, count: authenticated,
    create: masterOnly, update: masterOnly, delete: masterOnly, addField: masterOnly, protectedFields: {},
  },
};

const prayerPointClaimSchema = {
  className: 'PrayerPointClaim',
  fields: {
    group: { type: 'Pointer', targetClass: 'Group', required: true },
    prayerPoint: { type: 'Pointer', targetClass: 'PrayerPoint', required: true },
    user: { type: 'Pointer', targetClass: '_User', required: true },
    month: { type: 'String', required: true },
    doneAt: { type: 'Date' },
  },
  classLevelPermissions: {
    find: authenticated, get: authenticated, count: authenticated,
    create: masterOnly, update: masterOnly, delete: masterOnly, addField: masterOnly, protectedFields: {},
  },
};

const notificationSchema = {
  className: 'Notification',
  fields: {
    group: { type: 'Pointer', targetClass: 'Group', required: true },
    recipient: { type: 'Pointer', targetClass: '_User', required: true },
    actor: { type: 'Pointer', targetClass: '_User' },
    type: { type: 'String', required: true },
    title: { type: 'String', required: true },
    body: { type: 'String' },
    route: { type: 'String' },
    readAt: { type: 'Date' },
  },
  classLevelPermissions: {
    find: authenticated, get: authenticated, count: authenticated,
    create: masterOnly, update: masterOnly, delete: masterOnly, addField: masterOnly, protectedFields: {},
  },
};

const pushTokenSchema = {
  className: 'PushToken',
  fields: {
    user: { type: 'Pointer', targetClass: '_User', required: true },
    token: { type: 'String', required: true },
    platform: { type: 'String' },
    deviceName: { type: 'String' },
  },
  classLevelPermissions: {
    find: masterOnly, get: masterOnly, count: masterOnly,
    create: masterOnly, update: masterOnly, delete: masterOnly, addField: masterOnly, protectedFields: {},
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
await upsertSchema(prayerRequestSchema);
await upsertSchema(prayerResponseSchema);
await upsertSchema(prayerCommentSchema);
await upsertSchema(prayerPointSchema);
await upsertSchema(prayerPointClaimSchema);
await upsertSchema(journalSchema);
await upsertSchema(resourceSchema);
await upsertSchema(contributionSchema);
await upsertSchema(expenseSchema);
await upsertSchema(notificationSchema);
await upsertSchema(pushTokenSchema);
await upsertSchema(auditSchema);
await upsertSchema(callSchema);
await upsertSchema(callParticipantSchema);

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

async function ensureLiveKitConfig() {
  const params = {
    LIVEKIT_URL: process.env.LIVEKIT_URL,
    LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
  };
  if (Object.values(params).some((v) => !v)) {
    console.log('· skipping LiveKit config (LIVEKIT_* not set)');
    return;
  }
  const masterKeyOnly = Object.fromEntries(Object.keys(params).map((k) => [k, true]));
  const res = await api('PUT', '/config', { params, masterKeyOnly });
  if (!res.ok) throw new Error(`config: ${JSON.stringify(res.data)}`);
  console.log('✓ LiveKit config (master key only)');
}

await ensureAdmin(groupId, memberRole, adminRole);
await ensureLiveKitConfig();

console.log(`\nDone. groupId=${groupId}`);
