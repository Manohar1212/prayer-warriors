#!/usr/bin/env node
// Adds a `key` column to the verses table so the app can search Telugu verses typed in
// English letters (see apps/mobile/src/features/resources/transliterate.ts).
// Usage: node scripts/bible/add-search-keys.mjs <in.db> <out.db>
import { copyFileSync, existsSync, unlinkSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

import { verseKey } from '../../apps/mobile/src/features/resources/transliterate.ts';

const [, , input, output] = process.argv;
if (!input || !output) throw new Error('usage: add-search-keys.mjs <in.db> <out.db>');
if (existsSync(output)) unlinkSync(output);
copyFileSync(input, output);
const db = new DatabaseSync(output);
db.exec('PRAGMA journal_mode = OFF; PRAGMA synchronous = OFF;');
const cols = db.prepare('PRAGMA table_info(verses)').all().map((c) => c.name);
if (!cols.includes('key')) db.exec('ALTER TABLE verses ADD COLUMN key TEXT NOT NULL DEFAULT \'\'');
const rows = db.prepare('SELECT lang, book, chapter, verse, text FROM verses').all();
const update = db.prepare('UPDATE verses SET key = ? WHERE lang = ? AND book = ? AND chapter = ? AND verse = ?');
const started = Date.now();
db.exec('BEGIN');
// English text is searched directly (LIKE is case-insensitive for ASCII); only Telugu needs a phonetic key.
for (const r of rows) update.run(r.lang === 'te' ? verseKey(r.text, 'te') : '', r.lang, r.book, r.chapter, r.verse);
db.exec('COMMIT');
db.exec('VACUUM');
const sample = db.prepare("SELECT text, key FROM verses WHERE lang = 'te' AND book = 43 AND chapter = 3 AND verse = 16").get();
db.close();
console.log(`keyed ${rows.length} verses in ${Date.now() - started} ms`);
console.log('John 3:16 te:', sample?.text?.slice(0, 60));
console.log('key:', sample?.key?.slice(0, 80));
