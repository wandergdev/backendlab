import { useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { t, type L } from '../../types';
import { useLang } from '../../i18n/lang';
import { createApi, type ApiRequest, type ApiResponse } from '../../lib/fakeApi';
import { CodeBlock } from '../visuals/CodeBlock';
import { Tasks, type SimProps } from './SimHost';

const statusClass = (s: number) => (s < 300 ? 's2' : s < 500 ? 's4' : 's5');

// =====================================================================
// HTTP Playground: un Postman de bolsillo contra una API simulada
// =====================================================================
type Hist = { req: ApiRequest; res: ApiResponse };
type Goal = { key: string; label: L; test: (h: Hist[]) => boolean };

const hit = (h: Hist[], fn: (x: Hist) => boolean) => h.some(fn);
const GOALS: Record<string, Goal[]> = {
  basics: [
    { key: 'get200', label: t('Pide la lista de usuarios (GET /api/users) y recibe un 200', 'Request the user list (GET /api/users) and get a 200'), test: (h) => hit(h, (x) => x.req.method === 'GET' && x.req.path.startsWith('/api/users') && x.res.status === 200) },
    { key: 'post201', label: t('Crea un usuario nuevo con POST y recibe un 201', 'Create a new user with POST and get a 201'), test: (h) => hit(h, (x) => x.res.status === 201) },
    { key: 'bad400', label: t('Envía un usuario con email inválido y provoca un 400', 'Send a user with an invalid email and trigger a 400'), test: (h) => hit(h, (x) => x.res.status === 400) },
    { key: 'nf404', label: t('Pide un usuario que no existe (ej: /api/users/999) → 404', 'Request a user that does not exist (e.g. /api/users/999) → 404'), test: (h) => hit(h, (x) => x.res.status === 404) },
    { key: 'err500', label: t('Rompe el servidor con GET /api/crash → 500', 'Break the server with GET /api/crash → 500'), test: (h) => hit(h, (x) => x.res.status === 500) },
  ],
  rest: [
    { key: 'page', label: t('Pide una página de usuarios: /api/users?page=1&limit=2', 'Request one page of users: /api/users?page=1&limit=2'), test: (h) => hit(h, (x) => x.req.method === 'GET' && /limit=\d/.test(x.req.path) && x.res.status === 200) },
    { key: 'nested', label: t('Pide los pedidos del usuario 1: /api/users/1/orders', 'Request the orders of user 1: /api/users/1/orders'), test: (h) => hit(h, (x) => /\/api\/users\/\d+\/orders/.test(x.req.path) && x.res.status === 200) },
    { key: 'patch', label: t('Cambia solo el nombre de un usuario con PATCH', 'Change only the name of a user with PATCH'), test: (h) => hit(h, (x) => x.req.method === 'PATCH' && x.res.status === 200) },
    { key: 'putbad', label: t('Intenta un PUT enviando solo el nombre → 400 (PUT reemplaza todo)', 'Try a PUT sending only the name → 400 (PUT replaces everything)'), test: (h) => hit(h, (x) => x.req.method === 'PUT' && x.res.status === 400) },
    { key: 'put', label: t('Haz un PUT correcto con name y email → 200', 'Do a correct PUT with name and email → 200'), test: (h) => hit(h, (x) => x.req.method === 'PUT' && x.res.status === 200) },
  ],
  auth: [
    { key: 'me401', label: t('Pide tu perfil (GET /api/me) sin token → 401', 'Request your profile (GET /api/me) without a token → 401'), test: (h) => hit(h, (x) => x.req.path.startsWith('/api/me') && x.res.status === 401) },
    { key: 'login', label: t('Inicia sesión con POST /api/login (sara@example.com / sara2025)', 'Log in with POST /api/login (sara@example.com / sara2025)'), test: (h) => hit(h, (x) => x.req.path.startsWith('/api/login') && x.res.status === 200) },
    { key: 'me200', label: t('Usa el token y vuelve a pedir /api/me → 200', 'Use the token and request /api/me again → 200'), test: (h) => hit(h, (x) => x.req.path.startsWith('/api/me') && x.res.status === 200) },
    { key: 'f403', label: t('Con el token de Sara, intenta GET /api/admin/stats → 403', "With Sara's token, try GET /api/admin/stats → 403"), test: (h) => hit(h, (x) => x.res.status === 403) },
    { key: 'admin', label: t('Entra como admin (ahmed@example.com / secreto123) y logra un 200 en /api/admin/stats', 'Log in as admin (ahmed@example.com / secreto123) and get a 200 on /api/admin/stats'), test: (h) => hit(h, (x) => x.req.path.startsWith('/api/admin') && x.res.status === 200) },
  ],
};

const PRESETS: { label: L; req: ApiRequest }[] = [
  { label: t('📋 Listar usuarios', '📋 List users'), req: { method: 'GET', path: '/api/users', headers: {} } },
  { label: t('👤 Ver usuario 2', '👤 View user 2'), req: { method: 'GET', path: '/api/users/2', headers: {} } },
  { label: t('➕ Crear usuario', '➕ Create user'), req: { method: 'POST', path: '/api/users', headers: { 'Content-Type': 'application/json' }, body: '{\n  "name": "Ana",\n  "email": "ana@example.com",\n  "password": "superSegura1"\n}' } },
  { label: t('✏️ PATCH nombre', '✏️ PATCH name'), req: { method: 'PATCH', path: '/api/users/2', headers: { 'Content-Type': 'application/json' }, body: '{\n  "name": "Sara López"\n}' } },
  { label: t('🔑 Login', '🔑 Login'), req: { method: 'POST', path: '/api/login', headers: { 'Content-Type': 'application/json' }, body: '{\n  "email": "sara@example.com",\n  "password": "sara2025"\n}' } },
  { label: t('🙋 Mi perfil', '🙋 My profile'), req: { method: 'GET', path: '/api/me', headers: {} } },
  { label: t('💥 Romper', '💥 Crash'), req: { method: 'GET', path: '/api/crash', headers: {} } },
];

const headersToText = (h: Record<string, string>) => Object.entries(h).map(([k, v]) => `${k}: ${v}`).join('\n');
const textToHeaders = (s: string) =>
  Object.fromEntries(
    s.split('\n').map((l) => l.split(':')).filter((p) => p.length >= 2 && p[0].trim()).map(([k, ...v]) => [k.trim(), v.join(':').trim()]),
  );

export function HttpPlayground({ labId, scenario = 'basics' }: SimProps & { scenario?: string }) {
  const { tr, tx } = useLang();
  const api = useRef(createApi());
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('/api/users');
  const [headers, setHeaders] = useState('Content-Type: application/json');
  const [body, setBody] = useState('');
  const [res, setRes] = useState<ApiResponse | null>(null);
  const [traceShown, setTraceShown] = useState(0);
  const [hist, setHist] = useState<Hist[]>([]);
  const [busy, setBusy] = useState(false);
  const goals = GOALS[scenario] ?? GOALS.basics;
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method);

  const send = async () => {
    setBusy(true);
    const req: ApiRequest = { method, path, headers: textToHeaders(headers), body: hasBody ? body : undefined };
    const r = api.current.handle(req);
    setRes(null);
    setTraceShown(0);
    // La respuesta "viaja": mostramos cada middleware uno por uno.
    for (let i = 1; i <= r.trace.length; i++) {
      await new Promise((ok) => setTimeout(ok, 260));
      setTraceShown(i);
      setRes({ ...r });
    }
    setHist((h) => [...h, { req, res: r }]);
    setBusy(false);
  };

  const load = (p: ApiRequest) => {
    setMethod(p.method);
    setPath(p.path);
    setBody(p.body ?? '');
    const h = { ...p.headers };
    const auth = textToHeaders(headers)['Authorization'];
    if (auth) h['Authorization'] = auth;
    setHeaders(headersToText(h));
  };

  const token = res && typeof res.body === 'object' && res.body && 'token' in res.body ? String((res.body as { token: string }).token) : null;
  const useToken = () => {
    const h = textToHeaders(headers);
    h['Authorization'] = `Bearer ${token}`;
    setHeaders(headersToText(h));
  };

  return (
    <div className="sim stack">
      <div className="sim-title">🚀 {tx('Laboratorio HTTP: envía requests reales a una API simulada', 'HTTP lab: send real requests to a simulated API')}</div>
      <div className="row" style={{ gap: 6 }}>
        {PRESETS.map((p, i) => (
          <button key={i} className="btn btn-ghost btn-sm" onClick={() => load(p.req)}>
            {tr(p.label)}
          </button>
        ))}
      </div>
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <select className="select mono" value={method} onChange={(e) => setMethod(e.target.value)} style={{ width: 120, fontWeight: 800 }}>
          {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <input className="input mono grow" value={path} onChange={(e) => setPath(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} aria-label="URL" />
        <button className="btn btn-primary" onClick={send} disabled={busy}>
          {tx('Enviar', 'Send')} ➤
        </button>
      </div>
      <div className="grid grid-2">
        <div>
          <div className="tiny bold muted">HEADERS</div>
          <textarea className="textarea" value={headers} onChange={(e) => setHeaders(e.target.value)} style={{ minHeight: 84 }} />
        </div>
        <div>
          <div className="tiny bold muted">BODY (JSON) {!hasBody && <span className="faint">— {tx('GET y DELETE no llevan body', 'GET and DELETE have no body')}</span>}</div>
          <textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} disabled={!hasBody} style={{ minHeight: 84, opacity: hasBody ? 1 : 0.5 }} />
        </div>
      </div>
      <div className="grid grid-2">
        <div className="panel">
          <div className="tiny bold muted mb">🏭 {tx('DENTRO DEL SERVIDOR (middlewares)', 'INSIDE THE SERVER (middlewares)')}</div>
          <AnimatePresence>
            {res?.trace.slice(0, traceShown).map((s, i) => (
              <motion.div key={`${hist.length}-${i}`} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="small" style={{ color: s.ok ? undefined : 'var(--red)', fontWeight: s.ok ? 600 : 800 }}>
                {s.emoji} {tr(s.label)}
              </motion.div>
            ))}
          </AnimatePresence>
          {!res && <div className="small faint">{tx('Envía un request para ver su recorrido.', 'Send a request to watch its journey.')}</div>}
        </div>
        <div className="panel">
          <div className="row between mb">
            <div className="tiny bold muted">📬 RESPONSE</div>
            {res && traceShown === res.trace.length && (
              <span className={`status-badge ${statusClass(res.status)}`}>
                {res.status} {res.statusText} · {res.ms}ms
              </span>
            )}
          </div>
          {res && traceShown === res.trace.length && <CodeBlock snippet={{ lang: 'json', src: JSON.stringify(res.body, null, 2) }} copy={false} />}
          {token && traceShown === res!.trace.length && (
            <button className="btn btn-green btn-sm mt" onClick={useToken}>
              🔑 {tx('Usar este token en mis headers', 'Use this token in my headers')}
            </button>
          )}
        </div>
      </div>
      {hist.length > 0 && (
        <div className="row small" style={{ gap: 6 }}>
          <span className="faint">{tx('Historial:', 'History:')}</span>
          {hist.slice(-10).map((h, i) => (
            <span key={i} className={`status-badge ${statusClass(h.res.status)} tiny`} title={`${h.req.method} ${h.req.path}`}>
              {h.req.method} {h.res.status}
            </span>
          ))}
        </div>
      )}
      <Tasks labId={labId} items={goals.map((g) => ({ key: g.key, label: g.label, done: g.test(hist) }))} />
    </div>
  );
}

// =====================================================================
// ¿Qué código de estado es? (juego)
// =====================================================================
const STATUS_CASES: { es: string; en: string; code: number }[] = [
  { es: 'Pediste la lista de productos y todo salió bien', en: 'You asked for the product list and everything went fine', code: 200 },
  { es: 'Te registraste y el servidor creó tu cuenta', en: 'You signed up and the server created your account', code: 201 },
  { es: 'Enviaste un email sin @ en el formulario', en: 'You sent an email without @ in the form', code: 400 },
  { es: 'Intentaste ver tu perfil sin haber iniciado sesión', en: 'You tried to view your profile without logging in', code: 401 },
  { es: 'Iniciaste sesión, pero intentas borrar la cuenta de OTRA persona', en: "You're logged in, but you try to delete SOMEONE ELSE's account", code: 403 },
  { es: 'Buscaste /users/99999 y ese usuario no existe', en: 'You looked up /users/99999 and that user does not exist', code: 404 },
  { es: 'El programador olvidó un caso y el código lanzó un error', en: 'The programmer forgot a case and the code threw an error', code: 500 },
  { es: 'Subiste un post nuevo a tu blog y se guardó', en: 'You published a new blog post and it was saved', code: 201 },
  { es: 'La base de datos se cayó mientras procesaba tu pedido', en: 'The database crashed while processing your order', code: 500 },
  { es: 'Escribiste mal la URL: /usres en vez de /users', en: 'You mistyped the URL: /usres instead of /users', code: 404 },
  { es: 'Enviaste un JSON con una coma de más y no se puede leer', en: 'You sent JSON with an extra comma and it cannot be parsed', code: 400 },
  { es: 'Tu token expiró hace una hora', en: 'Your token expired an hour ago', code: 401 },
  { es: 'Eres un usuario normal intentando entrar al panel de administración', en: 'You are a normal user trying to enter the admin panel', code: 403 },
  { es: 'Actualizaste tu foto de perfil correctamente', en: 'You updated your profile picture successfully', code: 200 },
];
const CODES = [200, 201, 400, 401, 403, 404, 500];
const CODE_HINT: Record<number, L> = {
  200: t('OK: aquí tienes', 'OK: here you go'),
  201: t('Creado', 'Created'),
  400: t('Me enviaste algo mal', 'You sent me something wrong'),
  401: t('¿Quién eres? Inicia sesión', 'Who are you? Log in'),
  403: t('Sé quién eres, pero NO puedes', 'I know who you are, but you CAN\'T'),
  404: t('Eso no existe', 'That does not exist'),
  500: t('Me rompí yo (culpa del servidor)', 'I broke (server\'s fault)'),
};

export function StatusSort({ labId }: SimProps) {
  const { lang, tr, tx } = useLang();
  const order = useMemo(() => [...STATUS_CASES].sort(() => Math.random() - 0.5), []);
  const [i, setI] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [total, setTotal] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const c = order[i % order.length];
  const choose = (code: number) => {
    if (pick !== null) return;
    setPick(code);
    if (code === c.code) {
      setStreak((s) => {
        setBest((b) => Math.max(b, s + 1));
        return s + 1;
      });
      setTotal((x) => x + 1);
    } else setStreak(0);
  };
  const next = () => {
    setPick(null);
    setI((x) => x + 1);
  };
  return (
    <div className="sim stack">
      <div className="sim-title">🚦 {tx('¿Qué código respondería el servidor?', 'Which code would the server respond?')}</div>
      <div className="row between">
        <span className="pill">🔥 {tx('Racha', 'Streak')}: {streak}</span>
        <span className="pill purple">✅ {total}</span>
      </div>
      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="panel bold" style={{ fontSize: '1.1rem' }}>
        📨 {lang === 'es' ? c.es : c.en}
      </motion.div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
        {CODES.map((code) => (
          <button key={code} className={`option ${pick !== null && code === c.code ? 'correct' : pick === code ? 'wrong' : ''}`} onClick={() => choose(code)} disabled={pick !== null} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
            <span className={`status-badge ${statusClass(code)}`}>{code}</span>
            {pick !== null && <span className="tiny muted">{tr(CODE_HINT[code])}</span>}
          </button>
        ))}
      </div>
      {pick !== null && (
        <div className={`feedback ${pick === c.code ? 'ok' : 'bad'} row between`}>
          <span>{pick === c.code ? tx('¡Exacto!', 'Exactly!') : tx(`Era ${c.code}: ${tr(CODE_HINT[c.code])}`, `It was ${c.code}: ${tr(CODE_HINT[c.code])}`)}</span>
          <button className="btn btn-primary btn-sm" onClick={next}>{tx('Siguiente', 'Next')} ▶</button>
        </div>
      )}
      <Tasks labId={labId} items={[
        { key: 'eight', label: t('Acierta 8 situaciones', 'Get 8 situations right'), done: total >= 8 },
        { key: 'streak', label: t('Logra una racha de 5 seguidas sin fallar', 'Get a streak of 5 in a row'), done: best >= 5 },
      ]} />
    </div>
  );
}

// =====================================================================
// Diseñador REST
// =====================================================================
const REST_ROWS: { action: L; method: string; url: string }[] = [
  { action: t('Listar todos los usuarios', 'List all users'), method: 'GET', url: '/api/users' },
  { action: t('Ver el usuario 42', 'Get user 42'), method: 'GET', url: '/api/users/42' },
  { action: t('Crear un usuario', 'Create a user'), method: 'POST', url: '/api/users' },
  { action: t('Reemplazar todos los datos del usuario 42', 'Replace all data of user 42'), method: 'PUT', url: '/api/users/42' },
  { action: t('Cambiar solo el email del usuario 42', 'Change only the email of user 42'), method: 'PATCH', url: '/api/users/42' },
  { action: t('Borrar el usuario 42', 'Delete user 42'), method: 'DELETE', url: '/api/users/42' },
  { action: t('Ver los pedidos del usuario 42', 'Get the orders of user 42'), method: 'GET', url: '/api/users/42/orders' },
];
const URLS = ['/api/users', '/api/users/42', '/api/users/42/orders', '/api/getUsers', '/api/user/42/delete', '/api/createUser'];

export function RestDesigner({ labId }: SimProps) {
  const { tr, tx } = useLang();
  const [ans, setAns] = useState<{ m: string; u: string }[]>(() => REST_ROWS.map(() => ({ m: '', u: '' })));
  const [checked, setChecked] = useState(false);
  const correct = ans.map((a, i) => a.m === REST_ROWS[i].method && a.u === REST_ROWS[i].url);
  const allOk = checked && correct.every(Boolean);
  return (
    <div className="sim stack">
      <div className="sim-title">🧩 {tx('Diseña la API: elige el método y la URL correctos', 'Design the API: choose the right method and URL')}</div>
      <div className="small muted">{tx('Recuerda: sustantivos en plural en la URL, y la acción la dice el MÉTODO.', 'Remember: plural nouns in the URL, and the METHOD says the action.')}</div>
      {REST_ROWS.map((r, i) => (
        <div key={i} className="row" style={{ padding: 8, borderRadius: 12, background: checked ? (correct[i] ? 'color-mix(in srgb, var(--green) 12%, transparent)' : 'color-mix(in srgb, var(--red) 12%, transparent)') : 'var(--surface)' }}>
          <span className="grow bold small" style={{ minWidth: 180 }}>{tr(r.action)}</span>
          <select className="select mono" style={{ width: 120 }} value={ans[i].m} onChange={(e) => { setChecked(false); setAns((a) => a.map((x, j) => (j === i ? { ...x, m: e.target.value } : x))); }}>
            <option value="">—</option>
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => <option key={m}>{m}</option>)}
          </select>
          <select className="select mono" style={{ width: 230 }} value={ans[i].u} onChange={(e) => { setChecked(false); setAns((a) => a.map((x, j) => (j === i ? { ...x, u: e.target.value } : x))); }}>
            <option value="">—</option>
            {URLS.map((u) => <option key={u}>{u}</option>)}
          </select>
          {checked && <span>{correct[i] ? '✅' : `❌ ${REST_ROWS[i].method} ${REST_ROWS[i].url}`}</span>}
        </div>
      ))}
      <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => setChecked(true)}>{tx('Comprobar', 'Check')}</button>
      {checked && !allOk && <div className="small muted">{tx('Corrige las filas en rojo y vuelve a comprobar. ¡Repetir es aprender!', 'Fix the red rows and check again. Repeating is learning!')}</div>}
      <Tasks labId={labId} items={[{ key: 'all', label: t('Diseña las 7 rutas correctamente', 'Design all 7 routes correctly'), done: allOk }]} />
    </div>
  );
}

// =====================================================================
// Explorador JSON
// =====================================================================
const SAMPLE = { id: 42, name: 'Ahmed', isActive: true, tags: ['developer', 'student'], address: { city: 'Alexandria', country: 'Egypt' } };
type Pick = { path: string; type: string };
const QUESTIONS: { key: string; q: L; ok: (p: Pick) => boolean }[] = [
  { key: 'city', q: t('Haz clic en la CIUDAD del usuario', "Click the user's CITY"), ok: (p) => p.path === 'address.city' },
  { key: 'bool', q: t('Haz clic en el valor booleano (verdadero/falso)', 'Click the boolean value (true/false)'), ok: (p) => p.type === 'boolean' },
  { key: 'arr', q: t('Haz clic en la segunda etiqueta del array tags', 'Click the second tag in the tags array'), ok: (p) => p.path === 'tags[1]' },
  { key: 'num', q: t('Haz clic en el número', 'Click the number'), ok: (p) => p.type === 'number' },
];

function typeOf(v: unknown) {
  return Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v;
}

export function JsonExplorer({ labId }: SimProps) {
  const { tr, tx } = useLang();
  const [pick, setPick] = useState<Pick | null>(null);
  const [qi, setQi] = useState(0);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [wrong, setWrong] = useState(false);
  const q = QUESTIONS[qi % QUESTIONS.length];

  const click = (path: string, v: unknown) => {
    const p = { path, type: typeOf(v) };
    setPick(p);
    if (q.ok(p)) {
      setWrong(false);
      setDone((d) => ({ ...d, [q.key]: true }));
      setTimeout(() => setQi((x) => x + 1), 900);
    } else setWrong(true);
  };

  const render = (v: unknown, path: string, indent: number): ReactNode => {
    const pad = '  '.repeat(indent);
    if (Array.isArray(v))
      return (
        <>
          {'['}
          {v.map((x, i) => (
            <span key={i}>
              {'\n' + pad + '  '}
              {render(x, `${path}[${i}]`, indent + 1)}
              {i < v.length - 1 ? ',' : ''}
            </span>
          ))}
          {'\n' + pad + ']'}
        </>
      );
    if (v && typeof v === 'object')
      return (
        <>
          {'{'}
          {Object.entries(v).map(([k, x], i, arr) => (
            <span key={k}>
              {'\n' + pad + '  '}
              <span className="tok-key">"{k}"</span>: {render(x, path ? `${path}.${k}` : k, indent + 1)}
              {i < arr.length - 1 ? ',' : ''}
            </span>
          ))}
          {'\n' + pad + '}'}
        </>
      );
    const cls = typeof v === 'string' ? 'tok-str' : typeof v === 'number' ? 'tok-num' : 'tok-kw';
    const isPicked = pick?.path === path;
    return (
      <span className={cls} onClick={() => click(path, v)} style={{ cursor: 'pointer', borderRadius: 4, outline: isPicked ? `2px solid ${wrong ? 'var(--red)' : 'var(--green)'}` : '1px dashed rgba(255,255,255,.18)', padding: '0 2px' }}>
        {typeof v === 'string' ? `"${v}"` : String(v)}
      </span>
    );
  };

  return (
    <div className="sim stack">
      <div className="sim-title">🔍 {tx('Explorador JSON: aprende a "leer" la forma de los datos', 'JSON explorer: learn to "read" the shape of data')}</div>
      <div className="panel bold">❓ {tr(q.q)}</div>
      <div className="grid grid-2">
        <pre className="code">{render(SAMPLE, '', 0)}</pre>
        <div className="panel small">
          {pick ? (
            <>
              <div>{tx('Ruta para leerlo en código:', 'Path to read it in code:')}</div>
              <div className="mono bold" style={{ fontSize: '1.05rem', color: 'var(--blue)' }}>user.{pick.path}</div>
              <div className="mt">{tx('Tipo de dato:', 'Data type:')} <span className="pill purple">{pick.type}</span></div>
              <div className={`mt bold`} style={{ color: wrong ? 'var(--red)' : 'var(--green)' }}>{wrong ? tx('Ese no es. ¡Prueba otro!', 'Not that one. Try another!') : tx('¡Correcto!', 'Correct!')}</div>
            </>
          ) : (
            <span className="faint">{tx('Haz clic en cualquier valor del JSON.', 'Click any value in the JSON.')}</span>
          )}
        </div>
      </div>
      <Tasks labId={labId} items={QUESTIONS.map((x) => ({ key: x.key, label: x.q, done: !!done[x.key] }))} />
    </div>
  );
}

// =====================================================================
// REST vs GraphQL
// =====================================================================
export function GraphqlVsRest({ labId }: SimProps) {
  const { tx } = useLang();
  const [run, setRun] = useState(0);
  const [restStep, setRestStep] = useState(0);
  const [gqlStep, setGqlStep] = useState(0);
  const go = async () => {
    setRun((r) => r + 1);
    setRestStep(0);
    setGqlStep(0);
    for (let i = 1; i <= 3; i++) {
      await new Promise((r) => setTimeout(r, 700));
      setRestStep(i);
      if (i === 1) setGqlStep(1);
    }
  };
  const restReqs = ['GET /api/users/42', 'GET /api/users/42/orders', 'GET /api/users/42/address'];
  return (
    <div className="sim stack">
      <div className="sim-title">🔀 REST vs GraphQL — {tx('quiero: nombre, email y pedidos del usuario 42', 'I want: name, email and orders of user 42')}</div>
      <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={go}>▶ {tx('Pedir los datos', 'Fetch the data')}</button>
      <div className="grid grid-2">
        <div className="panel">
          <div className="bold">REST</div>
          {restReqs.map((r, i) => (
            <motion.div key={r} animate={{ opacity: restStep > i ? 1 : 0.2 }} className="mono small">
              {restStep > i ? '✅' : '⏳'} {r}
            </motion.div>
          ))}
          <div className="small mt">{tx('Viajes de ida y vuelta:', 'Round trips:')} <b>{restStep}</b></div>
          <div className="tiny muted">{tx('Y cada respuesta trae campos que no pediste (over-fetching): createdAt, avatar, settings…', 'And each response brings fields you did not ask for (over-fetching): createdAt, avatar, settings…')}</div>
        </div>
        <div className="panel">
          <div className="bold">GraphQL</div>
          <CodeBlock copy={false} snippet={{ lang: 'graphql', src: 'query {\n  user(id: 42) {\n    name\n    email\n    orders { product amount }\n  }\n}' }} />
          <div className="small mt">{tx('Viajes de ida y vuelta:', 'Round trips:')} <b>{gqlStep}</b> {gqlStep ? '✅' : ''}</div>
          <div className="tiny muted">{tx('Una sola petición. Recibes EXACTAMENTE los campos que pediste.', 'A single request. You get EXACTLY the fields you asked for.')}</div>
        </div>
      </div>
      <Tasks labId={labId} items={[{ key: 'run', label: t('Compara cuántos viajes necesita cada estilo', 'Compare how many trips each style needs'), done: run > 0 && restStep === 3 }]} />
    </div>
  );
}
