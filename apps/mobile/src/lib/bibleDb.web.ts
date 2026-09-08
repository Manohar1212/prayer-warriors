import type { BibleDb } from './bibleDb.types';

export function getBibleDb(): Promise<BibleDb> {
  return Promise.reject(new Error('Bible reading is available in the mobile app.'));
}
