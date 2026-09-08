import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const dbPath = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'apps', 'mobile', 'assets', 'bible', 'bible-v2.db');

test('bible database is complete in both languages', () => {
  assert.ok(existsSync(dbPath), 'run node scripts/bible/build.mjs first');
  assert.ok(statSync(dbPath).size < 40 * 1024 * 1024, 'database should stay under 40 MB');
  const db = new DatabaseSync(dbPath, { readOnly: true });
  const one = (sql, ...p) => db.prepare(sql).get(...p);
  const verse = (lang, code, chapter, verse) =>
    one('SELECT v.text, v.label, b.name_en, b.name_te FROM verses v JOIN books b ON b.id = v.book WHERE v.lang = ? AND b.code = ? AND v.chapter = ? AND v.verse = ?', lang, code, chapter, verse);

  assert.equal(one('SELECT COUNT(*) AS n FROM books').n, 66);
  assert.equal(one("SELECT COUNT(*) AS n FROM books WHERE testament = 'NT'").n, 27);
  assert.equal(one('SELECT SUM(chapters_en) AS n FROM books').n, 1189);
  assert.equal(one('SELECT SUM(chapters_te) AS n FROM books').n, 1189);
  assert.ok(one("SELECT COUNT(*) AS n FROM verses WHERE lang = 'en'").n >= 31000, 'English verse count');
  assert.ok(one("SELECT COUNT(*) AS n FROM verses WHERE lang = 'te'").n >= 30900, 'Telugu verse count');
  assert.equal(one("SELECT COUNT(*) AS n FROM verses WHERE text = ''").n, 0);
  assert.equal(one("SELECT COUNT(*) AS n FROM verses WHERE text LIKE '%\\%'").n, 0, 'no USFM markers left');
  assert.equal(one("SELECT COUNT(*) AS n FROM verses WHERE text LIKE '%strong=%'").n, 0, 'no Strong attributes left');

  assert.equal(verse('en', 'GEN', 1, 1).text, 'In the beginning God created the heavens and the earth.');
  assert.equal(verse('te', 'GEN', 1, 1).text, 'ఆదియందు దేవుడు భూమ్యాకాశములను సృజించెను.');
  assert.match(verse('en', 'JHN', 3, 16).text, /God so loved the world/);
  assert.match(verse('te', 'JHN', 3, 16).name_te, /యోహాను/);
  assert.ok(verse('te', 'JHN', 3, 16).text.length > 20);
  assert.match(verse('en', 'MAL', 4, 1).text, /day is coming|day comes/i);
  assert.ok(verse('te', 'MAL', 4, 1), 'Telugu Malachi 4 present');
  assert.match(verse('en', 'PSA', 23, 1).text, /shepherd/i);
  assert.match(verse('te', 'JHN', 3, 16).text, /లోకమును/);
  assert.equal(one('SELECT chapters_en FROM books WHERE code = ?', 'PSA').chapters_en, 150);
  assert.match(one('SELECT short_te FROM books WHERE code = ?', 'JHN').short_te, /యోహాను/);
  assert.equal(one("SELECT COUNT(*) AS n FROM books WHERE short_te = ''").n, 0);
  assert.equal(one("SELECT value FROM meta WHERE key = 'version'").value, '2');
  assert.match(one("SELECT value FROM meta WHERE key = 'attribution_te'").value, /public domain/);
  assert.match(one("SELECT value FROM meta WHERE key = 'attribution_en'").value, /Berean/);
  db.close();
});
