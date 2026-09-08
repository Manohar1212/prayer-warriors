const { createFinanceHandlers, MESSAGES, EXPENSE_CATEGORIES, PAYMENT_METHODS } = require('./finance');

const NOW = new Date('2026-09-08T10:00:00.000Z');
const admin = { callerId: 'admin1' };

function contribution(o = {}) {
  return {
    id: 'c1', groupId: 'g1', memberId: 'u2', amountPaise: 500000, transactionDate: '2026-09-01T00:00:00.000Z',
    paymentMethod: 'cash', reference: 'Sept', note: '', createdById: 'admin1', updatedById: null, createdAt: '2026-09-01T00:00:00.000Z', ...o,
  };
}
function expense(o = {}) {
  return {
    id: 'e1', groupId: 'g1', category: 'hall', amountPaise: 350000, paidTo: 'Community hall', description: '',
    transactionDate: '2026-09-02T00:00:00.000Z', createdById: 'admin1', updatedById: null, createdAt: '2026-09-02T00:00:00.000Z', ...o,
  };
}

function deps({ adminGroupId = 'g1', isMember = true, contrib = contribution(), exp = expense() } = {}) {
  return {
    memberships: {
      findAdminGroupId: jest.fn(async () => adminGroupId),
      isActiveMember: jest.fn(async () => isMember),
    },
    ledger: {
      createContribution: jest.fn(async (f) => contribution({ ...f, id: 'cNew' })),
      getContribution: jest.fn(async () => contrib),
      updateContribution: jest.fn(async (id, patch) => contribution({ ...contrib, ...patch })),
      deleteContribution: jest.fn(async () => undefined),
      createExpense: jest.fn(async (f) => expense({ ...f, id: 'eNew' })),
      getExpense: jest.fn(async () => exp),
      updateExpense: jest.fn(async (id, patch) => expense({ ...exp, ...patch })),
      deleteExpense: jest.fn(async () => undefined),
    },
    audit: { record: jest.fn(async () => undefined) },
    now: () => NOW,
  };
}

const contribInput = { memberId: 'u2', amountPaise: 500000, transactionDate: '2026-09-01', paymentMethod: 'cash', reference: ' Sept ', note: '' };

describe('addContribution', () => {
  it('creates and audits', async () => {
    const d = deps();
    const result = await createFinanceHandlers(d).addContribution(contribInput, admin);
    expect(d.memberships.isActiveMember).toHaveBeenCalledWith('u2', 'g1');
    expect(d.ledger.createContribution).toHaveBeenCalledWith({
      groupId: 'g1', memberId: 'u2', amountPaise: 500000, transactionDate: new Date('2026-09-01T00:00:00.000Z'),
      paymentMethod: 'cash', reference: 'Sept', note: '', createdById: 'admin1',
    });
    expect(d.audit.record).toHaveBeenCalledWith(expect.objectContaining({ groupId: 'g1', userId: 'admin1', entityType: 'contribution', entityId: 'cNew', action: 'create', oldValues: null }));
    expect(result.id).toBe('cNew');
  });
  it('rejects non-admins', async () => {
    const d = deps({ adminGroupId: null });
    await expect(createFinanceHandlers(d).addContribution(contribInput, { callerId: 'u2' })).rejects.toThrow(MESSAGES.adminOnly);
  });
  it('rejects members outside the group', async () => {
    const d = deps({ isMember: false });
    await expect(createFinanceHandlers(d).addContribution(contribInput, admin)).rejects.toThrow(MESSAGES.memberNotFound);
  });
  it.each([
    ['zero amount', { amountPaise: 0 }, 'invalidAmount'],
    ['fractional paise', { amountPaise: 10.5 }, 'invalidAmount'],
    ['huge amount', { amountPaise: 1000000001 }, 'amountTooLarge'],
    ['bad date', { transactionDate: 'yesterday' }, 'invalidDate'],
    ['future date', { transactionDate: '2027-01-01' }, 'futureDate'],
    ['bad method', { paymentMethod: 'upi' }, 'invalidMethod'],
    ['long reference', { reference: 'x'.repeat(121) }, 'referenceTooLong'],
    ['long note', { note: 'x'.repeat(501) }, 'noteTooLong'],
  ])('rejects %s', async (_, bad, key) => {
    const d = deps();
    await expect(createFinanceHandlers(d).addContribution({ ...contribInput, ...bad }, admin)).rejects.toThrow(MESSAGES[key]);
    expect(d.ledger.createContribution).not.toHaveBeenCalled();
  });
});

describe('updateContribution / deleteContribution', () => {
  it('updates with a reason and audits old and new values', async () => {
    const d = deps();
    const result = await createFinanceHandlers(d).updateContribution({ contributionId: 'c1', amountPaise: 600000, reason: ' Corrected amount ' }, admin);
    expect(d.ledger.updateContribution).toHaveBeenCalledWith('c1', expect.objectContaining({ amountPaise: 600000, updatedById: 'admin1' }));
    expect(d.audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'update', entityId: 'c1', reason: 'Corrected amount', oldValues: expect.objectContaining({ amountPaise: 500000 }), newValues: expect.objectContaining({ amountPaise: 600000 }) }));
    expect(result.amountPaise).toBe(600000);
  });
  it('requires a reason', async () => {
    const d = deps();
    await expect(createFinanceHandlers(d).updateContribution({ contributionId: 'c1', amountPaise: 600000 }, admin)).rejects.toThrow(MESSAGES.reasonRequired);
  });
  it('rejects a long reason', async () => {
    const d = deps();
    await expect(createFinanceHandlers(d).deleteContribution({ contributionId: 'c1', reason: 'x'.repeat(201) }, admin)).rejects.toThrow(MESSAGES.reasonTooLong);
  });
  it('deletes with a reason and audits', async () => {
    const d = deps();
    await expect(createFinanceHandlers(d).deleteContribution({ contributionId: 'c1', reason: 'Duplicate' }, admin)).resolves.toEqual({ deleted: true });
    expect(d.ledger.deleteContribution).toHaveBeenCalledWith('c1');
    expect(d.audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'delete', newValues: null }));
  });
  it('rejects records from another group', async () => {
    const d = deps({ contrib: contribution({ groupId: 'g2' }) });
    await expect(createFinanceHandlers(d).deleteContribution({ contributionId: 'c1', reason: 'x' }, admin)).rejects.toThrow(MESSAGES.notFound);
  });
  it('rejects missing records', async () => {
    const d = deps({ contrib: null });
    await expect(createFinanceHandlers(d).updateContribution({ contributionId: 'nope', reason: 'x', note: 'y' }, admin)).rejects.toThrow(MESSAGES.notFound);
  });
});

describe('expenses', () => {
  const expenseInput = { category: 'hall', amountPaise: 350000, paidTo: ' Community hall ', description: 'Sunday', transactionDate: '2026-09-02' };
  it('creates and audits', async () => {
    const d = deps();
    const result = await createFinanceHandlers(d).addExpense(expenseInput, admin);
    expect(d.ledger.createExpense).toHaveBeenCalledWith({
      groupId: 'g1', category: 'hall', amountPaise: 350000, paidTo: 'Community hall', description: 'Sunday',
      transactionDate: new Date('2026-09-02T00:00:00.000Z'), createdById: 'admin1',
    });
    expect(result.id).toBe('eNew');
    expect(d.audit.record).toHaveBeenCalledWith(expect.objectContaining({ entityType: 'expense', action: 'create' }));
  });
  it.each([
    ['bad category', { category: 'fun' }, 'invalidCategory'],
    ['missing payee', { paidTo: ' ' }, 'paidToRequired'],
    ['long payee', { paidTo: 'x'.repeat(121) }, 'paidToTooLong'],
    ['long description', { description: 'x'.repeat(501) }, 'descriptionTooLong'],
  ])('rejects %s', async (_, bad, key) => {
    const d = deps();
    await expect(createFinanceHandlers(d).addExpense({ ...expenseInput, ...bad }, admin)).rejects.toThrow(MESSAGES[key]);
  });
  it('updates and deletes with reasons', async () => {
    const d = deps();
    await createFinanceHandlers(d).updateExpense({ expenseId: 'e1', amountPaise: 400000, reason: 'Receipt found' }, admin);
    expect(d.ledger.updateExpense).toHaveBeenCalledWith('e1', expect.objectContaining({ amountPaise: 400000 }));
    await createFinanceHandlers(d).deleteExpense({ expenseId: 'e1', reason: 'Entered twice' }, admin);
    expect(d.ledger.deleteExpense).toHaveBeenCalledWith('e1');
    expect(d.audit.record).toHaveBeenCalledTimes(2);
  });
  it('exposes category and method lists', () => {
    expect(EXPENSE_CATEGORIES).toEqual(['hall', 'food', 'transport', 'charity', 'event', 'supplies', 'other']);
    expect(PAYMENT_METHODS).toEqual(['cash', 'bank', 'other']);
  });
});
