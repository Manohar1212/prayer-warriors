'use strict';

const JOIN_WINDOW_BEFORE_MS = 15 * 60 * 1000;
const SCHEDULE_GRACE_MS = 60 * 60 * 1000;
// Long enough for an all-night prayer; after this a call that nobody ended is closed.
const CALL_OPEN_MS = 12 * 60 * 60 * 1000;
const TOKEN_TTL_SECONDS = 7200;

const MESSAGES = {
  adminOnly: 'Only admins can manage calls.',
  notMember: "You're not a member of this group yet.",
  titleRequired: 'Give the call a title.',
  titleTooLong: 'Keep the title under 80 characters.',
  invalidTime: 'Enter a valid date and time.',
  pastTime: 'That time has already passed.',
  notFound: "That call isn't available.",
  notJoinable: "This call isn't open right now.",
  notConfigured: 'Calls are not set up yet. Ask your admin.',
};

function fail(message) {
  return new Error(message);
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function createCallHandlers({ memberships, calls, participants, users, tokens, now = () => new Date() }) {
  async function requireAdminGroup(callerId) {
    const groupId = callerId ? await memberships.findAdminGroupId(callerId) : null;
    if (!groupId) throw fail(MESSAGES.adminOnly);
    return groupId;
  }

  async function requireGroup(callerId) {
    const groupId = callerId ? await memberships.findGroupId(callerId) : null;
    if (!groupId) throw fail(MESSAGES.notMember);
    return groupId;
  }

  async function requireCall(callId, groupId) {
    const call = callId ? await calls.get(callId) : null;
    if (!call || call.groupId !== groupId) throw fail(MESSAGES.notFound);
    return call;
  }

  return {
    async scheduleCall({ title, scheduledAt } = {}, { callerId } = {}) {
      const groupId = await requireAdminGroup(callerId);
      const cleanTitle = text(title);
      if (!cleanTitle) throw fail(MESSAGES.titleRequired);
      if (cleanTitle.length > 80) throw fail(MESSAGES.titleTooLong);
      const when = new Date(typeof scheduledAt === 'string' ? scheduledAt : NaN);
      if (Number.isNaN(when.getTime())) throw fail(MESSAGES.invalidTime);
      if (when.getTime() < now().getTime() - SCHEDULE_GRACE_MS) throw fail(MESSAGES.pastTime);
      return calls.create({ groupId, title: cleanTitle, scheduledAt: when, status: 'scheduled', createdById: callerId });
    },

    async cancelCall({ callId } = {}, { callerId } = {}) {
      const groupId = await requireAdminGroup(callerId);
      const call = await requireCall(callId, groupId);
      if (call.status !== 'scheduled') throw fail(MESSAGES.notJoinable);
      return calls.update(call.id, { status: 'cancelled' });
    },

    async endCall({ callId } = {}, { callerId } = {}) {
      const groupId = await requireAdminGroup(callerId);
      const call = await requireCall(callId, groupId);
      if (call.status !== 'live' && call.status !== 'scheduled') throw fail(MESSAGES.notJoinable);
      return calls.update(call.id, { status: 'ended', endedAt: now() });
    },

    async joinCall({ callId } = {}, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      if (!tokens) throw fail(MESSAGES.notConfigured);
      const call = await requireCall(callId, groupId);
      const current = now();
      const startsAt = new Date(call.scheduledAt).getTime();
      const open = call.status === 'scheduled' || call.status === 'live';
      if (open && current.getTime() >= startsAt + CALL_OPEN_MS) {
        await calls.update(call.id, { status: 'ended', endedAt: current });
        throw fail(MESSAGES.notJoinable);
      }
      const opensAt = startsAt - JOIN_WINDOW_BEFORE_MS;
      const joinable = (call.status === 'scheduled' && current.getTime() >= opensAt) || call.status === 'live';
      if (!joinable) throw fail(MESSAGES.notJoinable);
      if (call.status === 'scheduled') await calls.update(call.id, { status: 'live', startedAt: current });
      await participants.upsertJoined(call.id, callerId, groupId);
      const name = (await users.displayName(callerId)) || 'Member';
      const token = tokens.mint({ identity: callerId, name, room: call.roomName, ttlSeconds: TOKEN_TTL_SECONDS });
      return { url: tokens.url, token, roomName: call.roomName };
    },

    async leaveCall({ callId } = {}, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      const call = await requireCall(callId, groupId);
      await participants.markLeft(call.id, callerId, now());
      return { left: true };
    },
  };
}

module.exports = { createCallHandlers, MESSAGES, CALL_OPEN_MS };
