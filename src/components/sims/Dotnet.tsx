import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Database } from 'sql.js';
import { t, type L } from '../../types';
import { useLang } from '../../i18n/lang';
import { freshDb, runQuery, type QueryResult } from '../../lib/sql';
import { CodeBlock } from '../visuals/CodeBlock';
import { DataTable } from '../visuals/Visual';
import { Tasks, type SimProps } from './SimHost';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// =====================================================================
// ASP.NET Core: el orden del pipeline de middleware importa
// =====================================================================
const MW: Record<string, { code: string; label: L }> = {
  exc: { code: 'app.UseExceptionHandler("/error");', label: t('Atrapa errores y devuelve un 500 limpio', 'Catches errors and returns a clean 500') },
  https: { code: 'app.UseHttpsRedirection();', label: t('Redirige http → https', 'Redirects http → https') },
  authn: { code: 'app.UseAuthentication();', label: t('Lee el token: ¿quién eres?', 'Reads the token: who are you?') },
  authz: { code: 'app.UseAuthorization();', label: t('Revisa [Authorize]: ¿puedes entrar?', 'Checks [Authorize]: may you enter?') },
  map: { code: 'app.MapControllers();', label: t('Ejecuta el endpoint (tu controlador)', 'Runs the endpoint (your controller)') },
};
type Line = { text: string; ok: boolean | null };

export function AspnetPipeline({ labId }: SimProps) {
  const { tr, tx } = useLang();
  const [order, setOrder] = useState(['https', 'authz', 'authn', 'map', 'exc']);
  const [crash, setCrash] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [seen, setSeen] = useState({ wrong401: false, ok200: false, handled500: false });

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const n = [...order];
    [n[i], n[j]] = [n[j], n[i]];
    setOrder(n);
  };

  const send = async () => {
    setBusy(true);
    setLines([]);
    const add = (text: string, ok: boolean | null = null) => setLines((l) => [...l, { text, ok }]);
    let user: string | null = null;
    let catching = false;
    let authorized = false;
    for (const id of order) {
      setActive(id);
      await sleep(650);
      if (id === 'exc') {
        catching = true;
        add(tx('🛟 ExceptionHandler: listo para atrapar errores de lo que viene DESPUÉS', '🛟 ExceptionHandler: ready to catch errors from what comes AFTER'));
      } else if (id === 'https') {
        add(tx('🔒 Ya es https, sigue', '🔒 Already https, continue'));
      } else if (id === 'authn') {
        user = 'Sara';
        add(tx('🪪 Authentication: token válido → User = Sara', '🪪 Authentication: valid token → User = Sara'), true);
      } else if (id === 'authz') {
        if (!user) {
          add(tx('⛔ Authorization: [Authorize] pide un usuario… pero nadie lo ha identificado todavía → 401', '⛔ Authorization: [Authorize] needs a user… but nobody has identified them yet → 401'), false);
          add(tx('💡 UseAuthentication debe ir ANTES de UseAuthorization.', '💡 UseAuthentication must come BEFORE UseAuthorization.'));
          setSeen((s) => ({ ...s, wrong401: true }));
          break;
        }
        authorized = true;
        add(tx('✅ Authorization: Sara puede entrar', '✅ Authorization: Sara may enter'), true);
      } else if (id === 'map') {
        if (!authorized) add(tx('⚠️ El endpoint se ejecuta SIN haber revisado permisos (ASP.NET Core lo detecta y lanza un error al arrancar)', '⚠️ The endpoint runs WITHOUT checking permissions (ASP.NET Core detects this and throws at startup)'), false);
        if (crash) {
          if (catching) {
            add(tx('💥 El controlador lanzó una excepción → ExceptionHandler la atrapa → 500 con ProblemDetails limpio', '💥 The controller threw → ExceptionHandler catches it → 500 with clean ProblemDetails'), true);
            setSeen((s) => ({ ...s, handled500: true }));
          } else add(tx('💥 Excepción SIN manejar: el ExceptionHandler está después (o no está) → respuesta rota / stack trace expuesto', '💥 UNHANDLED exception: ExceptionHandler is after it (or missing) → broken response / exposed stack trace'), false);
        } else {
          add(tx('🎯 UsersController.Me() → 200 { "name": "Sara" }', '🎯 UsersController.Me() → 200 { "name": "Sara" }'), authorized);
          if (authorized) setSeen((s) => ({ ...s, ok200: true }));
        }
        const rest = order.slice(order.indexOf('map') + 1);
        if (rest.length) add(tx(`🚫 ${rest.map((r) => MW[r].code).join(' ')} → NUNCA se ejecuta: MapControllers termina la cadena`, `🚫 ${rest.map((r) => MW[r].code).join(' ')} → NEVER runs: MapControllers ends the chain`), false);
        break;
      }
    }
    setActive(null);
    setBusy(false);
  };

  return (
    <div className="sim stack">
      <div className="sim-title">🏭 Program.cs — {tx('ordena el pipeline con ↑ ↓ y envía GET /api/me (con token)', 'order the pipeline with ↑ ↓ and send GET /api/me (with a token)')}</div>
      <div className="stack" style={{ gap: 6 }}>
        {order.map((id, i) => (
          <motion.div layout key={id} className="row" style={{ flexWrap: 'nowrap', padding: '8px 10px', borderRadius: 12, border: `2px solid ${active === id ? 'var(--yellow)' : 'var(--border)'}`, background: 'var(--surface)' }}>
            <span className="mono small bold grow">{MW[id].code}</span>
            <span className="tiny muted hide-mobile">{tr(MW[id].label)}</span>
            <button className="btn btn-ghost btn-sm" disabled={busy || i === 0} onClick={() => move(i, -1)}>↑</button>
            <button className="btn btn-ghost btn-sm" disabled={busy || i === order.length - 1} onClick={() => move(i, 1)}>↓</button>
          </motion.div>
        ))}
      </div>
      <div className="row">
        <label className="small row" style={{ gap: 6 }}><input type="checkbox" checked={crash} onChange={() => setCrash((c) => !c)} /> 💥 {tx('El controlador lanza una excepción', 'The controller throws an exception')}</label>
        <button className="btn btn-primary btn-sm" onClick={send} disabled={busy}>▶ {tx('Enviar request', 'Send request')}</button>
      </div>
      <div className="terminal" style={{ minHeight: 110 }}>
        {lines.map((l, i) => (
          <div key={i} className={l.ok === false ? 'err' : l.ok ? 'prompt' : ''}>{l.text}</div>
        ))}
      </div>
      <Tasks
        labId={labId}
        items={[
          { key: '401', label: t('Con el orden inicial, recibe un 401 aunque el token sea válido', 'With the initial order, get a 401 even with a valid token'), done: seen.wrong401 },
          { key: '200', label: t('Arregla el orden y consigue un 200', 'Fix the order and get a 200'), done: seen.ok200 },
          { key: '500', label: t('Activa la excepción y logra que el ExceptionHandler la atrape', 'Turn on the exception and make the ExceptionHandler catch it'), done: seen.handled500 },
        ]}
      />
    </div>
  );
}

// =====================================================================
// Inyección de dependencias: Singleton, Scoped y Transient
// =====================================================================
type Inst = { clock: number; db: number; email: number };
type Req = { n: number; controller: Inst; service: Inst };
const COLORS = ['#7c6cff', '#00d29a', '#ff9f43', '#4cc9f0', '#f78fb3', '#ffd166', '#ff6b81', '#a29bfe'];

export function DiLifetimes({ labId }: SimProps) {
  const { tx } = useLang();
  const [reqs, setReqs] = useState<Req[]>([]);
  const counter = useRef({ db: 0, email: 0 });
  const [answer, setAnswer] = useState<string | null>(null);

  const request = () => {
    const c = counter.current;
    const scoped = ++c.db;
    const mk = (): Inst => ({ clock: 1, db: scoped, email: ++c.email });
    // Las instancias se crean FUERA del updater: React puede ejecutar los updaters dos veces.
    const next = { n: scoped, controller: mk(), service: mk() };
    setReqs((r) => [...r, next].slice(-4));
  };
  const Badge = ({ kind, id }: { kind: string; id: number }) => (
    <motion.span key={`${kind}${id}`} initial={{ scale: 0 }} animate={{ scale: 1 }} className="mono tiny bold" style={{ padding: '2px 8px', borderRadius: 8, background: COLORS[(id + kind.length) % COLORS.length], color: '#111' }}>
      #{id}
    </motion.span>
  );
  const rows: { key: keyof Inst; name: string; life: string; desc: string }[] = [
    { key: 'clock', name: 'IClock', life: 'Singleton', desc: tx('UNA instancia para toda la app', 'ONE instance for the whole app') },
    { key: 'db', name: 'AppDbContext', life: 'Scoped', desc: tx('UNA por request', 'ONE per request') },
    { key: 'email', name: 'IEmailSender', life: 'Transient', desc: tx('NUEVA cada vez que se pide', 'NEW every time it is asked for') },
  ];

  return (
    <div className="sim stack">
      <div className="sim-title">💉 {tx('¿Cuántas instancias crea .NET?', 'How many instances does .NET create?')}</div>
      <CodeBlock copy={false} snippet={{ lang: 'csharp', src: 'builder.Services.AddSingleton<IClock, SystemClock>();\nbuilder.Services.AddScoped<AppDbContext>();          // AddDbContext usa Scoped\nbuilder.Services.AddTransient<IEmailSender, SmtpEmailSender>();' }} />
      <div className="small muted">{tx('Cada request crea un Controller y un Service, y ambos piden los 3 servicios. Mira los números de instancia (#).', 'Each request creates a Controller and a Service, and both ask for the 3 services. Watch the instance numbers (#).')}</div>
      <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={request}>📨 {tx('Nuevo request', 'New request')}</button>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{tx('Servicio', 'Service')}</th>
              {reqs.map((r) => (
                <th key={r.n} colSpan={2}>Request {r.n}<div className="tiny faint">Controller · Service</div></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td><b>{row.name}</b> <span className="pill">{row.life}</span><div className="tiny faint">{row.desc}</div></td>
                {reqs.map((r) => [
                  <td key={`${r.n}c`}><Badge kind={row.key} id={r.controller[row.key]} /></td>,
                  <td key={`${r.n}s`}><Badge kind={row.key} id={r.service[row.key]} /></td>,
                ])}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {reqs.length >= 2 && (
        <div className="panel stack">
          <div className="bold">❓ {tx('El DbContext guarda los cambios de UN request. ¿Qué ciclo de vida le corresponde?', 'The DbContext tracks the changes of ONE request. Which lifetime fits it?')}</div>
          <div className="row">
            {['Singleton', 'Scoped', 'Transient'].map((o) => (
              <button key={o} className={`btn btn-sm ${answer === o ? (o === 'Scoped' ? 'btn-green' : 'btn-red') : ''}`} onClick={() => setAnswer(o)}>{o}</button>
            ))}
          </div>
          {answer && <div className="small">{answer === 'Scoped' ? tx('✅ Scoped: todo el request comparte el mismo DbContext y se desecha al terminar. Un Singleton mezclaría datos de distintos usuarios (y no es thread-safe).', '✅ Scoped: the whole request shares one DbContext and it is disposed at the end. A Singleton would mix data from different users (and is not thread-safe).') : tx('❌ Mira la tabla otra vez: ¿qué fila repite número dentro del request pero cambia entre requests?', '❌ Look at the table again: which row repeats its number within a request but changes between requests?')}</div>}
        </div>
      )}
      <Tasks
        labId={labId}
        items={[
          { key: 'three', label: t('Envía 3 requests y compara los números', 'Send 3 requests and compare the numbers'), done: reqs.length >= 3 },
          { key: 'scoped', label: t('Responde qué ciclo de vida usa el DbContext', 'Answer which lifetime the DbContext uses'), done: answer === 'Scoped' },
        ]}
      />
    </div>
  );
}

// =====================================================================
// EF Core: de LINQ a SQL (ejecutado en una base de datos real)
// =====================================================================
type Q = { where: 'none' | 'age' | 'city'; include: boolean; order: 'none' | 'name' | 'ageDesc'; names: boolean; take: boolean };

function buildQuery(q: Q) {
  const linq = ['var result = await db.Users'];
  if (q.include && !q.names) linq.push('    .Include(u => u.Orders)');
  if (q.where === 'age') linq.push('    .Where(u => u.Age > 25)');
  if (q.where === 'city') linq.push('    .Where(u => u.City == "Madrid")');
  if (q.order === 'name') linq.push('    .OrderBy(u => u.Name)');
  if (q.order === 'ageDesc') linq.push('    .OrderByDescending(u => u.Age)');
  if (q.names) linq.push('    .Select(u => u.Name)');
  if (q.take) linq.push('    .Take(2)');
  linq.push('    .ToListAsync();');

  const where = q.where === 'age' ? 'WHERE u.age > 25' : q.where === 'city' ? "WHERE u.city = 'Madrid'" : '';
  const order = q.order === 'name' ? 'ORDER BY u.name' : q.order === 'ageDesc' ? 'ORDER BY u.age DESC' : '';
  const cols = q.names ? 'u.name' : 'u.id, u.name, u.age, u.city';
  let sql: string;
  if (q.include && !q.names) {
    const inner = ['SELECT u.id, u.name, u.age, u.city FROM users AS u', where, order, q.take ? 'LIMIT 2' : ''].filter(Boolean).join('\n    ');
    const outerOrder = q.order === 'name' ? 'u.name, ' : q.order === 'ageDesc' ? 'u.age DESC, ' : '';
    sql = q.take
      ? `SELECT u.id, u.name, u.age, u.city, o.id AS order_id, o.product, o.amount\nFROM (\n    ${inner}\n) AS u\nLEFT JOIN orders AS o ON u.id = o.user_id\nORDER BY ${outerOrder}u.id, o.id`
      : [`SELECT u.id, u.name, u.age, u.city, o.id AS order_id, o.product, o.amount`, 'FROM users AS u', 'LEFT JOIN orders AS o ON u.id = o.user_id', where, `ORDER BY ${outerOrder}u.id, o.id`].filter(Boolean).join('\n');
  } else {
    sql = [`SELECT ${cols}`, 'FROM users AS u', where, order, q.take ? 'LIMIT 2' : ''].filter(Boolean).join('\n');
  }
  return { linq: linq.join('\n'), sql };
}

export function EfQuery({ labId }: SimProps) {
  const { tx } = useLang();
  const db = useRef<Database | null>(null);
  const [q, setQ] = useState<Q>({ where: 'none', include: false, order: 'none', names: false, take: false });
  const [res, setRes] = useState<QueryResult | null>(null);
  const [n1, setN1] = useState<{ mode: 'lazy' | 'include'; sqls: string[] } | null>(null);
  const [done, setDone] = useState({ where: false, include: false, lazy: false, eager: false });
  const { linq, sql } = useMemo(() => buildQuery(q), [q]);

  useEffect(() => {
    freshDb().then((d) => (db.current = d));
    return () => db.current?.close();
  }, []);

  const run = () => {
    if (!db.current) return;
    const r = runQuery(db.current, sql)[0];
    setRes(r ?? { columns: [], values: [] });
    setDone((d) => ({ ...d, where: d.where || q.where !== 'none', include: d.include || (q.include && !q.names) }));
  };

  const demoN1 = async (mode: 'lazy' | 'include') => {
    if (!db.current) return;
    const sqls: string[] = [];
    if (mode === 'include') {
      sqls.push('SELECT u.*, o.* FROM users AS u LEFT JOIN orders AS o ON u.id = o.user_id');
      setN1({ mode, sqls: [...sqls] });
    } else {
      sqls.push('SELECT * FROM users');
      setN1({ mode, sqls: [...sqls] });
      const ids = runQuery(db.current, 'SELECT id FROM users')[0].values.map((v) => v[0]);
      for (const id of ids) {
        await sleep(280);
        sqls.push(`SELECT * FROM orders WHERE user_id = ${id}`);
        setN1({ mode, sqls: [...sqls] });
      }
    }
    setDone((d) => ({ ...d, lazy: d.lazy || mode === 'lazy', eager: d.eager || mode === 'include' }));
  };

  const opt = <K extends keyof Q>(k: K, v: Q[K], label: string) => (
    <button className={`btn btn-sm ${q[k] === v ? 'active' : ''}`} onClick={() => setQ((x) => ({ ...x, [k]: v }))}>{label}</button>
  );

  return (
    <div className="sim stack">
      <div className="sim-title">🪄 EF Core: {tx('escribes LINQ, EF Core escribe el SQL', 'you write LINQ, EF Core writes the SQL')}</div>
      <div className="stack" style={{ gap: 6 }}>
        <div className="row small"><b style={{ width: 80 }}>Where</b>{opt('where', 'none', '—')}{opt('where', 'age', 'Age > 25')}{opt('where', 'city', 'City == "Madrid"')}</div>
        <div className="row small"><b style={{ width: 80 }}>OrderBy</b>{opt('order', 'none', '—')}{opt('order', 'name', 'Name')}{opt('order', 'ageDesc', 'Age desc')}</div>
        <div className="row small">
          <b style={{ width: 80 }}>{tx('Extras', 'Extras')}</b>
          <button className={`btn btn-sm ${q.include ? 'active' : ''}`} onClick={() => setQ((x) => ({ ...x, include: !x.include }))}>Include(Orders)</button>
          <button className={`btn btn-sm ${q.names ? 'active' : ''}`} onClick={() => setQ((x) => ({ ...x, names: !x.names }))}>Select(Name)</button>
          <button className={`btn btn-sm ${q.take ? 'active' : ''}`} onClick={() => setQ((x) => ({ ...x, take: !x.take }))}>Take(2)</button>
        </div>
      </div>
      <div className="grid grid-2">
        <CodeBlock copy={false} snippet={{ lang: 'csharp', src: linq, caption: t('Lo que escribes (C#)', 'What you write (C#)') }} />
        <CodeBlock copy={false} snippet={{ lang: 'sql', src: sql, caption: t('Lo que EF Core envía a la base de datos', 'What EF Core sends to the database') }} />
      </div>
      {q.include && q.names && <div className="tiny" style={{ color: 'var(--yellow)' }}>💡 {tx('Con Select, EF Core ignora Include: solo trae las columnas que proyectas.', 'With Select, EF Core ignores Include: it only fetches the columns you project.')}</div>}
      <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={run}>▶ {tx('Ejecutar contra la BD', 'Run against the DB')}</button>
      {res && <DataTable name={`${res.values.length} ${tx('filas', 'rows')}`} columns={res.columns} rows={res.values} />}

      <div className="panel stack">
        <div className="bold">🐌 {tx('El problema N+1', 'The N+1 problem')}</div>
        <div className="small muted">{tx('Quieres cada usuario con sus pedidos. Si cargas los pedidos dentro de un foreach, haces 1 consulta + 1 por usuario.', 'You want each user with their orders. If you load the orders inside a foreach, you make 1 query + 1 per user.')}</div>
        <div className="grid grid-2">
          <CodeBlock copy={false} snippet={{ lang: 'csharp', src: 'var users = await db.Users.ToListAsync();\nforeach (var u in users)\n    u.Orders = await db.Orders\n        .Where(o => o.UserId == u.Id).ToListAsync(); // 😱', caption: t('N+1 consultas', 'N+1 queries') }} />
          <CodeBlock copy={false} snippet={{ lang: 'csharp', src: 'var users = await db.Users\n    .Include(u => u.Orders)   // ✅ un JOIN\n    .ToListAsync();', caption: t('1 consulta', '1 query') }} />
        </div>
        <div className="row">
          <button className="btn btn-red btn-sm" onClick={() => demoN1('lazy')}>▶ foreach (N+1)</button>
          <button className="btn btn-green btn-sm" onClick={() => demoN1('include')}>▶ Include</button>
        </div>
        {n1 && (
          <div className="terminal" style={{ minHeight: 80 }}>
            <AnimatePresence>
              {n1.sqls.map((s, i) => <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{i + 1}. {s}</motion.div>)}
            </AnimatePresence>
            <div className={n1.mode === 'lazy' ? 'err' : 'prompt'}>→ {n1.sqls.length} {tx('consulta(s) a la BD', 'DB query(ies)')}</div>
          </div>
        )}
      </div>
      <Tasks
        labId={labId}
        items={[
          { key: 'where', label: t('Ejecuta una consulta con Where y mira el WHERE en el SQL', 'Run a query with Where and see the WHERE in the SQL'), done: done.where },
          { key: 'include', label: t('Usa Include(Orders) y descubre el LEFT JOIN', 'Use Include(Orders) and discover the LEFT JOIN'), done: done.include },
          { key: 'n1', label: t('Compara N+1 contra Include', 'Compare N+1 against Include'), done: done.lazy && done.eager },
        ]}
      />
    </div>
  );
}

// =====================================================================
// EF Core: change tracking y SaveChanges
// =====================================================================
type EState = 'Unchanged' | 'Modified' | 'Added' | 'Deleted';
type Ent = { id: number; name: string; original: string; state: EState };
const STATE_COLOR: Record<EState, string> = { Unchanged: 'var(--border)', Modified: 'var(--yellow)', Added: 'var(--green)', Deleted: 'var(--red)' };

export function EfTracking({ labId }: SimProps) {
  const { tx } = useLang();
  const db = useRef<Database | null>(null);
  const [ents, setEnts] = useState<Ent[]>([]);
  const [noTracking, setNoTracking] = useState(false);
  const [csLog, setCsLog] = useState<string[]>([]);
  const [sqlLog, setSqlLog] = useState<string[]>([]);
  const [newName, setNewName] = useState('Ana');
  const [done, setDone] = useState({ update: false, insert: false, del: false, notrack: false });

  const load = () => {
    if (!db.current) return;
    const r = runQuery(db.current, 'SELECT id, name FROM users ORDER BY id')[0];
    setEnts((r?.values ?? []).map(([id, name]) => ({ id: Number(id), name: String(name), original: String(name), state: 'Unchanged' as EState })));
    setCsLog([noTracking ? 'var users = await db.Users.AsNoTracking().ToListAsync();' : 'var users = await db.Users.ToListAsync();']);
    setSqlLog([]);
  };
  useEffect(() => {
    freshDb().then((d) => {
      db.current = d;
      load();
    });
    return () => db.current?.close();
  }, []);
  useEffect(() => {
    load();
  }, [noTracking]);

  const rename = (id: number, name: string) => {
    setEnts((es) => es.map((e) => (e.id === id ? { ...e, name, state: e.state === 'Added' ? 'Added' : noTracking ? 'Unchanged' : name !== e.original ? 'Modified' : 'Unchanged' } : e)));
  };
  const commitRename = (e: Ent) => e.name !== e.original && setCsLog((l) => [...l, `users.First(u => u.Id == ${e.id}).Name = "${e.name}";`]);
  const remove = (e: Ent) => {
    setCsLog((l) => [...l, e.state === 'Added' ? `// quitado antes de guardar` : `db.Users.Remove(users.First(u => u.Id == ${e.id}));`]);
    setEnts((es) => (e.state === 'Added' ? es.filter((x) => x !== e) : es.map((x) => (x === e ? { ...x, state: 'Deleted' } : x))));
  };
  const addUser = () => {
    const id = Math.max(0, ...ents.map((e) => e.id)) + 1;
    setEnts((es) => [...es, { id, name: newName, original: '', state: 'Added' }]);
    setCsLog((l) => [...l, `db.Users.Add(new User { Name = "${newName}", Email = "${newName.toLowerCase()}@example.com" });`]);
  };

  const save = () => {
    if (!db.current) return;
    const stmts: string[] = [];
    if (noTracking) {
      setSqlLog([tx('-- AsNoTracking: EF Core no vigila estos objetos. SaveChanges() no encuentra cambios → 0 filas.', '-- AsNoTracking: EF Core is not watching these objects. SaveChanges() finds no changes → 0 rows.')]);
      setCsLog((l) => [...l, 'await db.SaveChangesAsync(); // 0']);
      setDone((d) => ({ ...d, notrack: ents.some((e) => e.name !== e.original) || d.notrack }));
      return;
    }
    const esc = (s: string) => s.replace(/'/g, "''");
    for (const e of ents) {
      if (e.state === 'Added') stmts.push(`INSERT INTO users (name, email) VALUES ('${esc(e.name)}', '${esc(e.name.toLowerCase())}${e.id}@example.com');`);
      if (e.state === 'Modified') stmts.push(`UPDATE users SET name = '${esc(e.name)}' WHERE id = ${e.id};`);
      if (e.state === 'Deleted') stmts.push(`DELETE FROM users WHERE id = ${e.id};`);
    }
    if (!stmts.length) {
      setSqlLog([tx('-- No hay cambios: SaveChanges() no envía nada.', '-- No changes: SaveChanges() sends nothing.')]);
      return;
    }
    db.current.run(['BEGIN;', ...stmts, 'COMMIT;'].join('\n'));
    setSqlLog(['BEGIN TRANSACTION;', ...stmts, 'COMMIT;']);
    setDone((d) => ({ update: d.update || stmts.some((s) => s.startsWith('UPDATE')), insert: d.insert || stmts.some((s) => s.startsWith('INSERT')), del: d.del || stmts.some((s) => s.startsWith('DELETE')), notrack: d.notrack }));
    const r = runQuery(db.current, 'SELECT id, name FROM users ORDER BY id')[0];
    setEnts((r?.values ?? []).map(([id, name]) => ({ id: Number(id), name: String(name), original: String(name), state: 'Unchanged' as EState })));
    setCsLog((l) => [...l, `await db.SaveChangesAsync(); // ${stmts.length}`]);
  };

  return (
    <div className="sim stack">
      <div className="sim-title">👀 Change Tracker: {tx('EF Core vigila tus objetos y genera el SQL', 'EF Core watches your objects and generates the SQL')}</div>
      <label className="small row" style={{ gap: 6 }}><input type="checkbox" checked={noTracking} onChange={() => setNoTracking((v) => !v)} /> AsNoTracking() {tx('(solo lectura, más rápido)', '(read-only, faster)')}</label>
      <div className="stack" style={{ gap: 6 }}>
        {ents.map((e) => (
          <motion.div layout key={e.id} className="row" style={{ flexWrap: 'nowrap', padding: '6px 10px', borderRadius: 12, border: `2px solid ${STATE_COLOR[e.state]}`, background: 'var(--surface)', opacity: e.state === 'Deleted' ? 0.5 : 1 }}>
            <span className="mono tiny" style={{ width: 36 }}>#{e.id}</span>
            <input className="input" style={{ padding: '4px 8px', maxWidth: 220 }} value={e.name} disabled={e.state === 'Deleted'} onChange={(ev) => rename(e.id, ev.target.value)} onBlur={() => commitRename(e)} />
            <span className="pill grow" style={{ justifyContent: 'center', maxWidth: 120, borderColor: STATE_COLOR[e.state] }}>{noTracking && e.state !== 'Added' ? 'Detached' : e.state}</span>
            <button className="btn btn-ghost btn-sm" disabled={e.state === 'Deleted'} onClick={() => remove(e)}>🗑️</button>
          </motion.div>
        ))}
      </div>
      <div className="row">
        <input className="input" style={{ maxWidth: 160 }} value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button className="btn btn-sm" onClick={addUser}>➕ db.Users.Add</button>
        <button className="btn btn-primary btn-sm" onClick={save}>💾 SaveChangesAsync()</button>
        <button className="btn btn-ghost btn-sm" onClick={load}>↺</button>
      </div>
      <div className="grid grid-2">
        <CodeBlock copy={false} snippet={{ lang: 'csharp', src: csLog.join('\n') || '//', caption: t('Tu código C#', 'Your C# code') }} />
        <CodeBlock copy={false} snippet={{ lang: 'sql', src: sqlLog.join('\n') || '-- (aún nada)', caption: t('SQL generado al guardar', 'SQL generated on save') }} />
      </div>
      <Tasks
        labId={labId}
        items={[
          { key: 'update', label: t('Cambia un nombre y guarda → UPDATE', 'Change a name and save → UPDATE'), done: done.update },
          { key: 'insert', label: t('Añade un usuario y guarda → INSERT', 'Add a user and save → INSERT'), done: done.insert },
          { key: 'delete', label: t('Borra un usuario y guarda → DELETE', 'Delete a user and save → DELETE'), done: done.del },
          { key: 'notrack', label: t('Con AsNoTracking, cambia un nombre y guarda: no pasa nada', 'With AsNoTracking, change a name and save: nothing happens'), done: done.notrack },
        ]}
      />
    </div>
  );
}
