jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react').useEffect(effect, [effect]);
  },
}));

const mockList = jest.fn();
const mockRemove = jest.fn();
jest.mock('../../lib/parse', () => ({
  membersService: { list: (...a: unknown[]) => mockList(...a), add: jest.fn(), remove: (...a: unknown[]) => mockRemove(...a) },
}));
jest.mock('../auth', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));

import { act, renderHook, waitFor } from '@testing-library/react-native';

import { clearQueryCache } from '../../lib/useCachedQuery';
import { useMembers } from './useMembers';

const shiny = { id: 'm1', userId: 'u1', displayName: 'Shiny', role: 'admin' as const, status: 'active' as const };
const manohar = { id: 'm2', userId: 'u2', displayName: 'Manohar', role: 'member' as const, status: 'active' as const };

describe('useMembers.remove', () => {
  beforeEach(() => {
    clearQueryCache();
    mockList.mockReset();
    mockRemove.mockReset().mockResolvedValue({ userId: 'u2' });
  });

  it('drops the member from the list once the server has removed them', async () => {
    mockList.mockResolvedValueOnce([shiny, manohar]).mockResolvedValueOnce([shiny]);
    const { result } = await renderHook(() => useMembers());
    await waitFor(() => expect(result.current.members).toHaveLength(2));
    await act(() => result.current.remove('u2'));
    expect(mockRemove).toHaveBeenCalledWith('u2');
    await waitFor(() => expect(result.current.members.map((m) => m.userId)).toEqual(['u1']));
  });

  it('keeps the member when the server refuses', async () => {
    mockList.mockResolvedValue([shiny, manohar]);
    mockRemove.mockRejectedValueOnce(new Error('The group needs at least one admin.'));
    const { result } = await renderHook(() => useMembers());
    await waitFor(() => expect(result.current.members).toHaveLength(2));
    await expect(act(() => result.current.remove('u2'))).rejects.toThrow('The group needs at least one admin.');
    expect(result.current.members).toHaveLength(2);
  });
});
