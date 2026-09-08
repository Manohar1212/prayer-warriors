'use strict';

const crypto = require('crypto');
const { createMemberHandlers } = require('./members');

function pointer(className, id) {
  return { __type: 'Pointer', className, objectId: id };
}

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
    .equalTo('phone', phone)
    .notEqualTo('objectId', user.id ?? '')
    .first({ useMasterKey: true });
  if (clash) {
    throw new Parse.Error(Parse.Error.DUPLICATE_VALUE, 'That phone number is already registered.');
  }
});

Parse.Cloud.define('ping', () => 'pong');
