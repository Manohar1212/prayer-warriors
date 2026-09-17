import { useEffect } from 'react';

/**
 * Keeps the screen on while a screen is mounted (singing from the songbook). expo-keep-awake
 * needs native code, so a development build made before it was added must not crash: if the
 * module is missing we simply do nothing.
 */
type KeepAwakeModule = { activateKeepAwakeAsync(tag?: string): Promise<void>; deactivateKeepAwake(tag?: string): Promise<void> };

let keepAwake: KeepAwakeModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  keepAwake = require('expo-keep-awake') as KeepAwakeModule;
} catch {
  keepAwake = null;
}

export function useKeepScreenOn(tag: string): void {
  useEffect(() => {
    const mod = keepAwake;
    if (!mod) return undefined;
    mod.activateKeepAwakeAsync(tag).catch(() => undefined);
    return () => {
      mod.deactivateKeepAwake(tag).catch(() => undefined);
    };
  }, [tag]);
}
