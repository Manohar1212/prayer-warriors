'use strict';

const EXPENSE_CATEGORIES = ['hall', 'food', 'transport', 'charity', 'event', 'supplies', 'other'];
const PAYMENT_METHODS = ['cash', 'bank', 'other'];
const MAX_PAISE = 1000000000; // ₹1,00,00,000

const MESSAGES = {
  adminOnly: 'Only admins can change financial records.',
  memberNotFound: "That member isn't in the group.",
  invalidAmount: 'Enter an amount greater than zero.',
  amountTooLarge: 'That amount is too large.',
  invalidDate: 'Enter a valid date.',
  futureDate: "The date can't be in the future.",
  invalidMethod: 'Choose a payment method.',
  invalidCategory: 'Choose a category.',
  paidToRequired: 'Enter who was paid.',
  paidToTooLong: 'Keep the payee under 120 characters.',
  referenceTooLong: 'Keep the reference under 120 characters.',
  noteTooLong: 'Keep the note under 500 characters.',
  descriptionTooLong: 'Keep the description under 500 characters.',
  reasonRequired: 'Say why this record is changing.',
  reasonTooLong: 'Keep the reason under 200 characters.',
  notFound: "That record isn't available.",
};

function fail(message) {
  return new Error(message);
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateAmount(amountPaise) {
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) throw fail(MESSAGES.invalidAmount);
  if (amountPaise > MAX_PAISE) throw fail(MESSAGES.amountTooLarge);
  return amountPaise;
}

function validateDate(value, now) {
  const raw = typeof value === 'string' ? value.trim() : '';
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00.000Z` : raw;
  const date = new Date(iso);
  if (!raw || Number.isNaN(date.getTime())) throw fail(MESSAGES.invalidDate);
  if (date.getTime() > now.getTime() + 24 * 60 * 60 * 1000) throw fail(MESSAGES.futureDate);
  return date;
}

function validateReason(value) {
  const reason = text(value);
  if (!reason) throw fail(MESSAGES.reasonRequired);
  if (reason.length > 200) throw fail(MESSAGES.reasonTooLong);
  return reason;
}

function limited(value, max, message) {
  const clean = text(value);
  if (clean.length > max) throw fail(message);
  return clean;
}

const CONTRIBUTION_FIELDS = ['memberId', 'amountPaise', 'transactionDate', 'paymentMethod', 'reference', 'note'];
const EXPENSE_FIELDS = ['category', 'amountPaise', 'paidTo', 'description', 'transactionDate'];

function snapshot(record, fields) {
  const out = {};
  fields.forEach((f) => {
    const v = record[f];
    out[f] = v instanceof Date ? v.toISOString() : v === undefined ? null : v;
  });
  return out;
}

function createFinanceHandlers({ memberships, ledger, audit, now = () => new Date() }) {
  async function requireAdminGroup(callerId) {
    const groupId = callerId ? await memberships.findAdminGroupId(callerId) : null;
    if (!groupId) throw fail(MESSAGES.adminOnly);
    return groupId;
  }

  async function requireRecord(getter, id, groupId) {
    const record = id ? await getter(id) : null;
    if (!record || record.groupId !== groupId) throw fail(MESSAGES.notFound);
    return record;
  }

  async function validateContributionFields(input, groupId, { partial } = {}) {
    const out = {};
    const has = (k) => input[k] !== undefined;
    if (!partial || has('memberId')) {
      const memberId = text(input.memberId);
      if (!memberId || !(await memberships.isActiveMember(memberId, groupId))) throw fail(MESSAGES.memberNotFound);
      out.memberId = memberId;
    }
    if (!partial || has('amountPaise')) out.amountPaise = validateAmount(input.amountPaise);
    if (!partial || has('transactionDate')) out.transactionDate = validateDate(input.transactionDate, now());
    if (!partial || has('paymentMethod')) {
      if (!PAYMENT_METHODS.includes(input.paymentMethod)) throw fail(MESSAGES.invalidMethod);
      out.paymentMethod = input.paymentMethod;
    }
    if (!partial || has('reference')) out.reference = limited(input.reference, 120, MESSAGES.referenceTooLong);
    if (!partial || has('note')) out.note = limited(input.note, 500, MESSAGES.noteTooLong);
    return out;
  }

  function validateExpenseFields(input, { partial } = {}) {
    const out = {};
    const has = (k) => input[k] !== undefined;
    if (!partial || has('category')) {
      if (!EXPENSE_CATEGORIES.includes(input.category)) throw fail(MESSAGES.invalidCategory);
      out.category = input.category;
    }
    if (!partial || has('amountPaise')) out.amountPaise = validateAmount(input.amountPaise);
    if (!partial || has('paidTo')) {
      const paidTo = text(input.paidTo);
      if (!paidTo) throw fail(MESSAGES.paidToRequired);
      if (paidTo.length > 120) throw fail(MESSAGES.paidToTooLong);
      out.paidTo = paidTo;
    }
    if (!partial || has('description')) out.description = limited(input.description, 500, MESSAGES.descriptionTooLong);
    if (!partial || has('transactionDate')) out.transactionDate = validateDate(input.transactionDate, now());
    return out;
  }

  async function log(groupId, callerId, entityType, entityId, action, oldValues, newValues, reason) {
    await audit.record({ groupId, userId: callerId, entityType, entityId, action, oldValues, newValues, reason: reason || null });
  }

  return {
    async addContribution(input = {}, { callerId } = {}) {
      const groupId = await requireAdminGroup(callerId);
      const fields = await validateContributionFields(input, groupId);
      const created = await ledger.createContribution({ groupId, ...fields, createdById: callerId });
      await log(groupId, callerId, 'contribution', created.id, 'create', null, snapshot(created, CONTRIBUTION_FIELDS));
      return created;
    },

    async updateContribution({ contributionId, reason, ...input } = {}, { callerId } = {}) {
      const groupId = await requireAdminGroup(callerId);
      const cleanReason = validateReason(reason);
      const existing = await requireRecord(ledger.getContribution, contributionId, groupId);
      const patch = await validateContributionFields(input, groupId, { partial: true });
      const updated = await ledger.updateContribution(existing.id, { ...patch, updatedById: callerId });
      await log(groupId, callerId, 'contribution', existing.id, 'update', snapshot(existing, CONTRIBUTION_FIELDS), snapshot(updated, CONTRIBUTION_FIELDS), cleanReason);
      return updated;
    },

    async deleteContribution({ contributionId, reason } = {}, { callerId } = {}) {
      const groupId = await requireAdminGroup(callerId);
      const cleanReason = validateReason(reason);
      const existing = await requireRecord(ledger.getContribution, contributionId, groupId);
      await ledger.deleteContribution(existing.id);
      await log(groupId, callerId, 'contribution', existing.id, 'delete', snapshot(existing, CONTRIBUTION_FIELDS), null, cleanReason);
      return { deleted: true };
    },

    async addExpense(input = {}, { callerId } = {}) {
      const groupId = await requireAdminGroup(callerId);
      const fields = validateExpenseFields(input);
      const created = await ledger.createExpense({ groupId, ...fields, createdById: callerId });
      await log(groupId, callerId, 'expense', created.id, 'create', null, snapshot(created, EXPENSE_FIELDS));
      return created;
    },

    async updateExpense({ expenseId, reason, ...input } = {}, { callerId } = {}) {
      const groupId = await requireAdminGroup(callerId);
      const cleanReason = validateReason(reason);
      const existing = await requireRecord(ledger.getExpense, expenseId, groupId);
      const patch = validateExpenseFields(input, { partial: true });
      const updated = await ledger.updateExpense(existing.id, { ...patch, updatedById: callerId });
      await log(groupId, callerId, 'expense', existing.id, 'update', snapshot(existing, EXPENSE_FIELDS), snapshot(updated, EXPENSE_FIELDS), cleanReason);
      return updated;
    },

    async deleteExpense({ expenseId, reason } = {}, { callerId } = {}) {
      const groupId = await requireAdminGroup(callerId);
      const cleanReason = validateReason(reason);
      const existing = await requireRecord(ledger.getExpense, expenseId, groupId);
      await ledger.deleteExpense(existing.id);
      await log(groupId, callerId, 'expense', existing.id, 'delete', snapshot(existing, EXPENSE_FIELDS), null, cleanReason);
      return { deleted: true };
    },
  };
}

module.exports = { createFinanceHandlers, MESSAGES, EXPENSE_CATEGORIES, PAYMENT_METHODS };
