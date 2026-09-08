import 'react-native-get-random-values';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Parse from 'parse/react-native.js';

import { loadParseConfig } from '../config';
import { createParseAuthService } from '../features/auth/service';
import { createMembersService } from '../features/members/service';
import type { RawMembership } from '../features/members/types';

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
