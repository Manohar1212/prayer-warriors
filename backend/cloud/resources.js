'use strict';

const TYPES = ['song', 'scripture', 'prayer'];
const HTTP_URL = /^https?:\/\/\S+$/i;

const MESSAGES = {
  notMember: "You're not a member of this group yet.",
  invalidType: 'Choose songs, scripture, or prayers.',
  titleRequired: 'Give it a title.',
  titleTooLong: 'Keep the title under 120 characters.',
  bodyTooLong: 'Keep the text under 4000 characters.',
  referenceTooLong: 'Keep the reference under 80 characters.',
  noteTooLong: 'Keep the note under 500 characters.',
  invalidUrl: 'Links must start with http:// or https://.',
  nothingToShare: 'Add some text or a link.',
  notFound: "That resource isn't available.",
  notAllowed: 'Only the person who shared this, or an admin, can remove it.',
};

function fail(message) {
  return new Error(message);
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function createResourceHandlers({ memberships, resources }) {
  async function requireGroup(callerId) {
    const groupId = callerId ? await memberships.findGroupId(callerId) : null;
    if (!groupId) throw fail(MESSAGES.notMember);
    return groupId;
  }

  return {
    async createResource({ type, title, body, reference, url, note } = {}, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      if (!TYPES.includes(type)) throw fail(MESSAGES.invalidType);
      const cleanTitle = text(title);
      if (!cleanTitle) throw fail(MESSAGES.titleRequired);
      if (cleanTitle.length > 120) throw fail(MESSAGES.titleTooLong);
      const cleanBody = text(body);
      if (cleanBody.length > 4000) throw fail(MESSAGES.bodyTooLong);
      const cleanReference = text(reference);
      if (cleanReference.length > 80) throw fail(MESSAGES.referenceTooLong);
      const cleanNote = text(note);
      if (cleanNote.length > 500) throw fail(MESSAGES.noteTooLong);
      const cleanUrl = text(url);
      if (cleanUrl && !HTTP_URL.test(cleanUrl)) throw fail(MESSAGES.invalidUrl);
      if (!cleanBody && !cleanUrl) throw fail(MESSAGES.nothingToShare);

      return resources.create({
        groupId,
        createdById: callerId,
        type,
        title: cleanTitle,
        reference: cleanReference,
        url: cleanUrl,
        body: cleanBody,
        note: cleanNote,
      });
    },

    async deleteResource({ resourceId } = {}, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      const resource = resourceId ? await resources.get(resourceId) : null;
      if (!resource || resource.groupId !== groupId) throw fail(MESSAGES.notFound);
      const isCreator = resource.createdById === callerId;
      const isAdmin = !isCreator && (await memberships.findAdminGroupId(callerId)) === groupId;
      if (!isCreator && !isAdmin) throw fail(MESSAGES.notAllowed);
      await resources.remove(resource.id);
      return { deleted: true };
    },
  };
}

module.exports = { createResourceHandlers, MESSAGES, TYPES };
