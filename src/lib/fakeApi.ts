import { t, type L } from '../types';

// Un "servidor" de mentira que vive en tu navegador. Se comporta como una API REST real:
// pasa por middlewares (log → auth → validación), enruta, habla con una "base de datos" y responde.

export type ApiRequest = { method: string; path: string; headers: Record<string, string>; body?: string };
export type TraceStep = { emoji: string; label: L; ok: boolean };
export type ApiResponse = { status: number; statusText: string; headers: Record<string, string>; body: unknown; trace: TraceStep[]; ms: number };

type User = { id: number; name: string; email: string; role: 'admin' | 'user'; password: string };
type Order = { id: number; userId: number; product: string; amount: number };

export const STATUS_TEXT: Record<number, string> = {
  200: 'OK', 201: 'Created', 204: 'No Content', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
  404: 'Not Found', 405: 'Method Not Allowed', 409: 'Conflict', 429: 'Too Many Requests', 500: 'Internal Server Error',
};

function seedUsers(): User[] {
  return [
    { id: 1, name: 'Ahmed', email: 'ahmed@example.com', role: 'admin', password: 'secreto123' },
    { id: 2, name: 'Sara', email: 'sara@example.com', role: 'user', password: 'sara2025' },
    { id: 3, name: 'Lucía', email: 'lucia@example.com', role: 'user', password: 'luz*luz' },
  ];
}
const ORDERS: Order[] = [
  { id: 1, userId: 1, product: 'Laptop', amount: 999 },
  { id: 2, userId: 1, product: 'Mouse', amount: 25 },
  { id: 3, userId: 2, product: 'Keyboard', amount: 75 },
];

const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

export function createApi() {
  let users = seedUsers();
  let nextId = 4;
  const tokens = new Map<string, number>();

  const publicUser = (u: User) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

  function handle(req: ApiRequest): ApiResponse {
    const started = performance.now();
    const trace: TraceStep[] = [];
    const method = req.method.toUpperCase();
    const [rawPath, query = ''] = req.path.trim().split('?');
    const path = rawPath.replace(/\/+$/, '') || '/';
    const params = new URLSearchParams(query);
    const headers = Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k.toLowerCase(), v]));

    const done = (status: number, body: unknown): ApiResponse => ({
      status,
      statusText: STATUS_TEXT[status] ?? '',
      headers: { 'Content-Type': 'application/json', 'X-Powered-By': 'BackendLab' },
      body,
      trace,
      ms: Math.round(performance.now() - started + 20 + Math.random() * 40),
    });

    // 1) Middleware de logging
    trace.push({ emoji: '📝', label: t(`Log: ${method} ${path}`, `Log: ${method} ${path}`), ok: true });

    // 2) Middleware de auth: lee el token si viene
    let me: User | undefined;
    const auth = headers['authorization'];
    if (auth) {
      const token = auth.replace(/^Bearer\s+/i, '').trim();
      const uid = tokens.get(token);
      me = users.find((u) => u.id === uid);
      trace.push(
        me
          ? { emoji: '🪪', label: t(`Auth: token válido → eres ${me.name} (${me.role})`, `Auth: valid token → you are ${me.name} (${me.role})`), ok: true }
          : { emoji: '🪪', label: t('Auth: el token no es válido o expiró', 'Auth: token is invalid or expired'), ok: false },
      );
    } else {
      trace.push({ emoji: '🪪', label: t('Auth: sin token (visitante anónimo)', 'Auth: no token (anonymous visitor)'), ok: true });
    }
    const requireAuth = (): ApiResponse | null => {
      if (!me) {
        trace.push({ emoji: '⛔', label: t('Esta ruta necesita login → 401', 'This route needs login → 401'), ok: false });
        return done(401, { error: 'Unauthorized', message: 'Envía Authorization: Bearer <token>. Obtén uno con POST /api/login' });
      }
      return null;
    };

    // 3) Validación de cuerpo JSON
    let body: Record<string, unknown> = {};
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (req.body && req.body.trim()) {
        try {
          body = JSON.parse(req.body);
          trace.push({ emoji: '🧪', label: t('Validación: el JSON está bien formado', 'Validation: JSON is well-formed'), ok: true });
        } catch {
          trace.push({ emoji: '🧪', label: t('Validación: JSON mal escrito → 400', 'Validation: malformed JSON → 400'), ok: false });
          return done(400, { error: 'Bad Request', message: 'El body no es JSON válido. Revisa comillas dobles y comas.' });
        }
      }
    }

    // 4) Router
    const route = (label: string) => trace.push({ emoji: '🧭', label: t(`Router: ${label}`, `Router: ${label}`), ok: true });
    const db = (es: string, en: string, ok = true) => trace.push({ emoji: '🗄️', label: t(`BD: ${es}`, `DB: ${en}`), ok });
    const m = path.match(/^\/api\/users\/(\d+)(\/orders)?$/);

    if (path === '/api/users') {
      if (method === 'GET') {
        route('GET /api/users → listUsers()');
        const page = Math.max(1, Number(params.get('page') ?? 1));
        const limit = Math.max(1, Number(params.get('limit') ?? 10));
        db('SELECT * FROM users', 'SELECT * FROM users');
        const slice = users.slice((page - 1) * limit, page * limit).map(publicUser);
        return done(200, { page, limit, total: users.length, data: slice });
      }
      if (method === 'POST') {
        route('POST /api/users → createUser()');
        const errors: string[] = [];
        if (typeof body.name !== 'string' || body.name.trim().length < 2) errors.push('name: obligatorio, mínimo 2 letras');
        if (typeof body.email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) errors.push('email: debe ser un email válido');
        if (errors.length) {
          trace.push({ emoji: '🧪', label: t('Validación de datos falló → 400', 'Data validation failed → 400'), ok: false });
          return done(400, { error: 'Bad Request', errors });
        }
        if (users.some((u) => u.email === body.email)) {
          db('ese email ya existe (UNIQUE)', 'that email already exists (UNIQUE)', false);
          return done(409, { error: 'Conflict', message: 'Ya existe un usuario con ese email' });
        }
        const u: User = { id: nextId++, name: String(body.name), email: String(body.email), role: 'user', password: String(body.password ?? '1234') };
        users = [...users, u];
        db(`INSERT INTO users → id ${u.id}`, `INSERT INTO users → id ${u.id}`);
        return done(201, { message: 'Usuario creado', user: publicUser(u) });
      }
      trace.push({ emoji: '🧭', label: t(`Router: /api/users no acepta ${method}`, `Router: /api/users does not accept ${method}`), ok: false });
      return done(405, { error: 'Method Not Allowed', allowed: ['GET', 'POST'] });
    }

    if (m) {
      const id = Number(m[1]);
      const u = users.find((x) => x.id === id);
      if (m[2]) {
        if (method !== 'GET') return done(405, { error: 'Method Not Allowed', allowed: ['GET'] });
        route(`GET /api/users/${id}/orders → listOrders()`);
        if (!u) {
          db(`no hay usuario ${id}`, `no user ${id}`, false);
          return done(404, { error: 'Not Found', message: `El usuario ${id} no existe` });
        }
        db(`SELECT * FROM orders WHERE user_id = ${id}`, `SELECT * FROM orders WHERE user_id = ${id}`);
        return done(200, ORDERS.filter((o) => o.userId === id));
      }
      if (!['GET', 'PUT', 'PATCH', 'DELETE'].includes(method)) return done(405, { error: 'Method Not Allowed', allowed: ['GET', 'PUT', 'PATCH', 'DELETE'] });
      route(`${method} /api/users/${id}`);
      if (!u) {
        db(`SELECT ... WHERE id = ${id} → 0 filas`, `SELECT ... WHERE id = ${id} → 0 rows`, false);
        return done(404, { error: 'Not Found', message: `El usuario ${id} no existe` });
      }
      if (method === 'GET') {
        db(`SELECT * FROM users WHERE id = ${id}`, `SELECT * FROM users WHERE id = ${id}`);
        return done(200, publicUser(u));
      }
      if (method === 'PUT') {
        if (typeof body.name !== 'string' || typeof body.email !== 'string') {
          trace.push({ emoji: '🧪', label: t('PUT reemplaza TODO: faltan name y/o email → 400', 'PUT replaces EVERYTHING: name and/or email missing → 400'), ok: false });
          return done(400, { error: 'Bad Request', message: 'PUT necesita el objeto completo: { "name", "email" }. Para cambiar solo un campo usa PATCH.' });
        }
        const nu = { ...u, name: body.name, email: body.email };
        users = users.map((x) => (x.id === id ? nu : x));
        db(`UPDATE users SET name, email WHERE id = ${id}`, `UPDATE users SET name, email WHERE id = ${id}`);
        return done(200, publicUser(nu));
      }
      if (method === 'PATCH') {
        const nu = { ...u, ...(typeof body.name === 'string' ? { name: body.name } : {}), ...(typeof body.email === 'string' ? { email: body.email } : {}) };
        users = users.map((x) => (x.id === id ? nu : x));
        db(`UPDATE users SET (solo lo enviado) WHERE id = ${id}`, `UPDATE users SET (only what was sent) WHERE id = ${id}`);
        return done(200, publicUser(nu));
      }
      // DELETE: solo admins
      const denied = requireAuth();
      if (denied) return denied;
      if (me!.role !== 'admin') {
        trace.push({ emoji: '🚫', label: t(`Autorización: ${me!.name} no es admin → 403`, `Authorization: ${me!.name} is not admin → 403`), ok: false });
        return done(403, { error: 'Forbidden', message: 'Sabemos quién eres, pero solo un admin puede borrar usuarios' });
      }
      users = users.filter((x) => x.id !== id);
      db(`DELETE FROM users WHERE id = ${id}`, `DELETE FROM users WHERE id = ${id}`);
      return done(200, { message: `Usuario ${id} eliminado` });
    }

    if (path === '/api/login') {
      if (method !== 'POST') return done(405, { error: 'Method Not Allowed', allowed: ['POST'] });
      route('POST /api/login → login()');
      const u = users.find((x) => x.email === body.email);
      db('SELECT * FROM users WHERE email = ?', 'SELECT * FROM users WHERE email = ?');
      if (!u || u.password !== body.password) {
        trace.push({ emoji: '🔐', label: t('El hash de la contraseña no coincide → 401', 'Password hash does not match → 401'), ok: false });
        return done(401, { error: 'Unauthorized', message: 'Email o contraseña incorrectos' });
      }
      const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ userId: u.id, role: u.role, exp: Math.floor(Date.now() / 1000) + 3600 })}.${Math.random().toString(36).slice(2, 12)}`;
      tokens.set(token, u.id);
      trace.push({ emoji: '🔐', label: t('Contraseña correcta → se firma un token JWT', 'Password correct → a JWT token is signed'), ok: true });
      return done(200, { token, expiresIn: 3600 });
    }

    if (path === '/api/me') {
      route('GET /api/me → profile()');
      const denied = requireAuth();
      if (denied) return denied;
      return done(200, publicUser(me!));
    }

    if (path === '/api/admin/stats') {
      route('GET /api/admin/stats → stats()');
      const denied = requireAuth();
      if (denied) return denied;
      if (me!.role !== 'admin') {
        trace.push({ emoji: '🚫', label: t('Autorización: necesitas rol admin → 403', 'Authorization: admin role required → 403'), ok: false });
        return done(403, { error: 'Forbidden', message: 'Necesitas rol admin' });
      }
      return done(200, { users: users.length, orders: ORDERS.length, revenue: ORDERS.reduce((a, o) => a + o.amount, 0) });
    }

    if (path === '/api/crash') {
      route('GET /api/crash → buggyHandler()');
      trace.push({ emoji: '💥', label: t('El código lanzó una excepción no controlada → 500', 'The code threw an unhandled exception → 500'), ok: false });
      return done(500, { error: 'Internal Server Error', message: 'TypeError: Cannot read properties of undefined (reading "price")' });
    }

    if (path === '/' || path === '/api') {
      route('GET /api → index');
      return done(200, { message: 'Bienvenido a la API de BackendLab', endpoints: ['/api/users', '/api/users/:id', '/api/users/:id/orders', '/api/login', '/api/me', '/api/admin/stats', '/api/crash'] });
    }

    trace.push({ emoji: '🧭', label: t(`Router: ninguna ruta coincide con ${path} → 404`, `Router: no route matches ${path} → 404`), ok: false });
    return done(404, { error: 'Not Found', message: `No existe la ruta ${path}` });
  }

  return { handle, reset: () => { users = seedUsers(); nextId = 4; tokens.clear(); } };
}

export type FakeApi = ReturnType<typeof createApi>;
