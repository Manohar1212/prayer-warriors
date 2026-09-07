import type { ParseConfig } from './api/prayerRequests';

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and fill in your Back4App keys.`,
    );
  }
  return value;
}

export function loadParseConfig(): ParseConfig {
  return {
    serverUrl: process.env.EXPO_PUBLIC_PARSE_SERVER_URL ?? 'https://parseapi.back4app.com',
    appId: required('EXPO_PUBLIC_PARSE_APP_ID', process.env.EXPO_PUBLIC_PARSE_APP_ID),
    jsKey: required('EXPO_PUBLIC_PARSE_JS_KEY', process.env.EXPO_PUBLIC_PARSE_JS_KEY),
  };
}
