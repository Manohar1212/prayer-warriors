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

function fail(message) {
  return new Error(message);
}

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
        username: address,
        email: address,
        password,
        displayName: name,
        ...(mobile ? { phone: mobile } : {}),
      });
      await roles.addUser(groupId, 'member', user.id);
      await memberships.create({ groupId, userId: user.id, role: 'member' });
      return {
        id: user.id,
        displayName: name,
        email: address,
        phone: mobile,
        startingPassword: password,
      };
    },
  };
}

module.exports = { createMemberHandlers, MESSAGES };
