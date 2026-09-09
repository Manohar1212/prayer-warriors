declare module 'sql.js/dist/sql-wasm-browser.js' {
  import type { SqlJsStatic } from 'sql.js';

  export default function initSqlJs(config?: { locateFile?: (file: string) => string }): Promise<SqlJsStatic>;
}
declare module '*.wasm';
