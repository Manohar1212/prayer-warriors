import { createFundsService } from './service';

const rows = {
  contributions: [{ id: 'c1', member: { id: 'u1', displayName: 'Sarah' }, amountPaise: 500000, transactionDate: '2026-09-05T00:00:00.000Z', paymentMethod: 'cash', reference: '', note: '', createdAt: '2026-09-05T00:00:00.000Z' }],
  expenses: [{ id: 'e1', category: 'hall', amountPaise: 350000, paidTo: 'Hall', description: '', transactionDate: '2026-09-06T00:00:00.000Z', createdAt: '2026-09-06T00:00:00.000Z' }],
  audit: [{ id: 'a1', user: { id: 'u9', displayName: 'Shiny' }, entityType: 'expense', entityId: 'e1', action: 'update', reason: 'Receipt', oldValues: { amountPaise: 300000 }, newValues: { amountPaise: 350000 }, createdAt: '2026-09-07T00:00:00.000Z' }],
};

function svc(cloudResult: unknown = {}) {
  const cloud = { run: jest.fn(async () => cloudResult) };
  const service = createFundsService({
    fetchContributions: async () => rows.contributions,
    fetchExpenses: async () => rows.expenses,
    fetchAudit: async () => rows.audit,
    cloud,
  });
  return { service, cloud };
}

describe('fundsService', () => {
  it('lists the ledger with member names', async () => {
    const { service } = svc();
    const ledger = await service.list();
    expect(ledger.contributions[0]).toMatchObject({ memberName: 'Sarah', amountPaise: 500000 });
    expect(ledger.expenses[0]).toMatchObject({ paidTo: 'Hall' });
  });
  it('adds a contribution through the cloud function', async () => {
    const { service, cloud } = svc({ id: 'c2' });
    await service.addContribution({ memberId: 'u1', amountPaise: 100, transactionDate: '2026-09-08', paymentMethod: 'bank', reference: '', note: '' });
    expect(cloud.run).toHaveBeenCalledWith('addContribution', { memberId: 'u1', amountPaise: 100, transactionDate: '2026-09-08', paymentMethod: 'bank', reference: '', note: '' });
  });
  it('updates and deletes with reasons', async () => {
    const { service, cloud } = svc({});
    await service.updateExpense('e1', { amountPaise: 400000 }, 'Receipt');
    expect(cloud.run).toHaveBeenCalledWith('updateExpense', { expenseId: 'e1', amountPaise: 400000, reason: 'Receipt' });
    await service.deleteContribution('c1', 'Duplicate');
    expect(cloud.run).toHaveBeenCalledWith('deleteContribution', { contributionId: 'c1', reason: 'Duplicate' });
  });
  it('lists the audit log with actor names', async () => {
    const { service } = svc();
    const log = await service.auditLog();
    expect(log[0]).toMatchObject({ actor: 'Shiny', action: 'update', reason: 'Receipt' });
  });
  it('passes cloud messages through', async () => {
    const { service, cloud } = svc();
    cloud.run.mockRejectedValueOnce(Object.assign(new Error('Only admins can change financial records.'), { code: 141 }));
    await expect(service.addExpense({ category: 'hall', amountPaise: 1, paidTo: 'x', description: '', transactionDate: '2026-09-08' })).rejects.toThrow('Only admins can change financial records.');
  });
});
