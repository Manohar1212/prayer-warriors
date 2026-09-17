import 'react-native-get-random-values';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Parse from 'parse/react-native.js';

import { loadParseConfig } from '../config';
import { createParseAuthService } from '../features/auth/service';
import { createMembersService } from '../features/members/service';
import type { RawMembership } from '../features/members/types';
import { createJournalService } from '../features/prayer/journal';
import { createPrayerService } from '../features/prayer/service';
import { createCallsService } from '../features/calls/service';
import type { RawCall, RawParticipant } from '../features/calls/types';
import { createFundsService } from '../features/funds/service';
import type { RawAuditEntry, RawContribution, RawExpense } from '../features/funds/types';
import { createNotificationsService } from '../features/notifications/service';
import type { RawNotification } from '../features/notifications/types';
import { createResourcesService } from '../features/resources/service';
import type { RawResource } from '../features/resources/types';
import type { JournalInput, PrayerStatus, RawJournalEntry, RawPrayerComment, RawPrayerRequest } from '../features/prayer/types';
import { createPrayerPointsService } from '../features/prayer/points';
import { createQuizService } from '../features/quiz/service';

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

export const prayerPointsService = createPrayerPointsService({ cloud: Parse.Cloud, currentUserId: () => Parse.User.current()?.id ?? null });
export const quizService = createQuizService({ cloud: Parse.Cloud });

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
  fetchComments: async (requestId: string): Promise<RawPrayerComment[]> => {
    const rows = await new Parse.Query('PrayerComment')
      .equalTo('prayerRequest', Parse.Object.extend('PrayerRequest').createWithoutData(requestId))
      .include('user')
      .ascending('createdAt')
      .limit(200)
      .find();
    return rows.map((row) => ({
      id: row.id ?? '',
      body: String(row.get('body') ?? ''),
      createdAt: row.createdAt?.toISOString() ?? '',
      user: userSummary(row.get('user') as Parse.User | undefined),
    }));
  },
  currentUserName: () => (Parse.User.current()?.get('displayName') as string | undefined) || 'You',
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

function userSummary(user: Parse.User | undefined) {
  return user ? { id: user.id ?? '', displayName: user.get('displayName') as string | undefined } : null;
}

function isoOf(value: unknown): string {
  return value instanceof Date ? value.toISOString() : '';
}

export const fundsService = createFundsService({
  fetchContributions: async (): Promise<RawContribution[]> => {
    const rows = await new Parse.Query('Contribution').include('member').descending('transactionDate').limit(1000).find();
    return rows.map((row) => ({
      id: row.id ?? '',
      member: userSummary(row.get('member') as Parse.User | undefined),
      amountPaise: Number(row.get('amountPaise') ?? 0),
      transactionDate: isoOf(row.get('transactionDate')),
      paymentMethod: String(row.get('paymentMethod') ?? 'other'),
      reference: String(row.get('reference') ?? ''),
      note: String(row.get('note') ?? ''),
      createdAt: row.createdAt?.toISOString() ?? '',
    }));
  },
  fetchExpenses: async (): Promise<RawExpense[]> => {
    const rows = await new Parse.Query('Expense').descending('transactionDate').limit(1000).find();
    return rows.map((row) => ({
      id: row.id ?? '',
      category: String(row.get('category') ?? 'other'),
      amountPaise: Number(row.get('amountPaise') ?? 0),
      paidTo: String(row.get('paidTo') ?? ''),
      description: String(row.get('description') ?? ''),
      transactionDate: isoOf(row.get('transactionDate')),
      createdAt: row.createdAt?.toISOString() ?? '',
    }));
  },
  fetchAudit: async (): Promise<RawAuditEntry[]> => {
    const rows = await new Parse.Query('FinancialAuditLog').include('user').descending('createdAt').limit(500).find();
    return rows.map((row) => ({
      id: row.id ?? '',
      user: userSummary(row.get('user') as Parse.User | undefined),
      entityType: String(row.get('entityType') ?? ''),
      entityId: String(row.get('entityId') ?? ''),
      action: String(row.get('action') ?? ''),
      reason: (row.get('reason') as string | undefined) ?? null,
      oldValues: (row.get('oldValues') as Record<string, unknown> | undefined) ?? null,
      newValues: (row.get('newValues') as Record<string, unknown> | undefined) ?? null,
      createdAt: row.createdAt?.toISOString() ?? '',
    }));
  },
  cloud: Parse.Cloud,
});

export const callsService = createCallsService({
  fetchCalls: async (): Promise<RawCall[]> => {
    const rows = await new Parse.Query('Call').descending('scheduledAt').limit(200).find();
    return rows.map((row) => ({
      id: row.id ?? '',
      title: String(row.get('title') ?? ''),
      scheduledAt: isoOf(row.get('scheduledAt')),
      status: String(row.get('status') ?? 'scheduled'),
      startedAt: row.get('startedAt') instanceof Date ? isoOf(row.get('startedAt')) : null,
      endedAt: row.get('endedAt') instanceof Date ? isoOf(row.get('endedAt')) : null,
      createdBy: userSummary(row.get('createdBy') as Parse.User | undefined),
    }));
  },
  fetchParticipants: async (callId?: string): Promise<RawParticipant[]> => {
    const query = new Parse.Query('CallParticipant').include('user').limit(1000);
    if (callId) query.equalTo('call', Parse.Object.extend('Call').createWithoutData(callId));
    const rows = await query.find();
    return rows.map((row) => ({
      callId: (row.get('call') as Parse.Object | undefined)?.id ?? '',
      user: userSummary(row.get('user') as Parse.User | undefined),
      leftAt: row.get('leftAt') instanceof Date ? isoOf(row.get('leftAt')) : null,
    }));
  },
  cloud: Parse.Cloud,
});

export const notificationsService = createNotificationsService({
  fetchNotifications: async (): Promise<RawNotification[]> => {
    const rows = await new Parse.Query('Notification').descending('createdAt').limit(200).find();
    return rows.map((row) => ({
      id: row.id ?? '',
      type: String(row.get('type') ?? ''),
      title: String(row.get('title') ?? ''),
      body: String(row.get('body') ?? ''),
      route: String(row.get('route') ?? ''),
      createdAt: isoOf(row.createdAt),
      readAt: row.get('readAt') instanceof Date ? isoOf(row.get('readAt')) : null,
    }));
  },
  countUnread: () => new Parse.Query('Notification').doesNotExist('readAt').count(),
  fetchPrefs: async () => {
    const user = await Parse.User.currentAsync();
    if (!user) return null;
    await user.fetch();
    const prefs = user.get('notificationPrefs');
    return prefs && typeof prefs === 'object' ? (prefs as Record<string, unknown>) : null;
  },
  cloud: Parse.Cloud,
});
