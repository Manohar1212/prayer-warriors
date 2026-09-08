#!/usr/bin/env node
// Builds apps/mobile/assets/bible/bible-v2.db from public-domain sources.
//   English: Berean Standard Bible (eBible.org id engbsb, USFM) — public domain
//   Telugu:  పరిశుద్ధ గ్రంథము, the 1880 Telugu Old Version — public domain text, JSON data from
//            github.com/aruljohn/Bible-telugu (MIT)
// Each language keeps its own verse numbering.
// Usage: node scripts/bible/build.mjs   (downloads are cached in scripts/bible/.cache/)

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const cache = join(here, '.cache');
const out = join(here, '..', '..', 'apps', 'mobile', 'assets', 'bible', 'bible-v2.db');

const EN = { id: 'engbsb', url: 'https://ebible.org/Scriptures/engbsb_usfm.zip' };
const TE_RAW = 'https://raw.githubusercontent.com/aruljohn/Bible-telugu/master/';

// Protestant canon in order: [code, English name]
const CANON = [
  ['GEN', 'Genesis'], ['EXO', 'Exodus'], ['LEV', 'Leviticus'], ['NUM', 'Numbers'], ['DEU', 'Deuteronomy'],
  ['JOS', 'Joshua'], ['JDG', 'Judges'], ['RUT', 'Ruth'], ['1SA', '1 Samuel'], ['2SA', '2 Samuel'],
  ['1KI', '1 Kings'], ['2KI', '2 Kings'], ['1CH', '1 Chronicles'], ['2CH', '2 Chronicles'], ['EZR', 'Ezra'],
  ['NEH', 'Nehemiah'], ['EST', 'Esther'], ['JOB', 'Job'], ['PSA', 'Psalms'], ['PRO', 'Proverbs'],
  ['ECC', 'Ecclesiastes'], ['SNG', 'Song of Songs'], ['ISA', 'Isaiah'], ['JER', 'Jeremiah'], ['LAM', 'Lamentations'],
  ['EZK', 'Ezekiel'], ['DAN', 'Daniel'], ['HOS', 'Hosea'], ['JOL', 'Joel'], ['AMO', 'Amos'],
  ['OBA', 'Obadiah'], ['JON', 'Jonah'], ['MIC', 'Micah'], ['NAM', 'Nahum'], ['HAB', 'Habakkuk'],
  ['ZEP', 'Zephaniah'], ['HAG', 'Haggai'], ['ZEC', 'Zechariah'], ['MAL', 'Malachi'],
  ['MAT', 'Matthew'], ['MRK', 'Mark'], ['LUK', 'Luke'], ['JHN', 'John'], ['ACT', 'Acts'],
  ['ROM', 'Romans'], ['1CO', '1 Corinthians'], ['2CO', '2 Corinthians'], ['GAL', 'Galatians'], ['EPH', 'Ephesians'],
  ['PHP', 'Philippians'], ['COL', 'Colossians'], ['1TH', '1 Thessalonians'], ['2TH', '2 Thessalonians'], ['1TI', '1 Timothy'],
  ['2TI', '2 Timothy'], ['TIT', 'Titus'], ['PHM', 'Philemon'], ['HEB', 'Hebrews'], ['JAS', 'James'],
  ['1PE', '1 Peter'], ['2PE', '2 Peter'], ['1JN', '1 John'], ['2JN', '2 John'], ['3JN', '3 John'],
  ['JUD', 'Jude'], ['REV', 'Revelation'],
];
const bookId = new Map(CANON.map(([code], i) => [code, i + 1]));

// Whole lines to drop: headings, front matter, titles, references.
const SKIP_LINE = /^\\(id|ide|usfm|sts|rem|h|toc\d|mt\d?|mte\d?|ms\d?|mr|s\d?|sr|r|sp|d|cl|cp|cd|qa|is\d?|ip|ipi|im|imi|ipq|imq|ipr|iq\d?|ib|ili\d?|iot|io\d?|iex|imte|ie|periph|restore|lit|tr|th\d|thr\d|tc\d|tcr\d|pb)\b/;

async function fetchCached(name, url) {
  const path = join(cache, name);
  if (existsSync(path)) return path;
  mkdirSync(cache, { recursive: true });
  process.stdout.write(`downloading ${name}… `);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  console.log('done');
  return path;
}

function unzip(zipPath, dirName) {
  const dir = join(cache, dirName);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  execFileSync('unzip', ['-qo', zipPath, '-d', dir]);
  return dir;
}

/** Strips notes and inline markup from a USFM fragment, leaving plain text. */
function plain(fragment) {
  return fragment
    .replace(/\\(f|fe|x|fig)\s[\s\S]*?\\\1\*/g, ' ') // footnotes, endnotes, cross references, figures
    .replace(/\\\+?(vp|va|ca)\s[\s\S]*?\\\+?\1\*/g, ' ') // published/alternate verse & chapter numbers
    .replace(/\\\+?w\s([^|\\]*?)(?:\|[^\\]*?)?\\\+?w\*/g, '$1') // \w word|strong="…"\w* → word
    .replace(/\\\+?[a-z0-9]+\*/g, '') // closing character markers
    .replace(/\\\+?[a-z0-9]+\s?/g, ' ') // remaining paragraph/character markers
    .replace(/~/g, ' ')
    .replace(/\/\//g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Parses one USFM book into [{ chapter, verse, label, text }] and the chapter count. */
function parseBook(usfm) {
  const verses = new Map(); // key "c:v" → { chapter, verse, label, parts: [] }
  let chapter = 0;
  let current = null;
  let chapters = 0;
  for (const rawLine of usfm.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const c = /^\\c\s+(\d+)/.exec(line);
    if (c) {
      chapter = Number(c[1]);
      chapters = Math.max(chapters, chapter);
      current = null;
      continue;
    }
    if (SKIP_LINE.test(line) || chapter === 0) continue;
    const segments = line.split(/\\v\s+(\d+[a-z]?(?:[-–]\d+[a-z]?)?)\s?/);
    // segments: [textBeforeFirstV, label1, text1, label2, text2, ...]
    const lead = plain(segments[0]);
    if (lead && current) current.parts.push(lead);
    for (let i = 1; i < segments.length; i += 2) {
      const label = segments[i];
      const verse = Number(/^\d+/.exec(label)[0]);
      const key = `${chapter}:${verse}`;
      if (!verses.has(key)) verses.set(key, { chapter, verse, label: label.replace('–', '-'), parts: [] });
      current = verses.get(key);
      const text = plain(segments[i + 1] || '');
      if (text) current.parts.push(text);
    }
  }
  return {
    chapters,
    verses: [...verses.values()].map((v) => ({ ...v, text: v.parts.join(' ').replace(/\s+/g, ' ').trim() })),
  };
}

function readBooks(dir) {
  const books = new Map(); // code → { name, chapters, verses }
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.usfm'))) {
    const usfm = readFileSync(join(dir, file), 'utf8');
    const id = /^\\id\s+([1-3A-Z]{3})/m.exec(usfm);
    if (!id || !bookId.has(id[1])) continue;
    const h = /^\\h\s+(.+)$/m.exec(usfm);
    const short = /^\\toc2\s+(.+)$/m.exec(usfm);
    const { chapters, verses } = parseBook(usfm);
    books.set(id[1], { name: h ? h[1].trim() : id[1], short: short ? short[1].trim() : '', chapters, verses });
  }
  return books;
}

/** Telugu OV from per-book JSON: { book: { english, telugu }, chapters: [{ chapter, verses: [{ verse, text }] }] }. */
async function readTeluguBooks() {
  const dir = join(cache, 'telov');
  mkdirSync(dir, { recursive: true });
  const fetchJson = async (name) => {
    const path = join(dir, name);
    if (!existsSync(path)) {
      const res = await fetch(TE_RAW + encodeURIComponent(name));
      if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
      writeFileSync(path, Buffer.from(await res.arrayBuffer()));
    }
    return JSON.parse(readFileSync(path, 'utf8'));
  };
  const index = await fetchJson('Books.json');
  if (index.length !== CANON.length) throw new Error(`expected 66 Telugu books, got ${index.length}`);
  const books = new Map();
  for (let i = 0; i < CANON.length; i += 1) {
    const english = index[i].book.english;
    const data = await fetchJson(`${english}.json`);
    const verses = [];
    let chapters = 0;
    for (const ch of data.chapters) {
      const chapter = Number(ch.chapter);
      chapters = Math.max(chapters, chapter);
      for (const v of ch.verses) {
        const label = String(v.verse).trim();
        const verse = Number(/^\d+/.exec(label)?.[0] ?? 0);
        const text = String(v.text || '').replace(/\s+/g, ' ').trim();
        if (verse > 0 && text) verses.push({ chapter, verse, label, text });
      }
    }
    const name = String(data.book?.telugu || index[i].book.telugu || CANON[i][1]).trim();
    books.set(CANON[i][0], { name, short: name, chapters, verses });
  }
  return books;
}

const sources = {
  en: readBooks(unzip(await fetchCached(`${EN.id}_usfm.zip`, EN.url), `${EN.id}_usfm`)),
  te: await readTeluguBooks(),
};

if (existsSync(out)) unlinkSync(out);
mkdirSync(dirname(out), { recursive: true });
const db = new DatabaseSync(out);
db.exec(`
  PRAGMA journal_mode = OFF;
  PRAGMA synchronous = OFF;
  CREATE TABLE books (id INTEGER PRIMARY KEY, code TEXT NOT NULL, testament TEXT NOT NULL, name_en TEXT NOT NULL, name_te TEXT NOT NULL, short_te TEXT NOT NULL, chapters_en INTEGER NOT NULL, chapters_te INTEGER NOT NULL);
  CREATE TABLE verses (lang TEXT NOT NULL, book INTEGER NOT NULL, chapter INTEGER NOT NULL, verse INTEGER NOT NULL, label TEXT NOT NULL, text TEXT NOT NULL, PRIMARY KEY (lang, book, chapter, verse)) WITHOUT ROWID;
  CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`);
const insertBook = db.prepare('INSERT INTO books VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
const insertVerse = db.prepare('INSERT INTO verses VALUES (?, ?, ?, ?, ?, ?)');
const counts = { en: 0, te: 0, empty: 0 };
db.exec('BEGIN');
CANON.forEach(([code, nameEn], i) => {
  const id = i + 1;
  const en = sources.en.get(code);
  const te = sources.te.get(code);
  if (!en || !te) throw new Error(`missing book ${code}`);
  insertBook.run(id, code, id <= 39 ? 'OT' : 'NT', nameEn, te.name, te.short || te.name, en.chapters, te.chapters);
  for (const [lang, book] of [['en', en], ['te', te]]) {
    for (const v of book.verses) {
      if (!v.text) {
        counts.empty += 1;
        continue;
      }
      insertVerse.run(lang, id, v.chapter, v.verse, v.label, v.text);
      counts[lang] += 1;
    }
  }
});
db.exec('COMMIT');
const insertMeta = db.prepare('INSERT INTO meta VALUES (?, ?)');
insertMeta.run('version', '2');
insertMeta.run('built_at', new Date().toISOString());
insertMeta.run('attribution_en', 'Berean Standard Bible, public domain (berean.bible, via ebible.org)');
insertMeta.run('attribution_te', 'పరిశుద్ధ గ్రంథము (Telugu Old Version, 1880), public domain — data from github.com/aruljohn/Bible-telugu (MIT)');
insertMeta.run('source', 'https://ebible.org/Scriptures/engbsb_usfm.zip; https://github.com/aruljohn/Bible-telugu');
db.exec('VACUUM');
db.close();

const sum = (lang) => [...sources[lang].values()].reduce((a, b) => a + b.chapters, 0);
console.log(`books=66 chapters en=${sum('en')} te=${sum('te')} verses en=${counts.en} te=${counts.te} empty_skipped=${counts.empty}`);
console.log(`wrote ${out}`);
