import 'react-native-get-random-values';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Parse from 'parse/react-native.js';

import { loadParseConfig } from '../config';
import { createParseAuthService } from '../features/auth/service';

const config = loadParseConfig();

Parse.setAsyncStorage(AsyncStorage);
Parse.initialize(config.appId, config.jsKey);
Parse.serverURL = config.serverUrl;

export { Parse };
export const parseAuthService = createParseAuthService({ User: Parse.User });
