'use strict';

const E164 = /^\+[1-9]\d{7,14}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MESSAGES = {
  adminOnly: 'Only admins can add members.',
  adminOnlyRemove: 'Only admins can remove members.',
  nameRequired: "Enter the member's name.",
  invalidEmail: 'Enter a valid email address.',
  invalidPhone: "That doesn't look like a valid mobile number.",
  duplicate: 'A member with that email already exists.',
  notAMember: 'That person is not a member of this group.',
  notYourself: 'You cannot remove yourself from the group.',
  lastAdmin: 'The group needs at least one admin.',
  membersOnly: "You're not a member of this group yet.",
};

function fail(message) {
  return new Error(message);
}

function createMemberHandlers({ memberships, users, roles, sessions, pushTokens, prayerPoints, generatePassword, now = () => new Date() }) {
  return {
    /**
     * The mobile numbers of the caller's own group, for the call and WhatsApp buttons. Phone
     * stays a protected field on _User, so this is the only way a member sees another's number.
     */
    async memberPhones(_params = {}, { callerId } = {}) {
      const groupId = callerId ? await memberships.findGroupId(callerId) : null;
      if (!groupId) throw fail(MESSAGES.membersOnly);
      const ids = await memberships.listActiveUserIds(groupId);
      const people = await users.findPhones(ids);
      return { phones: people.filter((p) => p.phone && E164.test(p.phone)).map((p) => ({ userId: p.id, phone: p.phone })) };
    },

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
        // The starting password travels over WhatsApp, so the app asks them to choose their own.
        mustSetPassword: true,
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

    /**
     * Takes a member out of the group: the membership goes inactive, both group roles lose
     * them (so nothing in the group is readable any more), their sessions and push tokens go,
     * and any monthly prayer point they were carrying is freed for someone else. What they
     * wrote - requests, comments, contributions, quiz results - stays as it is, with their name.
     */
    async removeMember({ userId } = {}, { callerId } = {}) {
      if (!callerId) throw fail(MESSAGES.adminOnlyRemove);
      const groupId = await memberships.findAdminGroupId(callerId);
      if (!groupId) throw fail(MESSAGES.adminOnlyRemove);

      const id = typeof userId === 'string' ? userId.trim() : '';
      if (!id) throw fail(MESSAGES.notAMember);
      if (id === callerId) throw fail(MESSAGES.notYourself);

      const membership = await memberships.findActive(id);
      if (!membership || membership.groupId !== groupId) throw fail(MESSAGES.notAMember);
      if (membership.role === 'admin' && (await memberships.countActiveAdmins(groupId)) <= 1) throw fail(MESSAGES.lastAdmin);

      await memberships.deactivate({ id: membership.id, removedBy: callerId, removedAt: now() });
      await roles.removeUser(groupId, 'member', id);
      await roles.removeUser(groupId, 'admin', id);
      await prayerPoints.releaseClaims({ groupId, userId: id });
      await sessions.revokeAll(id);
      await pushTokens.removeAllForUser(id);
      return { userId: id };
    },
  };
}

module.exports = { createMemberHandlers, MESSAGES };
