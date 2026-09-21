#!/usr/bin/env node
// Builds apps/mobile/src/features/home/promiseTranslations.ts: the Daily Promise passages in the
// languages the full Bible does not carry. Only the passages in DAILY_VERSES are kept, so the file
// stays a few kilobytes instead of four more Bibles.
//   Tamil:     Tamil Old Version (public domain) — JSON from github.com/aruljohn/Bible-tamil (MIT)
//   Kannada:   Kannada Old Version (public domain) — github.com/godlytalias/Bible-Database
//   Hindi:     Hindi Old Version (public domain) — github.com/godlytalias/Bible-Database
//   Malayalam: Sathyavedapusthakam 1910 in contemporary orthography, © 2015 The Free Bible
//              Foundation, CC BY-SA 4.0 (eBible.org id mal2015)
// Usage: node scripts/promise/build.mjs   (downloads are cached in scripts/promise/.cache/)

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

import { DAILY_VERSES, passageKey, verseRange } from '../../apps/mobile/src/features/home/verseOfTheDay.ts';

const here = dirname(fileURLToPath(import.meta.url));
const cache = join(here, '.cache');
const out = join(here, '..', '..', 'apps', 'mobile', 'src', 'features', 'home', 'promiseTranslations.ts');

const TA_RAW = 'https://raw.githubusercontent.com/aruljohn/Bible-tamil/master/';
const GODLY_RAW = 'https://raw.githubusercontent.com/godlytalias/Bible-Database/master/';
const ML_ZIP = 'https://ebible.org/Scriptures/mal2015_usfm.zip';

// Protestant canon order; index = book number in the godlytalias databases.
const CODES = 'GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV'.split(' ');

async function fetchCached(name, url) {
  const path = join(cache, name);
  if (existsSync(path)) return path;
  mkdirSync(dirname(path), { recursive: true });
  process.stdout.write(`downloading ${name}… `);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  console.log('done');
  return path;
}

const clean = (s) => String(s).replace(/\s+/g, ' ').trim();

/** Each source answers (code, chapter, verse) → text, and code → book name. */
async function tamil() {
  const index = JSON.parse(readFileSync(await fetchCached('tamil/Books.json', `${TA_RAW}Books.json`), 'utf8'));
  const books = new Map();
  const load = async (code) => {
    if (!books.has(code)) {
      const english = index[CODES.indexOf(code)].book.english;
      books.set(code, JSON.parse(readFileSync(await fetchCached(`tamil/${english}.json`, TA_RAW + encodeURIComponent(`${english}.json`)), 'utf8')));
    }
    return books.get(code);
  };
  return {
    name: async (code) => clean(index[CODES.indexOf(code)].book.tamil),
    verse: async (code, chapter, verse) => {
      const ch = (await load(code)).chapters.find((c) => Number(c.chapter) === chapter);
      return ch?.verses.find((v) => Number(v.verse) === verse)?.text ?? '';
    },
  };
}

/** godlytalias: sqlite `bible(Book 0-65, Chapter, Versecount, verse)` and a C array of book names. */
async function godly(lang) {
  const db = new DatabaseSync(await fetchCached(`${lang}.db`, `${GODLY_RAW}${lang}/holybible.db`), { readOnly: true });
  const header = readFileSync(await fetchCached(`${lang}-books.h`, `${GODLY_RAW}${lang}/books.h`), 'utf8');
  const names = [...header.matchAll(/"([^"]*)"/g)].map((m) => clean(m[1]));
  if (names.length !== 66) throw new Error(`${lang}: expected 66 book names, got ${names.length}`);
  const stmt = db.prepare('SELECT verse FROM bible WHERE Book = ? AND Chapter = ? AND Versecount = ?');
  return {
    name: async (code) => names[CODES.indexOf(code)],
    verse: async (code, chapter, verse) => stmt.get(CODES.indexOf(code), chapter, verse)?.verse ?? '',
  };
}

/** Malayalam USFM, one file per book; only plain verse lines matter for these passages. */
async function malayalam() {
  const dir = join(cache, 'mal2015_usfm');
  if (!existsSync(dir)) execFileSync('unzip', ['-qo', await fetchCached('mal2015_usfm.zip', ML_ZIP), '-d', dir]);
  const books = new Map();
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.usfm'))) {
    const usfm = readFileSync(join(dir, file), 'utf8');
    const code = /^\\id\s+([1-3A-Z]{3})/m.exec(usfm)?.[1];
    if (!code) continue;
    const verses = new Map();
    let chapter = 0;
    let key = null;
    for (const raw of usfm.split(/\r?\n/)) {
      const line = raw.trim();
      const c = /^\\c\s+(\d+)/.exec(line);
      if (c) {
        chapter = Number(c[1]);
        key = null;
        continue;
      }
      if (/^\\(s\d?|r|d|ms\d?|mr|h|toc\d|mt\d?|id|ide|rem|cl)\b/.test(line)) continue;
      for (const part of line.split(/(?=\\v\s+\d+)/)) {
        const v = /^\\v\s+(\d+)\S*\s*/.exec(part);
        if (v) key = `${chapter}:${Number(v[1])}`;
        if (!key) continue;
        const text = part
          .replace(/^\\v\s+\S+\s*/, '')
          .replace(/\\(f|x)\s[\s\S]*?\\\1\*/g, ' ')
          .replace(/\\\+?[a-z0-9]+\*?\s?/g, ' ');
        verses.set(key, clean(`${verses.get(key) ?? ''} ${text}`));
      }
    }
    // "1. തെസ്സലൊനീക്യർ" → "1 തെസ്സലൊനീക്യർ", like the other languages.
    books.set(code, { name: clean(/^\\h\s+(.+)$/m.exec(usfm)?.[1] ?? code).replace(/^(\d)\.\s*/, '$1 '), verses });
  }
  return {
    name: async (code) => books.get(code).name,
    verse: async (code, chapter, verse) => books.get(code)?.verses.get(`${chapter}:${verse}`) ?? '',
  };
}

const sources = { ta: await tamil(), kn: await godly('Kannada'), ml: await malayalam(), hi: await godly('Hindi') };

const result = {};
for (const [lang, src] of Object.entries(sources)) {
  result[lang] = {};
  for (const p of DAILY_VERSES) {
    const parts = [];
    for (let v = p.from; v <= p.to; v += 1) parts.push(clean(await src.verse(p.code, p.chapter, v)));
    if (parts.some((t) => !t)) throw new Error(`${lang}: missing text for ${passageKey(p)}`);
    result[lang][passageKey(p)] = { text: parts.join(' '), reference: `${await src.name(p.code)} ${p.chapter}:${verseRange(p)}` };
  }
}

writeFileSync(
  out,
  `// Generated by scripts/promise/build.mjs — do not edit by hand.
// Tamil, Kannada and Hindi: the Old Versions, public domain.
// Malayalam: Sathyavedapusthakam 1910, contemporary orthography, © 2015 The Free Bible Foundation, CC BY-SA 4.0.

export const PROMISE_TRANSLATIONS: Record<'ta' | 'kn' | 'ml' | 'hi', Record<string, { text: string; reference: string }>> = ${JSON.stringify(result, null, 2)};
`,
);
console.log(`wrote ${out}: ${DAILY_VERSES.length} passages × ${Object.keys(sources).length} languages`);
