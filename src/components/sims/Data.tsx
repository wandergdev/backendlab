import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { Database } from 'sql.js';
import { t, type L } from '../../types';
import { useLang } from '../../i18n/lang';
import { freshDb, runQuery, tableNames, type QueryResult } from '../../lib/sql';
import { DataTable } from '../visuals/Visual';
import { Tasks, type SimProps } from './SimHost';

// =====================================================================
// SQL Playground: SQLite real en tu navegador
// =====================================================================
type Ran = { sql: string; ok: boolean; results: QueryResult[]; usersCount: number };
const SQL_GOALS: { key: string; label: L; test: (r: Ran) => boolean }[] = [
  { key: 'all', label: t('Muestra TODOS los usuarios: SELECT * FROM users;', 'Show ALL users: SELECT * FROM users;'), test: (r) => /select\s+\*\s+from\s+users/i.test(r.sql) && r.ok },
  { key: 'where', label: t('Filtra con WHERE (ej: usuarios mayores de 25)', 'Filter with WHERE (e.g. users older than 25)'), test: (r) => /where/i.test(r.sql) && /select/i.test(r.sql) && r.ok && (r.results[0]?.values.length ?? 0) > 0 },
  { key: 'insert', label: t('Agrega un usuario nuevo con INSERT INTO', 'Add a new user with INSERT INTO'), test: (r) => /insert\s+into\s+users/i.test(r.sql) && r.ok && r.usersCount > 5 },
  { key: 'update', label: t('Cambia el nombre de alguien con UPDATE … SET … WHERE', "Change someone's name with UPDATE … SET … WHERE"), test: (r) => /update\s+users\s+set/i.test(r.sql) && /where/i.test(r.sql) && r.ok },
  { key: 'join', label: t('Une usuarios y pedidos con JOIN', 'Combine users and orders with JOIN'), test: (r) => /join/i.test(r.sql) && r.ok && (r.results[0]?.values.length ?? 0) > 0 },
  { key: 'count', label: t('Cuenta cuántos pedidos hay con COUNT(*)', 'Count how many orders there are with COUNT(*)'), test: (r) => /count\s*\(/i.test(r.sql) && r.ok },
];

const EXAMPLES = [
  'SELECT * FROM users;',
  'SELECT name, city FROM users WHERE age > 25;',
  "INSERT INTO users (name, email, age, city) VALUES ('Ana', 'ana@example.com', 22, 'Lima');",
  "UPDATE users SET name = 'Ahmed Ali' WHERE id = 1;",
  'SELECT users.name, orders.product, orders.amount\nFROM users\nJOIN orders ON users.id = orders.user_id;',
  'SELECT COUNT(*) AS total FROM orders;',
];

export function SqlPlayground({ labId, goals = true, initial }: SimProps & { goals?: boolean; initial?: string }) {
  const { tr, tx } = useLang();
  const db = useRef<Database | null>(null);
  const [ready, setReady] = useState(false);
  const [sql, setSql] = useState(initial ?? 'SELECT * FROM users;');
  const [results, setResults] = useState<QueryResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [ran, setRan] = useState<Ran[]>([]);
  const [tables, setTables] = useState<string[]>([]);

  const init = async () => {
    setReady(false);
    db.current?.close();
    db.current = await freshDb();
    setTables(tableNames(db.current));
    setReady(true);
  };
  useEffect(() => {
    init();
    return () => db.current?.close();
  }, []);

  const run = () => {
    if (!db.current) return;
    setError(null);
    setMsg(null);
    try {
      const r = runQuery(db.current, sql);
      const changes = db.current.getRowsModified();
      setResults(r);
      if (!r.length) setMsg(changes ? tx(`✔ Listo. Filas afectadas: ${changes}`, `✔ Done. Rows affected: ${changes}`) : tx('✔ Ejecutado (sin filas que mostrar)', '✔ Executed (no rows to show)'));
      const usersCount = Number(db.current.exec('SELECT COUNT(*) FROM users')[0]?.values[0][0] ?? 0);
      setRan((x) => [...x, { sql, ok: true, results: r, usersCount }]);
      setTables(tableNames(db.current));
    } catch (e) {
      setResults([]);
      setError(String((e as Error).message));
      setRan((x) => [...x, { sql, ok: false, results: [], usersCount: 0 }]);
    }
  };

  return (
    <div className="sim stack">
      <div className="sim-title">🗄️ {tx('SQL de verdad (SQLite corriendo en tu navegador)', 'Real SQL (SQLite running in your browser)')}</div>
      <div className="row small">
        <span className="faint">{tx('Tablas:', 'Tables:')}</span>
        {tables.map((tb) => (
          <button key={tb} className="btn btn-ghost btn-sm mono" onClick={() => setSql(`SELECT * FROM ${tb};`)}>
            {tb}
          </button>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={init}>↺ {tx('Reiniciar BD', 'Reset DB')}</button>
      </div>
      <textarea
        className="textarea"
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            run();
          }
        }}
        spellCheck={false}
        style={{ minHeight: 110 }}
      />
      <div className="row">
        <button className="btn btn-primary" onClick={run} disabled={!ready}>
          ▶ {tx('Ejecutar', 'Run')} <span className="kbd">Ctrl+Enter</span>
        </button>
        <select className="select small" style={{ maxWidth: 280 }} value="" onChange={(e) => e.target.value && setSql(e.target.value)}>
          <option value="">{tx('📚 Ejemplos…', '📚 Examples…')}</option>
          {EXAMPLES.map((ex) => (
            <option key={ex} value={ex}>
              {ex.replace(/\n/g, ' ').slice(0, 60)}
            </option>
          ))}
        </select>
      </div>
      {!ready && <div className="small pulse">{tx('Cargando motor SQL…', 'Loading SQL engine…')}</div>}
      {error && <div className="feedback bad mono small">❌ {error}</div>}
      {msg && <div className="feedback ok small">{msg}</div>}
      {results.map((r, i) => (
        <DataTable key={i} name={`${r.values.length} ${tx('filas', 'rows')}`} columns={r.columns} rows={r.values} />
      ))}
      {goals && <Tasks labId={labId} items={SQL_GOALS.map((g) => ({ key: g.key, label: g.label, done: ran.some(g.test) }))} />}
      {goals && <div className="tiny faint">{tr(t('Tip: si rompes algo, pulsa "Reiniciar BD". ¡Aquí no hay miedo a equivocarse!', 'Tip: if you break something, press "Reset DB". No fear of mistakes here!'))}</div>}
    </div>
  );
}

// =====================================================================
// JOIN visual: las flechas entre tablas
// =====================================================================
const J_USERS: [number, string][] = [[1, 'Ahmed'], [2, 'Sara'], [3, 'Lucía'], [4, 'Carlos'], [5, 'Ali']];
const J_ORDERS: [number, number, string, number][] = [[1, 1, 'Laptop', 999], [2, 1, 'Mouse', 25], [3, 2, 'Keyboard', 75], [4, 3, 'Headphones', 120], [5, 3, 'Mouse', 25], [6, 5, 'Monitor', 300]];

export function JoinViz({ labId }: SimProps) {
  const { tx } = useLang();
  const [sel, setSel] = useState<number | null>(null);
  const [clicked, setClicked] = useState<Set<number>>(new Set());
  const orders = J_ORDERS.filter((o) => o[1] === sel);
  return (
    <div className="sim stack">
      <div className="sim-title">🔗 {tx('Haz clic en un usuario para ver sus pedidos (users.id = orders.user_id)', 'Click a user to see their orders (users.id = orders.user_id)')}</div>
      <div className="grid grid-2">
        <div>
          <div className="table-name">users</div>
          <div className="stack" style={{ gap: 4 }}>
            {J_USERS.map(([id, name]) => (
              <button key={id} className={`option ${sel === id ? 'selected' : ''}`} style={{ padding: '6px 10px' }} onClick={() => { setSel(id); setClicked((c) => new Set(c).add(id)); }}>
                <span className="mono pill">id={id}</span> {name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="table-name">orders</div>
          <div className="stack" style={{ gap: 4 }}>
            {J_ORDERS.map((o) => {
              const on = o[1] === sel;
              return (
                <motion.div key={o[0]} animate={{ x: on ? -8 : 0, opacity: sel === null || on ? 1 : 0.35 }} className="mono small" style={{ padding: '7px 10px', borderRadius: 10, border: `2px solid ${on ? 'var(--yellow)' : 'var(--border)'}`, background: 'var(--surface)' }}>
                  #{o[0]} <span className="pill">user_id={o[1]}</span> {o[2]} ${o[3]}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
      {sel !== null && (
        <div className="panel">
          <div className="mono tiny muted mb">SELECT users.name, orders.product, orders.amount FROM users JOIN orders ON users.id = orders.user_id WHERE users.id = {sel};</div>
          {orders.length ? (
            <DataTable name={tx('resultado', 'result')} columns={['name', 'product', 'amount']} rows={orders.map((o) => [J_USERS.find((u) => u[0] === sel)![1], o[2], o[3]])} />
          ) : (
            <div className="small bold" style={{ color: 'var(--yellow)' }}>{tx('0 filas: este usuario no tiene pedidos. Un INNER JOIN no lo mostraría; un LEFT JOIN sí (con NULL).', '0 rows: this user has no orders. An INNER JOIN would not show them; a LEFT JOIN would (with NULL).')}</div>
          )}
        </div>
      )}
      <Tasks
        labId={labId}
        items={[
          { key: 'three', label: t('Explora los pedidos de 3 usuarios distintos', 'Explore the orders of 3 different users'), done: clicked.size >= 3 },
          { key: 'none', label: t('Encuentra al usuario que NO tiene pedidos', 'Find the user who has NO orders'), done: clicked.has(4) },
        ]}
      />
    </div>
  );
}

// =====================================================================
// Transacciones: todo o nada
// =====================================================================
export function TransactionSim({ labId }: SimProps) {
  const { tx } = useLang();
  const [useTx, setUseTx] = useState(false);
  const [failure, setFailure] = useState(true);
  const [acc, setAcc] = useState({ a: 500, b: 100 });
  const [log, setLog] = useState<{ text: string; cls?: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [outcomes, setOutcomes] = useState({ lost: false, rolled: false, ok: false });
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const transfer = async () => {
    setBusy(true);
    const start = { a: 500, b: 100 };
    setAcc(start);
    setLog([]);
    const add = (text: string, cls?: string) => setLog((l) => [...l, { text, cls }]);
    await sleep(300);
    if (useTx) add('BEGIN;', 'kw');
    await sleep(500);
    add("UPDATE accounts SET balance = balance - 200 WHERE owner = 'Ahmed';");
    setAcc({ a: 300, b: 100 });
    await sleep(800);
    if (failure) {
      add(tx('💥 ¡Se va la luz! El servidor se apaga a mitad de camino.', '💥 Power outage! The server dies halfway through.'), 'err');
      await sleep(900);
      if (useTx) {
        add(tx('↩ ROLLBACK automático: como no hubo COMMIT, se deshace TODO.', '↩ Automatic ROLLBACK: since there was no COMMIT, EVERYTHING is undone.'), 'ok');
        setAcc(start);
        setOutcomes((o) => ({ ...o, rolled: true }));
      } else {
        add(tx('😱 Ahmed perdió $200 y Sara no recibió nada. ¡El dinero desapareció!', '😱 Ahmed lost $200 and Sara got nothing. The money vanished!'), 'err');
        setOutcomes((o) => ({ ...o, lost: true }));
      }
      setBusy(false);
      return;
    }
    add("UPDATE accounts SET balance = balance + 200 WHERE owner = 'Sara';");
    setAcc({ a: 300, b: 300 });
    await sleep(500);
    if (useTx) add('COMMIT;', 'kw');
    add(tx('✅ Transferencia completa. Total en el sistema: $600 (igual que antes).', '✅ Transfer complete. Total in the system: $600 (same as before).'), 'ok');
    setOutcomes((o) => ({ ...o, ok: true }));
    setBusy(false);
  };

  return (
    <div className="sim stack">
      <div className="sim-title">🏦 {tx('Transferir $200 de Ahmed a Sara', 'Transfer $200 from Ahmed to Sara')}</div>
      <div className="row">
        <label className="small row" style={{ gap: 6 }}><input type="checkbox" checked={useTx} onChange={() => setUseTx((v) => !v)} /> {tx('Usar transacción (BEGIN … COMMIT)', 'Use a transaction (BEGIN … COMMIT)')}</label>
        <label className="small row" style={{ gap: 6 }}><input type="checkbox" checked={failure} onChange={() => setFailure((v) => !v)} /> {tx('Simular apagón a mitad', 'Simulate an outage halfway')}</label>
        <button className="btn btn-primary btn-sm" onClick={transfer} disabled={busy}>▶ {tx('Transferir', 'Transfer')}</button>
      </div>
      <div className="grid grid-3">
        <div className="panel center"><div>🧔 Ahmed</div><div className="bold" style={{ fontSize: '1.5rem' }}>${acc.a}</div></div>
        <div className="panel center"><div>👩 Sara</div><div className="bold" style={{ fontSize: '1.5rem' }}>${acc.b}</div></div>
        <div className="panel center" style={{ borderColor: acc.a + acc.b !== 600 ? 'var(--red)' : 'var(--green)' }}><div>{tx('Total', 'Total')}</div><div className="bold" style={{ fontSize: '1.5rem', color: acc.a + acc.b !== 600 ? 'var(--red)' : 'var(--green)' }}>${acc.a + acc.b}</div></div>
      </div>
      <div className="terminal" style={{ minHeight: 120 }}>
        {log.map((l, i) => (
          <div key={i} className={l.cls === 'err' ? 'err' : l.cls === 'ok' ? 'prompt' : l.cls === 'kw' ? 'path' : ''}>{l.text}</div>
        ))}
      </div>
      <Tasks
        labId={labId}
        items={[
          { key: 'lost', label: t('Sin transacción + apagón: mira cómo desaparece el dinero', 'No transaction + outage: watch the money vanish'), done: outcomes.lost },
          { key: 'rolled', label: t('Con transacción + apagón: el ROLLBACK lo salva todo', 'With transaction + outage: ROLLBACK saves everything'), done: outcomes.rolled },
          { key: 'ok', label: t('Haz una transferencia completa sin apagón', 'Do a full transfer without an outage'), done: outcomes.ok },
        ]}
      />
    </div>
  );
}

// =====================================================================
// Índices: el índice del libro
// =====================================================================
const NAMES = ['ana', 'beto', 'carla', 'dario', 'elena', 'fabio', 'gina', 'hugo', 'ines', 'juan', 'karla', 'luis', 'maria', 'nico', 'olga', 'pablo', 'quique', 'rosa', 'sara', 'tomas', 'ursula', 'vera', 'walter', 'ximena', 'yago', 'zoe'];

export function IndexSim({ labId }: SimProps) {
  const { tx } = useLang();
  const rows = useMemo(() => [...NAMES].sort(() => Math.random() - 0.5).map((n, i) => ({ id: i + 1, email: `${n}@mail.com` })), []);
  const sorted = useMemo(() => [...rows].sort((a, b) => a.email.localeCompare(b.email)), [rows]);
  const [target, setTarget] = useState('sara@mail.com');
  const [hl, setHl] = useState<number | null>(null);
  const [found, setFound] = useState<number | null>(null);
  const [steps, setSteps] = useState<{ scan?: number; idx?: number }>({});
  const [mode, setMode] = useState<'scan' | 'idx' | null>(null);
  const [busy, setBusy] = useState(false);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const scan = async () => {
    setBusy(true); setMode('scan'); setFound(null);
    let n = 0;
    for (let i = 0; i < rows.length; i++) {
      n++;
      setHl(i);
      await sleep(110);
      if (rows[i].email === target) { setFound(i); break; }
    }
    setSteps((s) => ({ ...s, scan: n }));
    setBusy(false);
  };
  const indexed = async () => {
    setBusy(true); setMode('idx'); setFound(null);
    let lo = 0, hi = sorted.length - 1, n = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      n++;
      setHl(mid);
      await sleep(450);
      const c = sorted[mid].email.localeCompare(target);
      if (c === 0) { setFound(mid); break; }
      if (c < 0) lo = mid + 1; else hi = mid - 1;
    }
    setSteps((s) => ({ ...s, idx: n }));
    setBusy(false);
  };
  const list = mode === 'idx' ? sorted : rows;
  return (
    <div className="sim stack">
      <div className="sim-title">📖 {tx('Buscar un email entre 26 usuarios', 'Find an email among 26 users')}</div>
      <div className="row">
        <select className="select mono" style={{ maxWidth: 220 }} value={target} onChange={(e) => setTarget(e.target.value)}>
          {NAMES.map((n) => <option key={n}>{`${n}@mail.com`}</option>)}
        </select>
        <button className="btn btn-sm" disabled={busy} onClick={scan}>🐢 {tx('Sin índice (leer fila por fila)', 'No index (row by row)')}</button>
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={indexed}>🚀 {tx('Con índice (saltar directo)', 'With index (jump straight)')}</button>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 4 }}>
        {list.map((r, i) => (
          <div key={r.id} className="mono tiny" style={{ padding: '4px 8px', borderRadius: 6, border: `2px solid ${found === i ? 'var(--green)' : hl === i ? 'var(--yellow)' : 'var(--border)'}`, background: found === i ? 'color-mix(in srgb, var(--green) 20%, transparent)' : 'var(--surface)' }}>
            {r.email}
          </div>
        ))}
      </div>
      <div className="row">
        {steps.scan !== undefined && <span className="pill red">🐢 {steps.scan} {tx('comparaciones', 'comparisons')}</span>}
        {steps.idx !== undefined && <span className="pill green">🚀 {steps.idx} {tx('comparaciones', 'comparisons')}</span>}
      </div>
      <div className="tiny faint">{tx('Con 1 millón de filas: sin índice ≈ 1.000.000 comparaciones; con índice ≈ 20.', 'With 1 million rows: no index ≈ 1,000,000 comparisons; with index ≈ 20.')}</div>
      <Tasks labId={labId} items={[{ key: 'both', label: t('Busca el mismo email con y sin índice y compara', 'Look up the same email with and without an index and compare'), done: steps.scan !== undefined && steps.idx !== undefined }]} />
    </div>
  );
}
