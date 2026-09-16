'use strict';

/**
 * Monthly prayer points: the regular things the group prays for every month (the nation, families…).
 * Each month every member may pick one point to carry, and marks it done after the all-night prayer.
 * Claims are keyed by month, so the list resets itself when a new month begins. A point keeps
 * coming back every month until the group marks it answered; then it moves to the answered list.
 */

const MESSAGES = {
  notMember: "You're not a member of this group yet.",
  notAdmin: 'Only an admin can change the regular prayer points.',
  titleRequired: 'Write what to pray for.',
  titleTooLong: 'Keep it under 120 characters.',
  notFound: "That prayer point isn't available.",
  taken: 'Someone has already picked this point for the month.',
  alreadyHave: 'You already carry a point this month. Give it back first to pick another.',
  notYours: 'This point is not yours to change.',
  alreadyDone: 'This point is already marked done.',
  notHolder: 'Only the member carrying this point, or an admin, can mark it answered.',
  notDoneYet: 'Mark the point done for this month first, then mark it answered.',
  alreadyAnswered: 'This point has already been answered.',
  testimonyTooLong: 'Keep the testimony under 1000 characters.',
};

function fail(message) {
  return new Error(message);
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/** "2026-09" for the given instant in India, where the group lives. */
function monthKeyFor(date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit' }).formatToParts(date);
  const year = parts.find((p) => p.type === 'year').value;
  const month = parts.find((p) => p.type === 'month').value;
  return `${year}-${month}`;
}

function createPrayerPointHandlers({ memberships, points, claims, now = () => new Date() }) {
  async function requireGroup(callerId) {
    const groupId = callerId ? await memberships.findGroupId(callerId) : null;
    if (!groupId) throw fail(MESSAGES.notMember);
    return groupId;
  }

  async function requireAdminGroup(callerId) {
    const groupId = callerId ? await memberships.findAdminGroupId(callerId) : null;
    if (!groupId) throw fail(MESSAGES.notAdmin);
    return groupId;
  }

  async function requirePoint(pointId, groupId) {
    const point = pointId ? await points.get(pointId) : null;
    if (!point || point.groupId !== groupId || !point.active) throw fail(MESSAGES.notFound);
    if (point.answeredAt) throw fail(MESSAGES.alreadyAnswered);
    return point;
  }

  function cleanTitle(title) {
    const value = text(title);
    if (!value) throw fail(MESSAGES.titleRequired);
    if (value.length > 120) throw fail(MESSAGES.titleTooLong);
    return value;
  }

  return {
    MESSAGES,

    async listPrayerPoints(_params, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      const month = monthKeyFor(now());
      const [list, monthClaims] = await Promise.all([points.listActive(groupId), claims.listForMonth(groupId, month)]);
      const byPoint = new Map(monthClaims.map((c) => [c.pointId, c]));
      return {
        month,
        points: list
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((p) => {
            const claim = byPoint.get(p.id) || null;
            return {
              id: p.id,
              title: p.title,
              order: p.order,
              claim: claim ? { userId: claim.userId, userName: claim.userName, doneAt: claim.doneAt || null } : null,
            };
          }),
      };
    },

    async addPrayerPoint({ title } = {}, { callerId } = {}) {
      const groupId = await requireAdminGroup(callerId);
      const existing = await points.listActive(groupId);
      const order = existing.reduce((max, p) => Math.max(max, p.order), 0) + 1;
      return points.create({ groupId, title: cleanTitle(title), order, active: true });
    },

    async updatePrayerPoint({ pointId, title } = {}, { callerId } = {}) {
      const groupId = await requireAdminGroup(callerId);
      const point = await requirePoint(pointId, groupId);
      return points.update(point.id, { title: cleanTitle(title) });
    },

    async removePrayerPoint({ pointId } = {}, { callerId } = {}) {
      const groupId = await requireAdminGroup(callerId);
      const point = await requirePoint(pointId, groupId);
      await points.update(point.id, { active: false });
      return { id: point.id, removed: true };
    },

    async claimPrayerPoint({ pointId } = {}, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      const point = await requirePoint(pointId, groupId);
      const month = monthKeyFor(now());
      if (await claims.find(point.id, month)) throw fail(MESSAGES.taken);
      if (await claims.findMine(callerId, groupId, month)) throw fail(MESSAGES.alreadyHave);
      return claims.create({ pointId: point.id, userId: callerId, groupId, month });
    },

    async releasePrayerPoint({ pointId } = {}, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      const point = await requirePoint(pointId, groupId);
      const claim = await claims.find(point.id, monthKeyFor(now()));
      if (!claim || claim.userId !== callerId) throw fail(MESSAGES.notYours);
      if (claim.doneAt) throw fail(MESSAGES.alreadyDone);
      await claims.remove(claim.id);
      return { pointId: point.id, released: true };
    },

    async listAnsweredPrayerPoints(_params, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      const list = await points.listAnswered(groupId);
      return list
        .slice()
        .sort((a, b) => String(b.answeredAt).localeCompare(String(a.answeredAt)))
        .map((p) => ({ id: p.id, title: p.title, answeredAt: p.answeredAt, testimony: p.testimony || '' }));
    },

    /** The member carrying the point this month, or an admin, closes it: it stops returning. */
    async markPrayerPointAnswered({ pointId, testimony } = {}, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      const point = await requirePoint(pointId, groupId);
      const cleanTestimony = text(testimony);
      if (cleanTestimony.length > 1000) throw fail(MESSAGES.testimonyTooLong);
      const adminGroupId = await memberships.findAdminGroupId(callerId);
      if (adminGroupId !== groupId) {
        const claim = await claims.find(point.id, monthKeyFor(now()));
        if (!claim || claim.userId !== callerId) throw fail(MESSAGES.notHolder);
        if (!claim.doneAt) throw fail(MESSAGES.notDoneYet);
      }
      return points.update(point.id, { answeredAt: now(), testimony: cleanTestimony });
    },

    async markPrayerPointDone({ pointId } = {}, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      const point = await requirePoint(pointId, groupId);
      const claim = await claims.find(point.id, monthKeyFor(now()));
      if (!claim || claim.userId !== callerId) throw fail(MESSAGES.notYours);
      if (claim.doneAt) throw fail(MESSAGES.alreadyDone);
      return claims.markDone(claim.id, now());
    },
  };
}

module.exports = { createPrayerPointHandlers, monthKeyFor, MESSAGES };
