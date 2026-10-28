import type { Database, SqlJsStatic } from 'sql.js';

// SQLite real corriendo en el navegador gracias a WebAssembly (sql.js).
// Se carga bajo demanda para que la página inicial sea ligera.

let sqlPromise: Promise<SqlJsStatic> | null = null;

export function loadSql(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    sqlPromise = Promise.all([import('sql.js'), import('sql.js/dist/sql-wasm-browser.wasm?url')]).then(([mod, wasm]) =>
      mod.default({ locateFile: () => wasm.default }),
    );
  }
  return sqlPromise;
}

export const SEED_SQL = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  age INTEGER,
  city TEXT,
  role TEXT DEFAULT 'user',
  password TEXT
);
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER NOT NULL
);
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  product TEXT NOT NULL,
  amount INTEGER NOT NULL
);
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY,
  owner TEXT NOT NULL,
  balance INTEGER NOT NULL
);
INSERT INTO users (id, name, email, age, city, role, password) VALUES
  (1, 'Ahmed', 'ahmed@example.com', 28, 'Alexandria', 'admin', 'secreto123'),
  (2, 'Sara', 'sara@example.com', 24, 'Madrid', 'user', 'sara2025'),
  (3, 'Lucía', 'lucia@example.com', 31, 'Santo Domingo', 'user', 'luz*luz'),
  (4, 'Carlos', 'carlos@example.com', 17, 'Bogotá', 'user', 'carlitos'),
  (5, 'Ali', 'ali@example.com', 35, 'Cairo', 'user', 'ali!ali');
INSERT INTO products (id, name, price, stock) VALUES
  (1, 'Laptop', 999, 5),
  (2, 'Mouse', 25, 120),
  (3, 'Keyboard', 75, 40),
  (4, 'Monitor', 300, 0),
  (5, 'Headphones', 120, 15);
INSERT INTO orders (id, user_id, product, amount) VALUES
  (1, 1, 'Laptop', 999),
  (2, 1, 'Mouse', 25),
  (3, 2, 'Keyboard', 75),
  (4, 3, 'Headphones', 120),
  (5, 3, 'Mouse', 25),
  (6, 5, 'Monitor', 300);
INSERT INTO accounts (id, owner, balance) VALUES
  (1, 'Ahmed', 500),
  (2, 'Sara', 100);
`;

export async function freshDb(): Promise<Database> {
  const SQL = await loadSql();
  const db = new SQL.Database();
  db.run(SEED_SQL);
  return db;
}

export type QueryResult = { columns: string[]; values: (string | number | null)[][] };

export function runQuery(db: Database, sql: string): QueryResult[] {
  return db.exec(sql).map((r) => ({ columns: r.columns, values: r.values as (string | number | null)[][] }));
}

export function tableNames(db: Database): string[] {
  const r = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  return r[0]?.values.map((v) => String(v[0])) ?? [];
}

/** Compara dos resultados. Si la consulta solución usa ORDER BY, el orden importa. */
export function sameResult(a: QueryResult | undefined, b: QueryResult | undefined, ordered: boolean): boolean {
  if (!a || !b) return !a && !b;
  if (a.values.length !== b.values.length) return false;
  if (a.values[0] && b.values[0] && a.values[0].length !== b.values[0].length) return false;
  const rows = (r: QueryResult) => r.values.map((v) => JSON.stringify(v));
  const ra = rows(a);
  const rb = rows(b);
  if (!ordered) {
    ra.sort();
    rb.sort();
  }
  return ra.every((v, i) => v === rb[i]);
}
