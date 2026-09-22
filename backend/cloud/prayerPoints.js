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
  alreadyHave: 'Finish the point you carry first (tap Done), then pick the next.',
  notYours: 'This point is not yours to change.',
  alreadyDone: 'This point is already marked done.',
  notHolder: 'Only the member carrying this point, or an admin, can mark it answered.',
  notDoneYet: 'Mark the point done for this month first, then mark it answered.',
  alreadyAnswered: 'This point has already been answered.',
  testimonyTooLong: 'Keep the testimony under 1000 characters.',
  requestNotFound: "That prayer request isn't available.",
  requestNotActive: 'Only an open request can join the monthly list.',
  requestAlreadyMonthly: 'This request is already on the monthly list.',
  badOrder: 'The list changed while you were arranging it. Open it again and retry.',
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

/** How long after its start a night counts as over; a 10 pm night clears at 10 am. */
const NIGHT_MS = 12 * 60 * 60 * 1000;

function createPrayerPointHandlers({ memberships, points, claims, requests, nights = null, now = () => new Date() }) {
  /**
   * Once the all-night prayer is over, every pick and Done mark is cleared, so the list is open
   * for the next night. Only the latest finished night is looked at, and it is marked when its
   * reset has run, so an older night can never clear picks made after it.
   */
  /**
   * The month a pick belongs to, read 12 hours back: a night that starts at 10 pm on the 30th
   * keeps its picks through the early hours of the 1st instead of losing them at midnight.
   */
  function claimMonth() {
    return monthKeyFor(new Date(now().getTime() - NIGHT_MS));
  }

  /** A pick is only "open" while its point is still on the list and not yet answered. */
  async function openClaimBlocks(claim) {
    const point = await points.get(claim.pointId);
    return Boolean(point && point.active !== false && !point.answeredAt);
  }

  async function resetAfterNight(groupId) {
    if (!nights) return;
    const night = await nights.findLatestStartedBefore(groupId, new Date(now().getTime() - NIGHT_MS));
    if (!night || night.pointsResetAt) return;
    await claims.removeForGroup(groupId);
    await nights.update(night.id, { pointsResetAt: now() });
  }

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
      await resetAfterNight(groupId);
      const month = claimMonth();
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
              requestId: p.requestId || null,
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

    /** Admin: a one-off request becomes a monthly point, linked so answering one answers the other. */
    async addRequestToMonthly({ requestId } = {}, { callerId } = {}) {
      const groupId = await requireAdminGroup(callerId);
      const request = requestId && requests ? await requests.get(requestId) : null;
      if (!request || request.groupId !== groupId) throw fail(MESSAGES.requestNotFound);
      if (request.status !== 'active') throw fail(MESSAGES.requestNotActive);
      if (await points.findByRequest(request.id)) throw fail(MESSAGES.requestAlreadyMonthly);
      const existing = await points.listActive(groupId);
      const order = existing.reduce((max, p) => Math.max(max, p.order), 0) + 1;
      return points.create({ groupId, title: request.title, order, active: true, requestId: request.id });
    },

    /** Admin: put the monthly points in a new order, given every active point's id, top first. */
    async reorderPrayerPoints({ ids } = {}, { callerId } = {}) {
      const groupId = await requireAdminGroup(callerId);
      const active = await points.listActive(groupId);
      const wanted = Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : [];
      const known = new Set(active.map((p) => p.id));
      // Every active point exactly once, nothing else: a stale list must not drop or revive points.
      if (wanted.length !== active.length || new Set(wanted).size !== wanted.length || wanted.some((id) => !known.has(id))) throw fail(MESSAGES.badOrder);
      const current = new Map(active.map((p) => [p.id, p.order]));
      for (let i = 0; i < wanted.length; i += 1) {
        if (current.get(wanted[i]) !== i + 1) await points.update(wanted[i], { order: i + 1 });
      }
      return { ids: wanted };
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
      // Whoever was praying it is free to pick another.
      const held = await claims.find(point.id, claimMonth());
      if (held && !held.doneAt) await claims.remove(held.id);
      return { id: point.id, removed: true };
    },

    async claimPrayerPoint({ pointId } = {}, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      await resetAfterNight(groupId);
      const point = await requirePoint(pointId, groupId);
      const month = claimMonth();
      if (await claims.find(point.id, month)) throw fail(MESSAGES.taken);
      // One at a time: pray one through (Done), then pick the next, as many as the night allows.
      const open = await claims.findOpenMine(callerId, groupId, month);
      if (open) {
        // A point removed or answered while you held it no longer counts; let it go.
        if (await openClaimBlocks(open)) throw fail(MESSAGES.alreadyHave);
        await claims.remove(open.id);
      }
      const created = await claims.create({ pointId: point.id, userId: callerId, groupId, month });
      // Two taps at once can both pass the checks above: the earliest pick of the point stands, and
      // a member keeps only their earliest open pick. A losing pick is taken back.
      if (claims.listForPoint) {
        const [first] = await claims.listForPoint(point.id, month);
        if (first && first.id !== created.id) {
          await claims.remove(created.id);
          throw fail(MESSAGES.taken);
        }
        const [mineFirst] = await claims.listOpenMine(callerId, groupId, month);
        if (mineFirst && mineFirst.id !== created.id) {
          await claims.remove(created.id);
          throw fail(MESSAGES.alreadyHave);
        }
      }
      return created;
    },

    async releasePrayerPoint({ pointId } = {}, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      const point = await requirePoint(pointId, groupId);
      const claim = await claims.find(point.id, claimMonth());
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
        const claim = await claims.find(point.id, claimMonth());
        if (!claim || claim.userId !== callerId) throw fail(MESSAGES.notHolder);
        if (!claim.doneAt) throw fail(MESSAGES.notDoneYet);
      }
      const updated = await points.update(point.id, { answeredAt: now(), testimony: cleanTestimony });
      if (point.requestId && requests) {
        const request = await requests.get(point.requestId);
        if (request && request.status === 'active') await requests.update(request.id, { status: 'answered', answeredAt: now(), testimony: cleanTestimony || null });
      }
      return updated;
    },

    async markPrayerPointDone({ pointId } = {}, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      const point = await requirePoint(pointId, groupId);
      const claim = await claims.find(point.id, claimMonth());
      if (!claim || claim.userId !== callerId) throw fail(MESSAGES.notYours);
      if (claim.doneAt) throw fail(MESSAGES.alreadyDone);
      return claims.markDone(claim.id, now());
    },
  };
}

module.exports = { createPrayerPointHandlers, monthKeyFor, MESSAGES };
