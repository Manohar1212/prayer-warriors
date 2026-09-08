'use strict';

const CATEGORIES = ['family', 'personal', 'work', 'spiritual', 'relationships', 'other'];
const URGENCIES = ['normal', 'urgent'];

const MESSAGES = {
  notMember: "You're not a member of this group yet.",
  titleRequired: 'Give your request a short title.',
  titleTooLong: 'Keep the title under 120 characters.',
  descriptionTooLong: 'Keep the details under 2000 characters.',
  invalidCategory: 'Choose a category.',
  invalidUrgency: 'Choose an urgency.',
  notFound: "That prayer request isn't available.",
  notActive: 'This request has already been answered.',
  notAllowed: 'Only the person who asked, or an admin, can mark this answered.',
  testimonyTooLong: 'Keep the testimony under 1000 characters.',
};

function fail(message) {
  return new Error(message);
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function createPrayerHandlers({ memberships, requests, responses, now = () => new Date() }) {
  async function requireGroup(callerId) {
    const groupId = callerId ? await memberships.findGroupId(callerId) : null;
    if (!groupId) throw fail(MESSAGES.notMember);
    return groupId;
  }

  async function requireRequestInGroup(requestId, groupId) {
    const request = requestId ? await requests.get(requestId) : null;
    if (!request || request.groupId !== groupId) throw fail(MESSAGES.notFound);
    return request;
  }

  return {
    async createPrayerRequest({ title, description, category, urgency } = {}, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      const cleanTitle = text(title);
      if (!cleanTitle) throw fail(MESSAGES.titleRequired);
      if (cleanTitle.length > 120) throw fail(MESSAGES.titleTooLong);
      const cleanDescription = text(description);
      if (cleanDescription.length > 2000) throw fail(MESSAGES.descriptionTooLong);
      if (!CATEGORIES.includes(category)) throw fail(MESSAGES.invalidCategory);
      const cleanUrgency = urgency === undefined ? 'normal' : urgency;
      if (!URGENCIES.includes(cleanUrgency)) throw fail(MESSAGES.invalidUrgency);

      return requests.create({
        groupId,
        authorId: callerId,
        title: cleanTitle,
        description: cleanDescription,
        category,
        urgency: cleanUrgency,
        status: 'active',
        prayingCount: 0,
      });
    },

    async togglePraying({ requestId } = {}, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      const request = await requireRequestInGroup(requestId, groupId);
      if (request.status !== 'active') throw fail(MESSAGES.notActive);

      const existing = await responses.find(request.id, callerId);
      if (existing) {
        await responses.remove(existing.id);
        const prayingCount = await requests.incrementPraying(request.id, -1);
        return { praying: false, prayingCount };
      }
      await responses.create(request.id, callerId, groupId);
      const prayingCount = await requests.incrementPraying(request.id, 1);
      return { praying: true, prayingCount };
    },

    async markAnswered({ requestId, testimony } = {}, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      const request = await requireRequestInGroup(requestId, groupId);
      if (request.status !== 'active') throw fail(MESSAGES.notActive);

      const isAuthor = request.authorId === callerId;
      const isAdmin = !isAuthor && (await memberships.findAdminGroupId(callerId)) === groupId;
      if (!isAuthor && !isAdmin) throw fail(MESSAGES.notAllowed);

      const cleanTestimony = text(testimony);
      if (cleanTestimony.length > 1000) throw fail(MESSAGES.testimonyTooLong);

      return requests.update(request.id, {
        status: 'answered',
        answeredAt: now(),
        testimony: cleanTestimony || null,
      });
    },
  };
}

module.exports = { createPrayerHandlers, MESSAGES, CATEGORIES };
