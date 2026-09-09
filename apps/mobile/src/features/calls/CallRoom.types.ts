import type { CallCredentials } from './types';

export type CallRoomProps = {
  credentials: CallCredentials;
  displayName: string;
  canEnd: boolean;
  onLeave: () => void;
  onEnd: () => void;
};
