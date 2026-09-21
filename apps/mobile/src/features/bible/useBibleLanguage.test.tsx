jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { act, renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { LanguageProvider, useLanguage } from '../../i18n';
import { useBibleLanguage } from './useBibleLanguage';

const wrapper = ({ children }: PropsWithChildren) => <LanguageProvider>{children}</LanguageProvider>;

describe('useBibleLanguage', () => {
  it('follows the app language until the reader picks one, then keeps its own', async () => {
    const { result } = await renderHook(() => ({ app: useLanguage(), bible: useBibleLanguage(), other: useBibleLanguage() }), { wrapper });
    expect(result.current.bible[0]).toBe('en');

    await act(async () => result.current.app.setLanguage('te'));
    expect(result.current.bible[0]).toBe('te');

    // Choosing English in the Bible leaves the app in Telugu, and every open Bible screen sees it.
    await act(async () => result.current.bible[1]('en'));
    expect(result.current.app.language).toBe('te');
    expect(result.current.bible[0]).toBe('en');
    expect(result.current.other[0]).toBe('en');
  });
});
