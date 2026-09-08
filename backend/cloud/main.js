'use strict';

const crypto = require('crypto');
const { createMemberHandlers } = require('./members');
const { createPrayerHandlers } = require('./prayer');
const { createResourceHandlers } = require('./resources');

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
    groupId: group ? group.id : null,
    authorId: author ? author.id : null,
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

// ---------- resources ----------

function resourceDto(obj) {
  const group = obj.get('group');
  const createdBy = obj.get('createdBy');
  return {
    id: obj.id,
    groupId: group ? group.id : null,
    createdById: createdBy ? createdBy.id : null,
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

// ---------- cloud functions ----------

const memberHandlers = createMemberHandlers({ memberships, users, roles, generatePassword });
const prayerHandlers = createPrayerHandlers({ memberships, requests, responses });
const resourceHandlers = createResourceHandlers({ memberships, resources });

Parse.Cloud.define('addMember', (request) =>
  memberHandlers.addMember(request.params, { callerId: callerId(request) }),
);
Parse.Cloud.define('createPrayerRequest', (request) =>
  prayerHandlers.createPrayerRequest(request.params, { callerId: callerId(request) }),
);
Parse.Cloud.define('togglePraying', (request) =>
  prayerHandlers.togglePraying(request.params, { callerId: callerId(request) }),
);
Parse.Cloud.define('markAnswered', (request) =>
  prayerHandlers.markAnswered(request.params, { callerId: callerId(request) }),
);
Parse.Cloud.define('createResource', (request) =>
  resourceHandlers.createResource(request.params, { callerId: callerId(request) }),
);
Parse.Cloud.define('deleteResource', (request) =>
  resourceHandlers.deleteResource(request.params, { callerId: callerId(request) }),
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
