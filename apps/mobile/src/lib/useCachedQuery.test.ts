jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => {
    // In tests a screen is "focused" when mounted.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react').useEffect(effect, [effect]);
  },
}));

import { act, renderHook, waitFor } from '@testing-library/react-native';

import { clearQueryCache, useCachedQuery } from './useCachedQuery';

/** A fetch the test resolves by hand, so loading states can be observed. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (err: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useCachedQuery', () => {
  beforeEach(() => clearQueryCache());

  it('loads once on focus and shows a spinner only the first time', async () => {
    const first = deferred<string[]>();
    const fetcher = jest.fn(() => first.promise);
    const a = await renderHook(() => useCachedQuery('list', fetcher));
    expect(a.result.current.loading).toBe(true);
    expect(a.result.current.data).toBeNull();
    await act(async () => first.resolve(['a']));
    expect(a.result.current.loading).toBe(false);
    expect(a.result.current.data).toEqual(['a']);
    expect(fetcher).toHaveBeenCalledTimes(1);

    const second = deferred<string[]>();
    fetcher.mockReturnValue(second.promise);
    const b = await renderHook(() => useCachedQuery('list', fetcher));
    expect(b.result.current.loading).toBe(false);
    expect(b.result.current.data).toEqual(['a']);
    await act(async () => second.resolve(['a', 'b']));
    expect(b.result.current.data).toEqual(['a', 'b']);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('switches keys without a spinner when that key was seen before', async () => {
    const fetcher = jest.fn(async (k: string) => [k]);
    const { result, rerender } = await renderHook(({ k }: { k: string }) => useCachedQuery(`t:${k}`, () => fetcher(k)), { initialProps: { k: 'one' } });
    await waitFor(() => expect(result.current.data).toEqual(['one']));
    await rerender({ k: 'two' });
    await waitFor(() => expect(result.current.data).toEqual(['two']));
    const pending = deferred<string[]>();
    fetcher.mockReturnValue(pending.promise);
    await rerender({ k: 'one' });
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(['one']);
    await act(async () => pending.resolve(['one']));
  });

  it('keeps the last data and reports the error when a refresh fails', async () => {
    const fetcher = jest.fn(async () => ['a']);
    const { result } = await renderHook(() => useCachedQuery('e', fetcher, { fallback: 'nope' }));
    await waitFor(() => expect(result.current.data).toEqual(['a']));
    fetcher.mockRejectedValue(new Error('offline'));
    await act(() => result.current.refresh());
    expect(result.current.error).toBe('offline');
    expect(result.current.data).toEqual(['a']);
  });

  it('setData updates the cache for the next visit', async () => {
    const fetcher = jest.fn(async () => [1]);
    const { result } = await renderHook(() => useCachedQuery<number[]>('n', fetcher));
    await waitFor(() => expect(result.current.data).toEqual([1]));
    await act(async () => result.current.setData((c) => [...(c ?? []), 2]));
    const pending = deferred<number[]>();
    fetcher.mockReturnValue(pending.promise);
    const again = await renderHook(() => useCachedQuery<number[]>('n', fetcher));
    expect(again.result.current.data).toEqual([1, 2]);
    await act(async () => pending.resolve([1, 2]));
  });
});
