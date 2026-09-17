import { Asset } from 'expo-asset';
import initSqlJs from 'sql.js/dist/sql-wasm-browser.js';

import type { BibleDb } from './bibleDb.types';

let opening: Promise<BibleDb> | null = null;

/** Web: load the bundled database into sql.js (SQLite compiled to WebAssembly). */
export function getBibleDb(): Promise<BibleDb> {
  if (!opening) {
    opening = (async () => {
      const wasm = Asset.fromModule(require('sql.js/dist/sql-wasm-browser.wasm'));
      const data = Asset.fromModule(require('../../assets/bible/bible-v3.db'));
      await Promise.all([wasm.downloadAsync(), data.downloadAsync()]);
      const SQL = await initSqlJs({ locateFile: () => wasm.localUri ?? wasm.uri });
      const bytes = new Uint8Array(await (await fetch(data.localUri ?? data.uri)).arrayBuffer());
      const db = new SQL.Database(bytes);
      const all = <T,>(sql: string, params: (string | number)[] = []): T[] => {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const rows: T[] = [];
        while (stmt.step()) rows.push(stmt.getAsObject() as T);
        stmt.free();
        return rows;
      };
      return {
        getAllAsync: async <T,>(sql: string, params?: (string | number)[]) => all<T>(sql, params),
        getFirstAsync: async <T,>(sql: string, params?: (string | number)[]) => all<T>(sql, params)[0] ?? null,
      };
    })().catch((err) => {
      opening = null;
      throw err;
    });
  }
  return opening;
}
