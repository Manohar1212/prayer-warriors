import { searchKey } from './transliterate';

/**
 * The search layer for songbooks. A song is indexed once into loose Latin words (see
 * `searchKey`); a query is matched word by word in any order, tolerating typos and joined
 * words, and results are ranked so the best match comes first: title hits, whole-phrase hits,
 * exact words, then prefixes and near-misses.
 */

export type SongText = { title: string; body: string; extra?: string };

type Index = {
  titleKey: string;
  key: string;
  /** Key without spaces, so "naapraana" still finds "నా ప్రాణ" and vice versa. */
  joined: string;
  words: string[];
};

const indexes = new WeakMap<object, Index>();

function buildIndex(text: SongText): Index {
  const titleKey = searchKey(text.title);
  const key = searchKey(`${text.title} ${text.extra ?? ''} ${text.body}`);
  return { titleKey, key, joined: key.replace(/ /g, ''), words: [...new Set(key.split(' ').filter(Boolean))] };
}

export function indexFor(item: object, text: SongText): Index {
  let index = indexes.get(item);
  if (!index) {
    index = buildIndex(text);
    indexes.set(item, index);
  }
  return index;
}

/** Damerau-Levenshtein distance with an early exit once it exceeds `max`. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2.splice(0, prev2.length, ...prev);
    prev = cur;
  }
  return prev[b.length];
}

/** How well one query word matches one song word: 0 none, 1 near miss, 2 prefix, 3 exact. */
function wordScore(q: string, w: string): number {
  if (q === w) return 3;
  if (q.length >= 3 && w.startsWith(q)) return 2;
  if (q.length >= 4 && q.startsWith(w) && w.length >= 3) return 1;
  if (q.length >= 4) {
    const max = q.length >= 7 ? 2 : 1;
    if (editDistance(q, w, max) <= max) return 1;
  }
  return 0;
}

/** True when `token` is within typo distance of any of the words (the same rule as song search). */
export function fuzzyWordMatch(token: string, words: string[]): boolean {
  return words.some((w) => wordScore(token, w) > 0);
}

/** Relevance of a song for a query; 0 means no match. */
export function scoreFor(index: Index, query: string): number {
  const q = searchKey(query);
  if (!q) return 0;
  const tokens = q.split(' ');
  let score = 0;
  for (const token of tokens) {
    let best = 0;
    for (const w of index.words) {
      const s = wordScore(token, w);
      if (s > best) best = s;
      if (best === 3) break;
    }
    if (best === 0) {
      // A word the lyrics run together with its neighbours, e.g. "naapraana".
      if (token.length >= 4 && index.joined.includes(token)) best = 2;
      else return 0;
    }
    score += best;
  }
  if (index.key.includes(q)) score += 4;
  else if (tokens.length > 1 && index.joined.includes(q.replace(/ /g, ''))) score += 3;
  if (index.titleKey.includes(q) || tokens.every((t) => index.titleKey.split(' ').some((w) => wordScore(t, w) > 0))) score += 3;
  return score;
}

/** Items matching the query, best first; ties keep the given order. Empty query returns everything. */
export function rankBySearch<T extends object>(items: T[], query: string, textOf: (item: T) => SongText): T[] {
  if (!query.trim()) return items;
  const scored: { item: T; score: number; at: number }[] = [];
  items.forEach((item, at) => {
    const score = scoreFor(indexFor(item, textOf(item)), query);
    if (score > 0) scored.push({ item, score, at });
  });
  return scored.sort((a, b) => b.score - a.score || a.at - b.at).map((s) => s.item);
}
