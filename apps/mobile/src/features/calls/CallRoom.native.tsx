import { Ionicons } from '@expo/vector-icons';
import {
  AudioSession,
  LiveKitRoom,
  VideoTrack,
  isTrackReference,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  useTracks,
} from '@livekit/react-native';
import { Track } from 'livekit-client';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { useT } from '../../i18n';
import { colors } from '../../theme/tokens';
import { Button, Text } from '../../ui';
import type { CallRoomProps } from './CallRoom.types';

function Control({ icon, label, active, onPress, danger = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; active?: boolean; onPress: () => void; danger?: boolean }) {
  const bg = danger ? 'bg-rose-deep' : active ? 'bg-primary' : 'bg-surface border border-border';
  const fg = danger || active ? colors.cream : colors.primary;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} className="items-center gap-1">
      <View className={`h-14 w-14 items-center justify-center rounded-full ${bg}`}>
        <Ionicons name={icon} size={24} color={fg} />
      </View>
      <Text variant="muted" className="text-[12px]">
        {label}
      </Text>
    </Pressable>
  );
}

function Stage({ canEnd, onLeave, onEnd }: Pick<CallRoomProps, 'canEnd' | 'onLeave' | 'onEnd'>) {
  const room = useRoomContext();
  const participants = useParticipants();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const tracks = useTracks([Track.Source.Camera]);
  const [speaker, setSpeaker] = useState(true);
  const t = useT();

  useEffect(() => {
    AudioSession.startAudioSession();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  return (
    <View className="flex-1 gap-4">
      <View className="flex-row flex-wrap gap-2">
        {tracks.filter(isTrackReference).map((track) => (
          <View key={track.participant.identity + track.publication.trackSid} className="h-40 w-[48%] overflow-hidden rounded-2xl bg-primary-dark">
            <VideoTrack trackRef={track} style={{ flex: 1 }} />
          </View>
        ))}
      </View>
      <View className="gap-2">
        <Text variant="title">{participants.length === 1 ? t('calls.room.justYou') : t('calls.room.count', { n: participants.length })}</Text>
        <View className="flex-row flex-wrap gap-2">
          {participants.map((p) => (
            <View key={p.identity} className={`flex-row items-center gap-2 rounded-full px-3 py-1.5 ${p.isSpeaking ? 'bg-sage' : 'bg-surface border border-border'}`}>
              <Ionicons name={p.isMicrophoneEnabled ? 'mic-outline' : 'mic-off-outline'} size={14} color={colors.primary} />
              <Text variant="label" className="text-[13px]">
                {p.name || p.identity}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <View className="mt-auto flex-row justify-around">
        <Control icon={isMicrophoneEnabled ? 'mic' : 'mic-off'} label={isMicrophoneEnabled ? t('calls.room.mute') : t('calls.room.unmute')} active={isMicrophoneEnabled} onPress={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)} />
        <Control icon={isCameraEnabled ? 'videocam' : 'videocam-off'} label={t('calls.room.camera')} active={isCameraEnabled} onPress={() => localParticipant.setCameraEnabled(!isCameraEnabled)} />
        <Control icon={speaker ? 'volume-high' : 'volume-low'} label={t('calls.room.speaker')} active={speaker} onPress={() => { const next = !speaker; setSpeaker(next); AudioSession.configureAudio({ ios: { defaultOutput: next ? 'speaker' : 'earpiece' } }).catch(() => undefined); }} />
        <Control icon="call" label={t('calls.room.leave')} danger onPress={() => { room.disconnect(); onLeave(); }} />
      </View>
      {canEnd ? <Button title={t('calls.endForEveryone')} variant="ghost" onPress={onEnd} /> : null}
    </View>
  );
}

export function CallRoom({ credentials, canEnd, onLeave, onEnd }: CallRoomProps) {
  return (
    <LiveKitRoom serverUrl={credentials.url} token={credentials.token} connect audio video={false} onDisconnected={onLeave}>
      <Stage canEnd={canEnd} onLeave={onLeave} onEnd={onEnd} />
    </LiveKitRoom>
  );
}
