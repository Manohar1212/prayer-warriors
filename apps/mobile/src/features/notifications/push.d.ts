import type { PushPlatform } from './types';

export type PushRegistration = { token: string; platform: PushPlatform; deviceName: string };

/** Asks for permission and returns the Expo push token, or null when push is unavailable or not set up. */
export declare function registerForPush(): Promise<PushRegistration | null>;

/** Calls `onRoute` with the route carried by a notification the person tapped (cold start included). */
export declare function usePushResponse(onRoute: (route: string) => void): void;
