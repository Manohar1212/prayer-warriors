import 'react-native-get-random-values';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Parse from 'parse/react-native.js';

import { loadParseConfig } from '../config';
import { createParseAuthService } from '../features/auth/service';
import { createMembersService } from '../features/members/service';
import type { RawMembership } from '../features/members/types';
import { createJournalService } from '../features/prayer/journal';
import { createPrayerService } from '../features/prayer/service';
import { createResourcesService } from '../features/resources/service';
import type { RawResource } from '../features/resources/types';
import type { JournalInput, PrayerStatus, RawJournalEntry, RawPrayerRequest } from '../features/prayer/types';

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

const JournalEntryObject = Parse.Object.extend('PrayerJournalEntry');

function journalRow(row: Parse.Object): RawJournalEntry {
  const answeredAt = row.get('answeredAt') as Date | undefined;
  return {
    id: row.id ?? '',
    title: String(row.get('title') ?? ''),
    body: String(row.get('body') ?? ''),
    category: String(row.get('category') ?? 'other'),
    answered: Boolean(row.get('answered')),
    createdAt: row.createdAt?.toISOString() ?? '',
    answeredAt: answeredAt ? answeredAt.toISOString() : null,
  };
}

export const journalService = createJournalService({
  fetchEntries: async () => {
    const me = currentUserPointer();
    if (!me) return [];
    const rows = await new Parse.Query('PrayerJournalEntry')
      .equalTo('user', me)
      .descending('createdAt')
      .limit(500)
      .find();
    return rows.map(journalRow);
  },
  saveEntry: async (input: JournalInput) => {
    const row: Parse.Object = input.id
      ? await new Parse.Query('PrayerJournalEntry').get(input.id)
      : new JournalEntryObject();
    const wasAnswered = Boolean(row.get('answered'));
    row.set('title', input.title);
    row.set('body', input.body);
    row.set('category', input.category);
    row.set('answered', input.answered);
    if (input.answered && !wasAnswered) row.set('answeredAt', new Date());
    if (!input.answered) row.unset('answeredAt');
    await row.save();
    return journalRow(row);
  },
  deleteEntry: async (id: string) => {
    const row = await new Parse.Query('PrayerJournalEntry').get(id);
    await row.destroy();
  },
});

export const resourcesService = createResourcesService({
  fetchResources: async (): Promise<RawResource[]> => {
    const rows = await new Parse.Query('Resource')
      .include('createdBy')
      .descending('createdAt')
      .limit(500)
      .find();
    return rows.map((row) => {
      const by = row.get('createdBy') as Parse.User | undefined;
      return {
        id: row.id ?? '',
        type: String(row.get('type') ?? 'song'),
        title: String(row.get('title') ?? ''),
        body: String(row.get('body') ?? ''),
        reference: String(row.get('reference') ?? ''),
        url: String(row.get('url') ?? ''),
        note: String(row.get('note') ?? ''),
        createdAt: row.createdAt?.toISOString() ?? '',
        createdBy: by ? { id: by.id ?? '', displayName: by.get('displayName') as string | undefined } : null,
      };
    });
  },
  cloud: Parse.Cloud,
});
