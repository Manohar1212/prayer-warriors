'use strict';

const crypto = require('crypto');
const { createMemberHandlers } = require('./members');
const { createPrayerHandlers } = require('./prayer');
const { createResourceHandlers } = require('./resources');
const { createFinanceHandlers } = require('./finance');
const { createCallHandlers } = require('./calls');
const { createLiveKitTokens } = require('./livekit');
const { createNotifier, createNotificationHandlers } = require('./notifications');

function pointer(className, id) {
  return { __type: 'Pointer', className, objectId: id };
}

function groupReadAcl(groupId, ownerId) {
  const acl = new Parse.ACL();
  if (ownerId) {
    acl.setReadAccess(ownerId, true);
    acl.setWriteAccess(ownerId, true);
  }
  acl.setRoleReadAccess(`group:${groupId}:member`, true);
  acl.setRoleReadAccess(`group:${groupId}:admin`, true);
  return acl;
}

/** Id of a pointer whether it is a decoded Parse.Object or the raw pointer we just set. */
function refId(value) {
  if (!value) return null;
  return value.id || value.objectId || null;
}

function callerId(request) {
  return request.user ? request.user.id : null;
}

// ---------- memberships ----------

const memberships = {
  async findGroupId(userId) {
    const row = await new Parse.Query('GroupMember')
      .equalTo('user', pointer('_User', userId))
      .equalTo('status', 'active')
      .first({ useMasterKey: true });
    return row ? row.get('group').id : null;
  },
  async isActiveMember(userId, groupId) {
    const row = await new Parse.Query('GroupMember')
      .equalTo('user', pointer('_User', userId))
      .equalTo('group', pointer('Group', groupId))
      .equalTo('status', 'active')
      .first({ useMasterKey: true });
    return Boolean(row);
  },
  async findAdminGroupId(userId) {
    const row = await new Parse.Query('GroupMember')
      .equalTo('user', pointer('_User', userId))
      .equalTo('role', 'admin')
      .equalTo('status', 'active')
      .first({ useMasterKey: true });
    return row ? row.get('group').id : null;
  },
  async listActiveUserIds(groupId) {
    const rows = await new Parse.Query('GroupMember')
      .equalTo('group', pointer('Group', groupId))
      .equalTo('status', 'active')
      .limit(1000)
      .find({ useMasterKey: true });
    return rows.map((row) => refId(row.get('user'))).filter(Boolean);
  },
  async create({ groupId, userId, role }) {
    const row = new Parse.Object('GroupMember');
    row.set('group', pointer('Group', groupId));
    row.set('user', pointer('_User', userId));
    row.set('role', role);
    row.set('status', 'active');
    row.set('joinedAt', new Date());
    row.setACL(groupReadAcl(groupId));
    await row.save(null, { useMasterKey: true });
    await makeProfileVisibleToGroup(groupId, userId);
    return { id: row.id };
  },
};

/** Joining a group lets its members read your profile (name, avatar); email/phone stay protected. */
async function makeProfileVisibleToGroup(groupId, userId) {
  const user = await new Parse.Query(Parse.User).get(userId, { useMasterKey: true });
  user.setACL(groupReadAcl(groupId, userId));
  await user.save(null, { useMasterKey: true });
}

// ---------- users / roles ----------

const users = {
  async findByEmail(email) {
    return new Parse.Query(Parse.User).equalTo('email', email).first({ useMasterKey: true });
  },
  async create(fields) {
    const user = new Parse.User();
    Object.entries(fields).forEach(([key, value]) => user.set(key, value));
    await user.save(null, { useMasterKey: true });
    return { id: user.id };
  },
  async findMany(ids) {
    if (!ids.length) return [];
    const rows = await new Parse.Query(Parse.User).containedIn('objectId', ids).limit(1000).find({ useMasterKey: true });
    return rows.map((u) => ({ id: u.id, displayName: u.get('displayName') || null, notificationPrefs: u.get('notificationPrefs') || null }));
  },
  async getPrefs(userId) {
    const user = await new Parse.Query(Parse.User).get(userId, { useMasterKey: true }).catch(() => null);
    return user ? user.get('notificationPrefs') || null : null;
  },
  async setPrefs(userId, prefs) {
    const user = await new Parse.Query(Parse.User).get(userId, { useMasterKey: true });
    user.set('notificationPrefs', prefs);
    await user.save(null, { useMasterKey: true });
    return prefs;
  },
};

const roles = {
  async addUser(groupId, roleName, userId) {
    const role = await new Parse.Query(Parse.Role)
      .equalTo('name', `group:${groupId}:${roleName}`)
      .first({ useMasterKey: true });
    if (!role) throw new Error(`Role group:${groupId}:${roleName} is missing.`);
    role.getUsers().add(Parse.User.createWithoutData(userId));
    await role.save(null, { useMasterKey: true });
  },
};

const generatePassword = () => crypto.randomBytes(9).toString('base64url').slice(0, 12);

// ---------- prayer requests ----------

function requestDto(obj) {
  const group = obj.get('group');
  const author = obj.get('author');
  const answeredAt = obj.get('answeredAt');
  return {
    id: obj.id,
    groupId: refId(group),
    authorId: refId(author),
    title: obj.get('title'),
    description: obj.get('description') || '',
    category: obj.get('category'),
    urgency: obj.get('urgency'),
    status: obj.get('status'),
    prayingCount: obj.get('prayingCount') || 0,
    createdAt: obj.createdAt ? obj.createdAt.toISOString() : null,
    answeredAt: answeredAt ? answeredAt.toISOString() : null,
    testimony: obj.get('testimony') || null,
  };
}

const requests = {
  async create({ groupId, authorId, ...fields }) {
    const obj = new Parse.Object('PrayerRequest');
    obj.set('group', pointer('Group', groupId));
    obj.set('author', pointer('_User', authorId));
    Object.entries(fields).forEach(([key, value]) => obj.set(key, value));
    obj.setACL(groupReadAcl(groupId));
    await obj.save(null, { useMasterKey: true });
    return requestDto(obj);
  },
  async get(id) {
    const obj = await new Parse.Query('PrayerRequest').get(id, { useMasterKey: true }).catch(() => null);
    return obj ? requestDto(obj) : null;
  },
  async update(id, patch) {
    const obj = await new Parse.Query('PrayerRequest').get(id, { useMasterKey: true });
    Object.entries(patch).forEach(([key, value]) => {
      if (value === null) obj.unset(key);
      else obj.set(key, value);
    });
    await obj.save(null, { useMasterKey: true });
    return requestDto(obj);
  },
  async incrementPraying(id, delta) {
    const obj = await new Parse.Query('PrayerRequest').get(id, { useMasterKey: true });
    obj.increment('prayingCount', delta);
    await obj.save(null, { useMasterKey: true });
    return Math.max(0, obj.get('prayingCount') || 0);
  },
};

const responses = {
  async find(requestId, userId) {
    const row = await new Parse.Query('PrayerResponse')
      .equalTo('prayerRequest', pointer('PrayerRequest', requestId))
      .equalTo('user', pointer('_User', userId))
      .first({ useMasterKey: true });
    return row ? { id: row.id } : null;
  },
  async create(requestId, userId, groupId) {
    const row = new Parse.Object('PrayerResponse');
    row.set('prayerRequest', pointer('PrayerRequest', requestId));
    row.set('user', pointer('_User', userId));
    row.set('responseType', 'praying');
    row.setACL(groupReadAcl(groupId));
    await row.save(null, { useMasterKey: true });
    return { id: row.id };
  },
  async remove(id) {
    const row = await new Parse.Query('PrayerResponse').get(id, { useMasterKey: true });
    await row.destroy({ useMasterKey: true });
  },
};

const prayerComments = {
  async create({ requestId, userId, groupId, body }) {
    const row = new Parse.Object('PrayerComment');
    row.set('prayerRequest', pointer('PrayerRequest', requestId));
    row.set('user', pointer('_User', userId));
    row.set('body', body);
    row.setACL(groupReadAcl(groupId));
    await row.save(null, { useMasterKey: true });
    return { id: row.id, body, userId, createdAt: row.createdAt ? row.createdAt.toISOString() : null };
  },
};

// ---------- resources ----------

function resourceDto(obj) {
  const group = obj.get('group');
  const createdBy = obj.get('createdBy');
  return {
    id: obj.id,
    groupId: refId(group),
    createdById: refId(createdBy),
    type: obj.get('type'),
    title: obj.get('title'),
    body: obj.get('body') || '',
    reference: obj.get('reference') || '',
    url: obj.get('url') || '',
    note: obj.get('note') || '',
    createdAt: obj.createdAt ? obj.createdAt.toISOString() : null,
  };
}

const resources = {
  async create({ groupId, createdById, ...fields }) {
    const obj = new Parse.Object('Resource');
    obj.set('group', pointer('Group', groupId));
    obj.set('createdBy', pointer('_User', createdById));
    Object.entries(fields).forEach(([key, value]) => obj.set(key, value));
    obj.setACL(groupReadAcl(groupId));
    await obj.save(null, { useMasterKey: true });
    return resourceDto(obj);
  },
  async get(id) {
    const obj = await new Parse.Query('Resource').get(id, { useMasterKey: true }).catch(() => null);
    return obj ? resourceDto(obj) : null;
  },
  async remove(id) {
    const obj = await new Parse.Query('Resource').get(id, { useMasterKey: true });
    await obj.destroy({ useMasterKey: true });
  },
};

// ---------- finance ----------

function iso(date) {
  return date instanceof Date ? date.toISOString() : null;
}

function contributionDto(obj) {
  const group = obj.get('group');
  const member = obj.get('member');
  const createdBy = obj.get('createdBy');
  const updatedBy = obj.get('updatedBy');
  return {
    id: obj.id,
    groupId: refId(group),
    memberId: refId(member),
    amountPaise: obj.get('amountPaise') || 0,
    transactionDate: iso(obj.get('transactionDate')),
    paymentMethod: obj.get('paymentMethod'),
    reference: obj.get('reference') || '',
    note: obj.get('note') || '',
    createdById: refId(createdBy),
    updatedById: refId(updatedBy),
    createdAt: iso(obj.createdAt),
  };
}

function expenseDto(obj) {
  const group = obj.get('group');
  const createdBy = obj.get('createdBy');
  const updatedBy = obj.get('updatedBy');
  return {
    id: obj.id,
    groupId: refId(group),
    category: obj.get('category'),
    amountPaise: obj.get('amountPaise') || 0,
    paidTo: obj.get('paidTo') || '',
    description: obj.get('description') || '',
    transactionDate: iso(obj.get('transactionDate')),
    createdById: refId(createdBy),
    updatedById: refId(updatedBy),
    createdAt: iso(obj.createdAt),
  };
}

const POINTER_FIELDS = { memberId: ['member', '_User'], createdById: ['createdBy', '_User'], updatedById: ['updatedBy', '_User'] };

function applyFields(obj, fields) {
  Object.entries(fields).forEach(([key, value]) => {
    const p = POINTER_FIELDS[key];
    if (p) obj.set(p[0], pointer(p[1], value));
    else obj.set(key, value);
  });
}

async function fetchRow(className, id) {
  return new Parse.Query(className).get(id, { useMasterKey: true }).catch(() => null);
}

function ledgerRepo(className, toDto) {
  return {
    async create({ groupId, ...fields }) {
      const obj = new Parse.Object(className);
      obj.set('group', pointer('Group', groupId));
      applyFields(obj, fields);
      obj.setACL(groupReadAcl(groupId));
      await obj.save(null, { useMasterKey: true });
      return toDto(obj);
    },
    async get(id) {
      const obj = await fetchRow(className, id);
      return obj ? toDto(obj) : null;
    },
    async update(id, patch) {
      const obj = await new Parse.Query(className).get(id, { useMasterKey: true });
      applyFields(obj, patch);
      await obj.save(null, { useMasterKey: true });
      return toDto(obj);
    },
    async remove(id) {
      const obj = await new Parse.Query(className).get(id, { useMasterKey: true });
      await obj.destroy({ useMasterKey: true });
    },
  };
}

const contributionsRepo = ledgerRepo('Contribution', contributionDto);
const expensesRepo = ledgerRepo('Expense', expenseDto);

const ledger = {
  createContribution: (f) => contributionsRepo.create(f),
  getContribution: (id) => contributionsRepo.get(id),
  updateContribution: (id, p) => contributionsRepo.update(id, p),
  deleteContribution: (id) => contributionsRepo.remove(id),
  createExpense: (f) => expensesRepo.create(f),
  getExpense: (id) => expensesRepo.get(id),
  updateExpense: (id, p) => expensesRepo.update(id, p),
  deleteExpense: (id) => expensesRepo.remove(id),
};

const audit = {
  async record({ groupId, userId, entityType, entityId, action, oldValues, newValues, reason }) {
    const obj = new Parse.Object('FinancialAuditLog');
    obj.set('group', pointer('Group', groupId));
    obj.set('user', pointer('_User', userId));
    obj.set('entityType', entityType);
    obj.set('entityId', entityId);
    obj.set('action', action);
    if (oldValues) obj.set('oldValues', oldValues);
    if (newValues) obj.set('newValues', newValues);
    if (reason) obj.set('reason', reason);
    const acl = new Parse.ACL();
    acl.setRoleReadAccess(`group:${groupId}:admin`, true);
    obj.setACL(acl);
    await obj.save(null, { useMasterKey: true });
  },
};

// ---------- calls ----------

function callDto(obj) {
  const group = obj.get('group');
  const createdBy = obj.get('createdBy');
  return {
    id: obj.id,
    groupId: refId(group),
    title: obj.get('title'),
    scheduledAt: iso(obj.get('scheduledAt')),
    roomName: obj.get('roomName') || '',
    status: obj.get('status'),
    startedAt: iso(obj.get('startedAt')),
    endedAt: iso(obj.get('endedAt')),
    createdById: refId(createdBy),
  };
}

const callsRepo = {
  async create({ groupId, createdById, ...fields }) {
    const obj = new Parse.Object('Call');
    obj.set('group', pointer('Group', groupId));
    obj.set('createdBy', pointer('_User', createdById));
    Object.entries(fields).forEach(([key, value]) => obj.set(key, value));
    obj.setACL(groupReadAcl(groupId));
    await obj.save(null, { useMasterKey: true });
    obj.set('roomName', `pw-${groupId}-${obj.id}`);
    await obj.save(null, { useMasterKey: true });
    return callDto(obj);
  },
  async get(id) {
    const obj = await fetchRow('Call', id);
    return obj ? callDto(obj) : null;
  },
  async update(id, patch) {
    const obj = await new Parse.Query('Call').get(id, { useMasterKey: true });
    Object.entries(patch).forEach(([key, value]) => obj.set(key, value));
    await obj.save(null, { useMasterKey: true });
    return callDto(obj);
  },
};

const participantsRepo = {
  async upsertJoined(callId, userId, groupId) {
    let row = await new Parse.Query('CallParticipant')
      .equalTo('call', pointer('Call', callId))
      .equalTo('user', pointer('_User', userId))
      .first({ useMasterKey: true });
    if (!row) {
      row = new Parse.Object('CallParticipant');
      row.set('call', pointer('Call', callId));
      row.set('user', pointer('_User', userId));
      row.setACL(groupReadAcl(groupId));
    }
    row.set('joinedAt', new Date());
    row.unset('leftAt');
    await row.save(null, { useMasterKey: true });
  },
  async markLeft(callId, userId, when) {
    const row = await new Parse.Query('CallParticipant')
      .equalTo('call', pointer('Call', callId))
      .equalTo('user', pointer('_User', userId))
      .first({ useMasterKey: true });
    if (!row) return;
    row.set('leftAt', when);
    await row.save(null, { useMasterKey: true });
  },
};

const usersRepo = {
  async displayName(userId) {
    const user = await new Parse.Query(Parse.User).get(userId, { useMasterKey: true }).catch(() => null);
    return user ? user.get('displayName') : null;
  },
};

let liveKitPromise = null;
function liveKitTokens() {
  if (!liveKitPromise) {
    liveKitPromise = (async () => {
      const config = await Parse.Config.get({ useMasterKey: true });
      const url = config.get('LIVEKIT_URL');
      const apiKey = config.get('LIVEKIT_API_KEY');
      const apiSecret = config.get('LIVEKIT_API_SECRET');
      if (!url || !apiKey || !apiSecret) {
        // Not configured yet: don't cache, so keys added later are picked up without a redeploy.
        liveKitPromise = null;
        return null;
      }
      return createLiveKitTokens({ url, apiKey, apiSecret });
    })().catch((err) => {
      liveKitPromise = null;
      throw err;
    });
  }
  return liveKitPromise;
}

async function callHandlers() {
  return createCallHandlers({ memberships, calls: callsRepo, participants: participantsRepo, users: usersRepo, tokens: await liveKitTokens() });
}

// ---------- notifications ----------

const inbox = {
  async createMany(rows) {
    const objects = rows.map((row) => {
      const obj = new Parse.Object('Notification');
      obj.set('group', pointer('Group', row.groupId));
      obj.set('recipient', pointer('_User', row.recipientId));
      if (row.actorId) obj.set('actor', pointer('_User', row.actorId));
      obj.set('type', row.type);
      obj.set('title', row.title);
      obj.set('body', row.body);
      obj.set('route', row.route);
      const acl = new Parse.ACL();
      acl.setReadAccess(row.recipientId, true);
      obj.setACL(acl);
      return obj;
    });
    await Parse.Object.saveAll(objects, { useMasterKey: true });
    return objects.map((obj) => ({ id: obj.id }));
  },
  async markRead(userId, ids) {
    const rows = await new Parse.Query('Notification')
      .equalTo('recipient', pointer('_User', userId))
      .containedIn('objectId', ids)
      .doesNotExist('readAt')
      .limit(1000)
      .find({ useMasterKey: true });
    const when = new Date();
    rows.forEach((row) => row.set('readAt', when));
    await Parse.Object.saveAll(rows, { useMasterKey: true });
    return rows.length;
  },
  async markAllRead(userId) {
    const rows = await new Parse.Query('Notification')
      .equalTo('recipient', pointer('_User', userId))
      .doesNotExist('readAt')
      .limit(1000)
      .find({ useMasterKey: true });
    const when = new Date();
    rows.forEach((row) => row.set('readAt', when));
    await Parse.Object.saveAll(rows, { useMasterKey: true });
    return rows.length;
  },
};

const pushTokens = {
  async upsert({ userId, token, platform, deviceName }) {
    let row = await new Parse.Query('PushToken').equalTo('token', token).first({ useMasterKey: true });
    if (!row) {
      row = new Parse.Object('PushToken');
      row.set('token', token);
      row.setACL(new Parse.ACL());
    }
    row.set('user', pointer('_User', userId));
    row.set('platform', platform);
    row.set('deviceName', deviceName);
    await row.save(null, { useMasterKey: true });
  },
  async remove(token) {
    const rows = await new Parse.Query('PushToken').equalTo('token', token).find({ useMasterKey: true });
    await Parse.Object.destroyAll(rows, { useMasterKey: true });
  },
  async removeForUser(userId, token) {
    const rows = await new Parse.Query('PushToken')
      .equalTo('token', token)
      .equalTo('user', pointer('_User', userId))
      .find({ useMasterKey: true });
    await Parse.Object.destroyAll(rows, { useMasterKey: true });
  },
  async forUsers(userIds) {
    if (!userIds.length) return [];
    const rows = await new Parse.Query('PushToken')
      .containedIn('user', userIds.map((id) => pointer('_User', id)))
      .limit(1000)
      .find({ useMasterKey: true });
    return rows.map((row) => ({ userId: refId(row.get('user')), token: row.get('token') }));
  },
};

/** POST JSON with whatever HTTP client this Parse Server exposes (global fetch on Node 18+, else https). */
async function postJson(url, body) {
  const payload = JSON.stringify(body);
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (typeof fetch === 'function') {
    const res = await fetch(url, { method: 'POST', headers, body: payload });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    return JSON.parse(text);
  }
  const https = require('https');
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'POST', headers: { ...headers, 'Content-Length': Buffer.byteLength(payload) } }, (res) => {
      let text = '';
      res.on('data', (chunk) => (text += chunk));
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) return reject(new Error(`HTTP ${res.statusCode}: ${text.slice(0, 200)}`));
        try {
          resolve(JSON.parse(text));
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.end(payload);
  });
}

/** Expo's push service; free, no credentials needed for the request itself. */
const push = {
  async send(messages) {
    const data = await postJson('https://exp.host/--/api/v2/push/send', messages);
    return data && Array.isArray(data.data) ? data.data : [];
  },
};

const notifier = createNotifier({ members: memberships, users, inbox, tokens: pushTokens, push });
const notificationHandlers = createNotificationHandlers({ memberships, inbox, tokens: pushTokens, users });

/** Runs a handler, then hands its result to `after` for notifications without affecting the response. */
function withNotify(handler, after) {
  return async (request) => {
    const context = { callerId: callerId(request) };
    const result = await handler(request.params, context);
    await after(result, request.params, context).catch((err) => console.error(`notify hook failed: ${err && err.message}`));
    return result;
  };
}

// ---------- cloud functions ----------

const memberHandlers = createMemberHandlers({ memberships, users, roles, generatePassword });
const prayerHandlers = createPrayerHandlers({ memberships, requests, responses, comments: prayerComments });
const resourceHandlers = createResourceHandlers({ memberships, resources });
const financeHandlers = createFinanceHandlers({ memberships, ledger, audit });

Parse.Cloud.define('addMember', (request) =>
  memberHandlers.addMember(request.params, { callerId: callerId(request) }),
);
Parse.Cloud.define(
  'createPrayerRequest',
  withNotify(prayerHandlers.createPrayerRequest, (dto, _params, { callerId: actorId }) =>
    notifier.notify({ type: 'prayerRequest', groupId: dto.groupId, actorId, requestId: dto.id, title: dto.title }),
  ),
);
Parse.Cloud.define(
  'togglePraying',
  withNotify(prayerHandlers.togglePraying, async (result, params, { callerId: actorId }) => {
    if (!result.praying) return;
    const dto = await requests.get(params.requestId);
    if (dto) await notifier.notify({ type: 'praying', groupId: dto.groupId, actorId, requestId: dto.id, title: dto.title, authorId: dto.authorId });
  }),
);
Parse.Cloud.define(
  'markAnswered',
  withNotify(prayerHandlers.markAnswered, (dto, _params, { callerId: actorId }) =>
    notifier.notify({ type: 'answered', groupId: dto.groupId, actorId, requestId: dto.id, title: dto.title }),
  ),
);
Parse.Cloud.define(
  'addPrayerComment',
  withNotify(prayerHandlers.addComment, (dto, _params, { callerId: actorId }) =>
    notifier.notify({ type: 'comment', groupId: dto.groupId, actorId, requestId: dto.requestId, title: dto.requestTitle, body: dto.body, authorId: dto.requestAuthorId }),
  ),
);
Parse.Cloud.define(
  'createResource',
  withNotify(resourceHandlers.createResource, (dto, _params, { callerId: actorId }) =>
    notifier.notify({ type: 'resource', groupId: dto.groupId, actorId, resourceId: dto.id, resourceType: dto.type, title: dto.title }),
  ),
);
Parse.Cloud.define('deleteResource', (request) =>
  resourceHandlers.deleteResource(request.params, { callerId: callerId(request) }),
);
Parse.Cloud.define(
  'addContribution',
  withNotify(financeHandlers.addContribution, (dto, _params, { callerId: actorId }) =>
    notifier.notify({ type: 'contribution', groupId: dto.groupId, actorId, memberId: dto.memberId, amountPaise: dto.amountPaise, transactionDate: dto.transactionDate }),
  ),
);
Parse.Cloud.define(
  'addExpense',
  withNotify(financeHandlers.addExpense, (dto, _params, { callerId: actorId }) =>
    notifier.notify({ type: 'expense', groupId: dto.groupId, actorId, category: dto.category, amountPaise: dto.amountPaise }),
  ),
);
['updateContribution', 'deleteContribution', 'updateExpense', 'deleteExpense'].forEach((name) =>
  Parse.Cloud.define(name, (request) => financeHandlers[name](request.params, { callerId: callerId(request) })),
);
Parse.Cloud.define(
  'scheduleCall',
  withNotify(
    async (params, context) => (await callHandlers()).scheduleCall(params, context),
    (dto, _params, { callerId: actorId }) =>
      notifier.notify({ type: 'callScheduled', groupId: dto.groupId, actorId, callId: dto.id, title: dto.title, scheduledAt: dto.scheduledAt }),
  ),
);
Parse.Cloud.define(
  'cancelCall',
  withNotify(
    async (params, context) => (await callHandlers()).cancelCall(params, context),
    (dto, _params, { callerId: actorId }) =>
      notifier.notify({ type: 'callCancelled', groupId: dto.groupId, actorId, callId: dto.id, title: dto.title }),
  ),
);
Parse.Cloud.define('joinCall', async (request) => {
  const context = { callerId: callerId(request) };
  const before = request.params && request.params.callId ? await callsRepo.get(request.params.callId) : null;
  const result = await (await callHandlers()).joinCall(request.params, context);
  if (before && before.status === 'scheduled') {
    await notifier.notify({ type: 'callStarted', groupId: before.groupId, actorId: context.callerId, callId: before.id, title: before.title });
  }
  return result;
});
['endCall', 'leaveCall'].forEach((name) =>
  Parse.Cloud.define(name, async (request) => (await callHandlers())[name](request.params, { callerId: callerId(request) })),
);
['registerPushToken', 'unregisterPushToken', 'markNotificationsRead', 'markAllNotificationsRead', 'updateNotificationPrefs'].forEach((name) =>
  Parse.Cloud.define(name, (request) => notificationHandlers[name](request.params, { callerId: callerId(request) })),
);
Parse.Cloud.define('ping', () => 'pong');

// ---------- triggers ----------

// A phone number belongs to at most one member.
Parse.Cloud.beforeSave(Parse.User, async (request) => {
  const user = request.object;
  const phone = user.get('phone');
  if (!phone || !user.dirty('phone')) return;
  const clash = await new Parse.Query(Parse.User)
    .equalTo('phone', phone)
    .notEqualTo('objectId', user.id ?? '')
    .first({ useMasterKey: true });
  if (clash) {
    throw new Parse.Error(Parse.Error.DUPLICATE_VALUE, 'That phone number is already registered.');
  }
});

// Journal entries belong to whoever saves them and are private to that person.
Parse.Cloud.beforeSave('PrayerJournalEntry', (request) => {
  if (request.master) return;
  if (!request.user) throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'Sign in to keep a journal.');
  const entry = request.object;
  entry.set('user', request.user);
  const acl = new Parse.ACL(request.user);
  entry.setACL(acl);
  const title = (entry.get('title') || '').trim();
  if (!title) throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'Give the entry a short title.');
  entry.set('title', title.slice(0, 120));
  entry.set('body', (entry.get('body') || '').slice(0, 4000));
});
