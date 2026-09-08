import 'react-native-get-random-values';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Parse from 'parse/react-native.js';

import { loadParseConfig } from '../config';
import { createParseAuthService } from '../features/auth/service';
import { createMembersService } from '../features/members/service';
import type { RawMembership } from '../features/members/types';
import { createPrayerService } from '../features/prayer/service';
import type { PrayerStatus, RawPrayerRequest } from '../features/prayer/types';

const config = loadParseConfig();

Parse.setAsyncStorage(AsyncStorage);
Parse.initialize(config.appId, config.jsKey);
Parse.serverURL = config.serverUrl;

export { Parse };
export const parseAuthService = createParseAuthService({ User: Parse.User });

export const membersService = createMembersService({
  fetchMemberships: async (): Promise<RawMembership[]> => {
    const rows = await new Parse.Query('GroupMember')
      .include('user')
      .ascending('joinedAt')
      .limit(200)
      .find();
    return rows.map((row) => {
      const user = row.get('user') as Parse.User | undefined;
      return {
        id: row.id ?? '',
        role: String(row.get('role') ?? 'member'),
        status: String(row.get('status') ?? 'active'),
        user: user ? { id: user.id ?? '', displayName: user.get('displayName') as string | undefined } : null,
      };
    });
  },
  cloud: Parse.Cloud,
});

function currentUserPointer() {
  const user = Parse.User.current();
  return user ? Parse.User.createWithoutData(user.id ?? '') : null;
}

export const prayerService = createPrayerService({
  fetchRequests: async (status: PrayerStatus): Promise<RawPrayerRequest[]> => {
    const rows = await new Parse.Query('PrayerRequest')
      .equalTo('status', status)
      .include('author')
      .descending('createdAt')
      .limit(200)
      .find();
    return rows.map((row) => {
      const author = row.get('author') as Parse.User | undefined;
      const answeredAt = row.get('answeredAt') as Date | undefined;
      return {
        id: row.id ?? '',
        title: String(row.get('title') ?? ''),
        description: String(row.get('description') ?? ''),
        category: String(row.get('category') ?? 'other'),
        urgency: String(row.get('urgency') ?? 'normal'),
        status: String(row.get('status') ?? 'active'),
        prayingCount: Number(row.get('prayingCount') ?? 0),
        createdAt: row.createdAt?.toISOString() ?? '',
        answeredAt: answeredAt ? answeredAt.toISOString() : null,
        testimony: (row.get('testimony') as string | undefined) ?? null,
        author: author
          ? { id: author.id ?? '', displayName: author.get('displayName') as string | undefined }
          : null,
      };
    });
  },
  fetchMyPrayingRequestIds: async () => {
    const me = currentUserPointer();
    if (!me) return [];
    const rows = await new Parse.Query('PrayerResponse').equalTo('user', me).limit(500).find();
    return rows
      .map((row) => (row.get('prayerRequest') as Parse.Object | undefined)?.id ?? '')
      .filter(Boolean);
  },
  fetchPrayingNames: async (requestId: string) => {
    const rows = await new Parse.Query('PrayerResponse')
      .equalTo('prayerRequest', Parse.Object.extend('PrayerRequest').createWithoutData(requestId))
      .include('user')
      .limit(200)
      .find();
    return rows.map((row) => {
      const user = row.get('user') as Parse.User | undefined;
      return (user?.get('displayName') as string | undefined)?.trim() || 'Member';
    });
  },
  cloud: Parse.Cloud,
});
