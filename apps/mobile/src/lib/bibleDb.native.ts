import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import type { BibleDb } from './bibleDb.types';

const DB_NAME = 'bible-v3.db';
let opening: Promise<SQLiteDatabase> | null = null;

/** Copies the bundled database into the SQLite directory on first use, then opens it read-only. */
async function ensureCopied(): Promise<void> {
  const dir = new Directory(Paths.document, 'SQLite');
  if (!dir.exists) dir.create({ intermediates: true });
  const target = new File(dir, DB_NAME);
  if (target.exists && target.size && target.size > 1_000_000) return;
  const asset = Asset.fromModule(require('../../assets/bible/bible-v3.db'));
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('Bible data is not available.');
  if (target.exists) target.delete();
  // copy() is asynchronous: opening before it finishes would create an empty database in its place.
  await new File(asset.localUri).copy(target);
}

function adapt(db: SQLiteDatabase): BibleDb {
  return {
    getAllAsync: (sql, params = []) => db.getAllAsync(sql, params),
    getFirstAsync: (sql, params = []) => db.getFirstAsync(sql, params),
  };
}

export function getBibleDb(): Promise<BibleDb> {
  if (!opening) {
    opening = (async () => {
      await ensureCopied();
      return openDatabaseAsync(DB_NAME);
    })().catch((err) => {
      opening = null;
      throw err;
    });
  }
  return opening.then(adapt);
}
