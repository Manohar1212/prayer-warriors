#!/usr/bin/env node
// One-time setup: creates the PrayerRequest class on Back4App and opens
// class-level permissions for public read/create/update (no auth in v1).
//
// Usage:
//   PARSE_APP_ID=... PARSE_MASTER_KEY=... node scripts/setup-schema.mjs
// Optional: PARSE_SERVER_URL (defaults to https://parseapi.back4app.com)

const serverUrl = process.env.PARSE_SERVER_URL ?? 'https://parseapi.back4app.com';
const appId = process.env.PARSE_APP_ID;
const masterKey = process.env.PARSE_MASTER_KEY;

if (!appId || !masterKey) {
  console.error('Set PARSE_APP_ID and PARSE_MASTER_KEY.');
  process.exit(1);
}

const headers = {
  'X-Parse-Application-Id': appId,
  'X-Parse-Master-Key': masterKey,
  'Content-Type': 'application/json',
};

const schema = {
  className: 'PrayerRequest',
  fields: {
    title: { type: 'String', required: true },
    details: { type: 'String' },
    author: { type: 'String' },
    prayerCount: { type: 'Number', defaultValue: 0 },
  },
  classLevelPermissions: {
    find: { '*': true },
    get: { '*': true },
    count: { '*': true },
    create: { '*': true },
    update: { '*': true },
    delete: {},
    addField: {},
    protectedFields: {},
  },
};

const url = `${serverUrl}/schemas/PrayerRequest`;
let res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(schema) });
if (res.status === 400) {
  // Class already exists: update permissions/fields instead.
  res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(schema) });
}
const body = await res.json();
if (!res.ok) {
  console.error('Schema setup failed:', body);
  process.exit(1);
}
console.log('PrayerRequest class ready:', Object.keys(body.fields ?? {}).join(', '));
