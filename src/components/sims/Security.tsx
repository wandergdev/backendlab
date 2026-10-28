import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Database } from 'sql.js';
import { t } from '../../types';
import { useLang } from '../../i18n/lang';
import { b64url, b64urlDecode, randomSalt, sha256Hex, signJwt, verifyJwt } from '../../lib/crypto';
import { freshDb } from '../../lib/sql';
import { Tasks, type SimProps } from './SimHost';

// =====================================================================
// Hash de contraseñas
// =====================================================================
export function HashLab({ labId }: SimProps) {
  const { tx } = useLang();
  const [pwd, setPwd] = useState('mypassword123');
  const [hash, setHash] = useState('');
  const [salted, setSalted] = useState(false);
  const [users, setUsers] = useState<{ name: string; salt: string; hash: string }[]>([]);
  const [typed, setTyped] = useState('');
  const [loginRes, setLoginRes] = useState<null | boolean>(null);
  const [stored, setStored] = useState<{ salt: string; hash: string } | null>(null);
  const [done, setDone] = useState({ changed: false, salt: false, okLogin: false, badLogin: false });
  const firstPwd = useRef(pwd);

  useEffect(() => {
    sha256Hex(pwd).then(setHash);
    if (pwd !== firstPwd.current) setDone((d) => ({ ...d, changed: true }));
  }, [pwd]);

  useEffect(() => {
    (async () => {
      const mk = async (name: string) => {
        const salt = salted ? randomSalt() : '';
        return { name, salt, hash: await sha256Hex(salt + '123456') };
      };
      setUsers([await mk('Ana'), await mk('Beto')]);
      if (salted) setDone((d) => ({ ...d, salt: true }));
    })();
  }, [salted]);

  const register = async () => {
    const salt = randomSalt();
    setStored({ salt, hash: await sha256Hex(salt + pwd) });
    setLoginRes(null);
  };
  const login = async () => {
    if (!stored) return;
    const ok = (await sha256Hex(stored.salt + typed)) === stored.hash;
    setLoginRes(ok);
    setDone((d) => ({ ...d, okLogin: d.okLogin || ok, badLogin: d.badLogin || !ok }));
  };

  return (
    <div className="sim stack">
      <div className="sim-title">🔐 {tx('La licuadora de contraseñas (hash)', 'The password blender (hash)')}</div>
      <div className="small muted">{tx('Un hash es como licuar una fruta: de la fruta sale el jugo, pero del jugo NO puedes reconstruir la fruta.', 'A hash is like blending fruit: you get juice from fruit, but you CANNOT rebuild the fruit from the juice.')}</div>
      <input className="input mono" value={pwd} onChange={(e) => setPwd(e.target.value)} />
      <div className="panel mono small" style={{ wordBreak: 'break-all' }}>
        <span className="faint">SHA-256 → </span>
        <motion.span key={hash} initial={{ opacity: 0.2 }} animate={{ opacity: 1 }} style={{ color: 'var(--yellow)' }}>{hash}</motion.span>
      </div>
      <div className="tiny faint">{tx('👉 Cambia UNA sola letra y mira cómo cambia TODO el hash.', '👉 Change ONE single letter and watch the WHOLE hash change.')}</div>

      <div className="panel">
        <div className="row between">
          <div className="bold">🧂 {tx('Dos usuarios con la MISMA contraseña "123456"', 'Two users with the SAME password "123456"')}</div>
          <label className="small row" style={{ gap: 6 }}><input type="checkbox" checked={salted} onChange={() => setSalted((s) => !s)} /> {tx('Añadir sal (salt)', 'Add salt')}</label>
        </div>
        {users.map((u) => (
          <div key={u.name} className="mono tiny" style={{ wordBreak: 'break-all', marginTop: 6 }}>
            <b>{u.name}</b> {u.salt && <span className="pill">salt: {u.salt}</span>} → <span style={{ color: users[0].hash === users[1]?.hash ? 'var(--red)' : 'var(--green)' }}>{u.hash.slice(0, 40)}…</span>
          </div>
        ))}
        <div className="small mt">{users[0]?.hash === users[1]?.hash ? tx('❌ Iguales: si un hacker roba la BD, sabe que ambos usan la misma clave (y puede usar tablas de hashes conocidos).', '❌ Identical: if a hacker steals the DB, they know both share the same password (and can use tables of known hashes).') : tx('✅ Diferentes gracias a la sal aleatoria. bcrypt y argon2 hacen esto por ti.', '✅ Different thanks to the random salt. bcrypt and argon2 do this for you.')}</div>
      </div>

      <div className="panel stack">
        <div className="bold">🚪 {tx('Así funciona el login sin saber tu contraseña', 'This is how login works without knowing your password')}</div>
        <div className="row">
          <button className="btn btn-sm" onClick={register}>1. {tx('Registrarme con la contraseña de arriba', 'Sign up with the password above')}</button>
          {stored && <span className="mono tiny">BD: salt={stored.salt} hash={stored.hash.slice(0, 16)}…</span>}
        </div>
        {stored && (
          <div className="row">
            <input className="input mono grow" placeholder={tx('2. Escribe la contraseña para entrar', '2. Type the password to log in')} value={typed} onChange={(e) => setTyped(e.target.value)} style={{ maxWidth: 300 }} />
            <button className="btn btn-primary btn-sm" onClick={login}>{tx('Entrar', 'Log in')}</button>
            {loginRes !== null && <span className={`pill ${loginRes ? 'green' : 'red'}`}>{loginRes ? tx('hash coincide → ¡dentro!', 'hash matches → you are in!') : tx('hash distinto → 401', 'different hash → 401')}</span>}
          </div>
        )}
      </div>
      <div className="tip small">⚠️ {tx('Aquí usamos SHA-256 para que lo veas. Para contraseñas reales usa bcrypt o argon2: son LENTOS a propósito para frenar a los atacantes.', 'We use SHA-256 here so you can see it. For real passwords use bcrypt or argon2: they are SLOW on purpose to slow down attackers.')}</div>
      <Tasks
        labId={labId}
        items={[
          { key: 'changed', label: t('Cambia la contraseña y mira el efecto avalancha', 'Change the password and see the avalanche effect'), done: done.changed },
          { key: 'salt', label: t('Activa la sal y mira cómo la misma contraseña da hashes distintos', 'Turn on salt and see the same password produce different hashes'), done: done.salt },
          { key: 'login', label: t('Regístrate y entra con la contraseña correcta', 'Sign up and log in with the correct password'), done: done.okLogin },
          { key: 'bad', label: t('Intenta entrar con una contraseña incorrecta', 'Try to log in with a wrong password'), done: done.badLogin },
        ]}
      />
    </div>
  );
}

// =====================================================================
// JWT: la pulsera del festival
// =====================================================================
export function JwtLab({ labId }: SimProps) {
  const { tx } = useLang();
  const SERVER_SECRET = 'clave-super-secreta-del-servidor';
  const [payload, setPayload] = useState('{\n  "userId": 42,\n  "name": "Sara",\n  "role": "user",\n  "exp": ' + (Math.floor(Date.now() / 1000) + 3600) + '\n}');
  const [token, setToken] = useState('');
  const [verdict, setVerdict] = useState<{ valid: boolean; expired?: boolean; payload?: unknown; error?: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState({ signed: false, tampered: false, expired: false });

  const sign = async () => {
    try {
      const p = JSON.parse(payload);
      setErr(null);
      setToken(await signJwt(p, SERVER_SECRET));
      setVerdict(null);
      setDone((d) => ({ ...d, signed: true }));
    } catch {
      setErr(tx('El payload no es JSON válido', 'The payload is not valid JSON'));
    }
  };
  const verify = async (tk = token) => {
    const r = await verifyJwt(tk, SERVER_SECRET);
    const exp = (r.payload as { exp?: number } | undefined)?.exp;
    const expired = r.valid && typeof exp === 'number' && exp < Date.now() / 1000;
    setVerdict({ ...r, expired });
    if (!r.valid && r.error !== 'format') setDone((d) => ({ ...d, tampered: true }));
    if (expired) setDone((d) => ({ ...d, expired: true }));
  };
  const hack = () => {
    const parts = token.split('.');
    if (parts.length !== 3) return;
    try {
      const p = JSON.parse(b64urlDecode(parts[1]));
      p.role = 'admin';
      const forged = `${parts[0]}.${b64url(JSON.stringify(p))}.${parts[2]}`;
      setToken(forged);
      verify(forged);
    } catch {
      /* token roto */
    }
  };
  const makeExpired = () => {
    try {
      const p = JSON.parse(payload);
      p.exp = Math.floor(Date.now() / 1000) - 60;
      setPayload(JSON.stringify(p, null, 2));
    } catch {
      /* ignorar */
    }
  };
  const parts = token.split('.');
  let decoded = '';
  try {
    decoded = parts.length === 3 ? JSON.stringify(JSON.parse(b64urlDecode(parts[1])), null, 2) : '';
  } catch {
    decoded = '⚠️';
  }

  return (
    <div className="sim stack">
      <div className="sim-title">🎟️ {tx('JWT: la pulsera del festival', 'JWT: the festival wristband')}</div>
      <div className="small muted">{tx('El servidor te da una pulsera firmada. Cualquiera puede LEERLA, pero nadie puede CAMBIARLA sin que se note la firma.', 'The server gives you a signed wristband. Anyone can READ it, but nobody can CHANGE it without breaking the signature.')}</div>
      <div className="grid grid-2">
        <div className="stack">
          <div className="tiny bold muted">PAYLOAD</div>
          <textarea className="textarea" value={payload} onChange={(e) => setPayload(e.target.value)} style={{ minHeight: 140 }} />
          <div className="row">
            <button className="btn btn-primary btn-sm" onClick={sign}>✍️ {tx('Servidor: firmar token', 'Server: sign token')}</button>
            <button className="btn btn-ghost btn-sm" onClick={makeExpired}>⌛ {tx('Poner exp en el pasado', 'Set exp in the past')}</button>
          </div>
          {err && <div className="small" style={{ color: 'var(--red)' }}>{err}</div>}
        </div>
        <div className="stack">
          <div className="tiny bold muted">TOKEN</div>
          <div className="code" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', minHeight: 140 }}>
            {parts.length === 3 ? (
              <>
                <span style={{ color: '#ff6b81' }}>{parts[0]}</span>.<span style={{ color: '#c792ea' }}>{parts[1]}</span>.<span style={{ color: '#4cc9f0' }}>{parts[2]}</span>
              </>
            ) : (
              <span className="faint">{tx('Firma un token primero →', 'Sign a token first →')}</span>
            )}
          </div>
          <div className="row tiny" style={{ gap: 10 }}>
            <span style={{ color: '#ff6b81' }}>■ header</span>
            <span style={{ color: '#c792ea' }}>■ payload</span>
            <span style={{ color: '#4cc9f0' }}>■ {tx('firma', 'signature')}</span>
          </div>
        </div>
      </div>
      {token && (
        <>
          <div className="panel">
            <div className="tiny bold muted">{tx('👀 CUALQUIERA PUEDE DECODIFICAR EL PAYLOAD (¡no guardes secretos aquí!)', '👀 ANYONE CAN DECODE THE PAYLOAD (do not store secrets here!)')}</div>
            <pre className="mono small" style={{ margin: 0 }}>{decoded}</pre>
          </div>
          <div className="row">
            <button className="btn btn-green btn-sm" onClick={() => verify()}>🔎 {tx('Servidor: verificar', 'Server: verify')}</button>
            <button className="btn btn-red btn-sm" onClick={hack}>😈 {tx('Hacker: cambiar role a "admin"', 'Hacker: change role to "admin"')}</button>
          </div>
          {verdict && (
            <motion.div key={JSON.stringify(verdict)} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={`feedback ${verdict.valid && !verdict.expired ? 'ok' : 'bad'}`}>
              {verdict.valid
                ? verdict.expired
                  ? tx('⌛ Firma válida, pero el token EXPIRÓ → 401. Hay que volver a iniciar sesión.', '⌛ Valid signature, but the token EXPIRED → 401. You must log in again.')
                  : tx('✅ Firma válida y vigente. El servidor confía en el payload sin consultar la base de datos.', '✅ Valid, current signature. The server trusts the payload without querying the database.')
                : tx('❌ ¡Firma inválida! Alguien modificó el token. → 401 Unauthorized', '❌ Invalid signature! Someone tampered with the token. → 401 Unauthorized')}
            </motion.div>
          )}
        </>
      )}
      <Tasks
        labId={labId}
        items={[
          { key: 'signed', label: t('Firma un token como servidor', 'Sign a token as the server'), done: done.signed },
          { key: 'tamper', label: t('Haz de hacker: cambia el rol y mira cómo falla la firma', 'Play hacker: change the role and see the signature fail'), done: done.tampered },
          { key: 'expired', label: t('Crea un token expirado y verifícalo', 'Create an expired token and verify it'), done: done.expired },
        ]}
      />
    </div>
  );
}

// =====================================================================
// Inyección SQL (contra un SQLite real)
// =====================================================================
export function InjectionLab({ labId }: SimProps) {
  const { tx } = useLang();
  const db = useRef<Database | null>(null);
  const [email, setEmail] = useState('ahmed@example.com');
  const [pass, setPass] = useState('secreto123');
  const [safe, setSafe] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [done, setDone] = useState({ normal: false, hacked: false, blocked: false });

  useEffect(() => {
    freshDb().then((d) => (db.current = d));
    return () => db.current?.close();
  }, []);

  const concatenated = `SELECT * FROM users WHERE email = '${email}' AND password = '${pass}'`;
  const isAttack = /'|--/.test(email + pass);

  const login = () => {
    if (!db.current) return;
    try {
      let rows: unknown[][] = [];
      if (safe) {
        const st = db.current.prepare('SELECT * FROM users WHERE email = ? AND password = ?');
        st.bind([email, pass]);
        while (st.step()) rows.push(st.get());
        st.free();
      } else {
        rows = db.current.exec(concatenated)[0]?.values ?? [];
      }
      if (rows.length) {
        const name = String(rows[0][1]);
        setResult({ ok: true, text: tx(`Bienvenido, ${name} (${rows[0][5]}) — la consulta devolvió ${rows.length} fila(s)`, `Welcome, ${name} (${rows[0][5]}) — the query returned ${rows.length} row(s)`) });
        if (isAttack && !safe) setDone((d) => ({ ...d, hacked: true }));
        else setDone((d) => ({ ...d, normal: true }));
      } else {
        setResult({ ok: false, text: tx('Email o contraseña incorrectos (0 filas)', 'Wrong email or password (0 rows)') });
        if (isAttack && safe) setDone((d) => ({ ...d, blocked: true }));
      }
    } catch (e) {
      setResult({ ok: false, text: `SQL error: ${(e as Error).message}` });
    }
  };

  return (
    <div className="sim stack">
      <div className="sim-title">💉 {tx('Inyección SQL contra una base de datos real', 'SQL injection against a real database')}</div>
      <div className="row">
        <button className={`btn btn-sm ${!safe ? 'active' : ''}`} onClick={() => setSafe(false)}>😬 {tx('Código vulnerable (concatenar)', 'Vulnerable code (concatenation)')}</button>
        <button className={`btn btn-sm ${safe ? 'active' : ''}`} onClick={() => setSafe(true)}>🛡️ {tx('Código seguro (parámetros ?)', 'Safe code (parameters ?)')}</button>
      </div>
      <div className="grid grid-2">
        <div className="stack">
          <label className="small bold">Email<input className="input mono" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="small bold">{tx('Contraseña', 'Password')}<input className="input mono" value={pass} onChange={(e) => setPass(e.target.value)} /></label>
          <div className="row">
            <button className="btn btn-primary btn-sm" onClick={login}>{tx('Iniciar sesión', 'Log in')}</button>
            <button className="btn btn-red btn-sm" onClick={() => { setEmail('admin@site.com'); setPass("' OR 1=1 --"); }}>😈 {tx('Cargar ataque', 'Load attack')}</button>
          </div>
        </div>
        <div className="panel">
          <div className="tiny bold muted mb">{tx('LA CONSULTA QUE LLEGA A LA BASE DE DATOS', 'THE QUERY THAT REACHES THE DATABASE')}</div>
          {safe ? (
            <div className="mono small">
              SELECT * FROM users WHERE email = <span className="pill blue">?</span> AND password = <span className="pill blue">?</span>
              <div className="tiny muted mt">{tx('Valores enviados APARTE, como texto puro:', 'Values sent SEPARATELY, as plain text:')} ["{email}", "{pass}"]</div>
            </div>
          ) : (
            <div className="mono small" style={{ wordBreak: 'break-all' }}>
              SELECT * FROM users WHERE email = '<span style={{ color: 'var(--yellow)' }}>{email}</span>' AND password = '<span style={{ color: isAttack ? 'var(--red)' : 'var(--yellow)' }}>{pass}</span>'
              {isAttack && <div className="tiny mt" style={{ color: 'var(--red)' }}>{tx('⚠️ La comilla cierra el texto, "OR 1=1" siempre es verdad y "--" comenta el resto.', '⚠️ The quote closes the string, "OR 1=1" is always true and "--" comments out the rest.')}</div>}
            </div>
          )}
        </div>
      </div>
      {result && <div className={`feedback ${result.ok ? (isAttack ? 'bad' : 'ok') : isAttack ? 'ok' : 'bad'}`}>{result.ok && isAttack ? '🚨 ' : ''}{result.text}{result.ok && isAttack ? tx(' — ¡Entraste SIN la contraseña!', ' — You got in WITHOUT the password!') : ''}{!result.ok && isAttack && safe ? tx(' — 🛡️ El ataque se trató como texto normal. Bloqueado.', ' — 🛡️ The attack was treated as plain text. Blocked.') : ''}</div>}
      <Tasks
        labId={labId}
        items={[
          { key: 'normal', label: t('Inicia sesión normal (ahmed@example.com / secreto123)', 'Log in normally (ahmed@example.com / secreto123)'), done: done.normal },
          { key: 'hacked', label: t("Con el código vulnerable, entra usando ' OR 1=1 --", "With the vulnerable code, get in using ' OR 1=1 --"), done: done.hacked },
          { key: 'blocked', label: t('Repite el ataque con consultas parametrizadas y mira cómo falla', 'Repeat the attack with parameterized queries and watch it fail'), done: done.blocked },
        ]}
      />
    </div>
  );
}

// =====================================================================
// XSS
// =====================================================================
export const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function XssLab({ labId }: SimProps) {
  const { tx } = useLang();
  const [text, setText] = useState('¡Me encantó este producto! <b>5 estrellas</b>');
  const [escape, setEscape] = useState(false);
  const [comments, setComments] = useState<{ raw: string; escaped: boolean }[]>([]);
  const [stolen, setStolen] = useState(false);
  const [done, setDone] = useState({ posted: false, attacked: false, defended: false });
  const malicious = (s: string) => /<script|onerror\s*=|onload\s*=|javascript:/i.test(s);

  const post = () => {
    setComments((c) => [{ raw: text, escaped: escape }, ...c].slice(0, 4));
    setDone((d) => ({ ...d, posted: true, attacked: d.attacked || (malicious(text) && !escape), defended: d.defended || (malicious(text) && escape) }));
    if (malicious(text) && !escape) {
      setStolen(true);
      setTimeout(() => setStolen(false), 3500);
    }
  };

  return (
    <div className="sim stack">
      <div className="sim-title">🦠 {tx('XSS: un comentario que esconde código', 'XSS: a comment hiding code')}</div>
      <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} style={{ minHeight: 70 }} />
      <div className="row">
        <button className="btn btn-red btn-sm" onClick={() => setText('Buen post <script>steal(document.cookie)</script>')}>😈 {tx('Cargar ataque', 'Load attack')}</button>
        <label className="small row" style={{ gap: 6 }}><input type="checkbox" checked={escape} onChange={() => setEscape((e) => !e)} /> 🛡️ {tx('Escapar HTML antes de mostrar', 'Escape HTML before rendering')}</label>
        <button className="btn btn-primary btn-sm" onClick={post}>{tx('Publicar comentario', 'Post comment')}</button>
      </div>
      <div className="panel" style={{ position: 'relative' }}>
        <div className="tiny bold muted mb">{tx('LO QUE VEN OTROS USUARIOS', 'WHAT OTHER USERS SEE')}</div>
        {comments.map((c, i) => (
          <div key={i} className="small" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            💬{' '}
            {c.escaped ? (
              <span className="mono">{c.raw}</span>
            ) : (
              <span dangerouslySetInnerHTML={{ __html: c.raw.replace(/<script[\s\S]*?<\/script>/gi, '<span style="color:var(--red)">[⚡ script ejecutado]</span>').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|\S+)/gi, '').replace(/javascript:/gi, '#blocked:') }} />
            )}
            {c.escaped && <div className="tiny faint mono">HTML: {escapeHtml(c.raw)}</div>}
          </div>
        ))}
        {!comments.length && <span className="faint small">{tx('Sin comentarios aún', 'No comments yet')}</span>}
        <AnimatePresence>
          {stolen && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="feedback bad" style={{ position: 'absolute', inset: 10, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
              🍪➡️🕵️ {tx('(Simulación) El script corrió en el navegador de OTRO usuario y envió su cookie de sesión al atacante: session=8f2a…', "(Simulation) The script ran in ANOTHER user's browser and sent their session cookie to the attacker: session=8f2a…")}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Tasks
        labId={labId}
        items={[
          { key: 'post', label: t('Publica un comentario normal', 'Post a normal comment'), done: done.posted },
          { key: 'attack', label: t('Publica el ataque SIN escapar y mira qué pasa', 'Post the attack WITHOUT escaping and see what happens'), done: done.attacked },
          { key: 'defend', label: t('Activa "Escapar HTML" y publica el mismo ataque: ahora es texto inofensivo', 'Turn on "Escape HTML" and post the same attack: now it is harmless text'), done: done.defended },
        ]}
      />
    </div>
  );
}

// =====================================================================
// Rate limiting (cubeta de fichas)
// =====================================================================
export function RateLimitSim({ labId }: SimProps) {
  const { tx } = useLang();
  const CAP = 5;
  const [tokens, setTokens] = useState(CAP);
  const [log, setLog] = useState<{ id: number; ok: boolean; bot: boolean }[]>([]);
  const [bot, setBot] = useState(false);
  const [stats, setStats] = useState({ ok: 0, blocked: 0, botBlocked: 0, recovered: false });
  const tokRef = useRef(tokens);
  tokRef.current = tokens;
  const blockedOnce = useRef(false);
  const id = useRef(0);

  const hit = (isBot: boolean) => {
    const ok = tokRef.current >= 1;
    if (ok) {
      tokRef.current -= 1;
      setTokens((tk) => tk - 1);
    }
    setLog((l) => [{ id: id.current++, ok, bot: isBot }, ...l].slice(0, 14));
    setStats((s) => ({
      ok: s.ok + (ok ? 1 : 0),
      blocked: s.blocked + (ok ? 0 : 1),
      botBlocked: s.botBlocked + (!ok && isBot ? 1 : 0),
      recovered: s.recovered || (ok && !isBot && blockedOnce.current),
    }));
    if (!ok && !isBot) blockedOnce.current = true;
  };

  useEffect(() => {
    const r = window.setInterval(() => setTokens((tk) => Math.min(CAP, tk + 1)), 1000);
    return () => clearInterval(r);
  }, []);
  useEffect(() => {
    if (!bot) return;
    const b = window.setInterval(() => hit(true), 120);
    return () => clearInterval(b);
  }, [bot]);

  return (
    <div className="sim stack">
      <div className="sim-title">🚦 {tx('Rate limiting: máximo 5 requests, se recarga 1 por segundo', 'Rate limiting: max 5 requests, refills 1 per second')}</div>
      <div className="row">
        <span className="small bold">🪣</span>
        {Array.from({ length: CAP }, (_, i) => (
          <motion.span key={i} animate={{ scale: i < tokens ? 1 : 0.6, opacity: i < tokens ? 1 : 0.2 }} style={{ fontSize: '1.6rem' }}>
            🪙
          </motion.span>
        ))}
      </div>
      <div className="row">
        <button className="btn btn-primary btn-sm" onClick={() => hit(false)}>📨 {tx('Enviar request', 'Send request')}</button>
        <label className="small row" style={{ gap: 6 }}><input type="checkbox" checked={bot} onChange={() => setBot((b) => !b)} /> 🤖 {tx('Bot de fuerza bruta (8 intentos/seg)', 'Brute-force bot (8 tries/sec)')}</label>
      </div>
      <div className="row" style={{ gap: 4 }}>
        {log.map((l) => (
          <span key={l.id} className={`status-badge tiny ${l.ok ? 's2' : 's4'}`}>{l.bot ? '🤖' : '🙂'} {l.ok ? 200 : 429}</span>
        ))}
      </div>
      <div className="small">✅ {stats.ok} · ⛔ 429: {stats.blocked} · 🤖 {tx('bloqueados', 'blocked')}: {stats.botBlocked}</div>
      <Tasks
        labId={labId}
        items={[
          { key: '429', label: t('Envía requests muy rápido hasta recibir un 429 Too Many Requests', 'Send requests very fast until you get a 429 Too Many Requests'), done: stats.blocked > 0 },
          { key: 'bot', label: t('Activa el bot: mira cómo se bloquean la mayoría de sus intentos', 'Turn on the bot: see most of its attempts blocked'), done: stats.botBlocked >= 10 },
          { key: 'wait', label: t('Espera a que se recarguen fichas y vuelve a entrar', 'Wait for tokens to refill and get through again'), done: stats.recovered },
        ]}
      />
    </div>
  );
}
