import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { t } from '../../types';
import { useLang } from '../../i18n/lang';
import { Tasks, type SimProps } from './SimHost';

// =====================================================================
// Caché de aplicación (estilo Redis) con TTL e invalidación
// =====================================================================
export function CacheSim({ labId }: SimProps) {
  const { tx } = useLang();
  const [enabled, setEnabled] = useState(true);
  const [ttl, setTtl] = useState(10);
  const [autoInvalidate, setAutoInvalidate] = useState(false);
  const [dbPrice, setDbPrice] = useState(999);
  const [entry, setEntry] = useState<{ price: number; expires: number } | null>(null);
  const [now, setNow] = useState(Date.now());
  const [stats, setStats] = useState({ reqs: 0, db: 0, hits: 0, totalMs: 0 });
  const [last, setLast] = useState<{ hit: boolean; ms: number; price: number } | null>(null);
  const [done, setDone] = useState({ miss: false, hit: false, burst: false, stale: false, invalidated: false });
  const entryRef = useRef(entry);
  entryRef.current = entry;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const valid = entry && entry.expires > now;
  const stale = valid && entry!.price !== dbPrice;
  useEffect(() => {
    if (stale) setDone((d) => ({ ...d, stale: true }));
  }, [stale]);

  const request = (n = 1) => {
    let e = entryRef.current;
    let db = 0, hits = 0, ms = 0;
    let lastRes = { hit: false, ms: 0, price: dbPrice };
    for (let i = 0; i < n; i++) {
      const isValid = enabled && e && e.expires > Date.now();
      if (isValid) {
        hits++;
        ms += 1;
        lastRes = { hit: true, ms: 1, price: e!.price };
      } else {
        db++;
        ms += 200;
        lastRes = { hit: false, ms: 200, price: dbPrice };
        if (enabled) e = { price: dbPrice, expires: Date.now() + ttl * 1000 };
      }
    }
    setEntry(enabled ? e : null);
    setStats((s) => ({ reqs: s.reqs + n, db: s.db + db, hits: s.hits + hits, totalMs: s.totalMs + ms }));
    setLast(lastRes);
    setDone((d) => ({ ...d, miss: d.miss || db > 0, hit: d.hit || hits > 0, burst: d.burst || (n >= 100 && db <= 1 && enabled) }));
  };

  const changePrice = () => {
    const p = dbPrice === 999 ? 799 : 999;
    setDbPrice(p);
    if (autoInvalidate) {
      setEntry(null);
      setDone((d) => ({ ...d, invalidated: true }));
    }
  };
  const avg = stats.reqs ? Math.round(stats.totalMs / stats.reqs) : 0;
  const remaining = valid ? Math.ceil((entry!.expires - now) / 1000) : 0;

  return (
    <div className="sim stack">
      <div className="sim-title">⚡ GET /popular-products — {tx('una consulta pesada (200 ms) a la base de datos', 'a heavy database query (200 ms)')}</div>
      <div className="row">
        <label className="small row" style={{ gap: 6 }}><input type="checkbox" checked={enabled} onChange={() => { setEnabled((v) => !v); setEntry(null); }} /> {tx('Caché activada', 'Cache enabled')}</label>
        <label className="small row" style={{ gap: 6 }}>TTL <input type="range" min={3} max={30} value={ttl} onChange={(e) => setTtl(Number(e.target.value))} /> <span className="mono">{ttl}s</span></label>
        <label className="small row" style={{ gap: 6 }}><input type="checkbox" checked={autoInvalidate} onChange={() => setAutoInvalidate((v) => !v)} /> {tx('Invalidar al cambiar datos', 'Invalidate on data change')}</label>
      </div>
      <div className="row">
        <button className="btn btn-primary btn-sm" onClick={() => request(1)}>🙂 {tx('1 usuario', '1 user')}</button>
        <button className="btn btn-sm" onClick={() => request(100)}>👥 {tx('100 usuarios a la vez', '100 users at once')}</button>
        <button className="btn btn-sm" onClick={changePrice}>🏷️ {tx('Admin cambia el precio en la BD', 'Admin changes the price in the DB')}</button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setEntry(null); setDone((d) => ({ ...d, invalidated: true })); }}>🧹 {tx('Borrar caché', 'Clear cache')}</button>
      </div>
      <div className="grid grid-3">
        <div className="panel center">
          <div style={{ fontSize: '1.6rem' }}>🧑‍💻</div>
          <div className="small bold">{tx('Usuario ve', 'User sees')}</div>
          <div className="mono bold" style={{ fontSize: '1.3rem', color: last && last.price !== dbPrice ? 'var(--red)' : undefined }}>{last ? `$${last.price}` : '—'}</div>
          {last && <span className={`pill ${last.hit ? 'green' : 'yellow'}`}>{last.hit ? 'HIT ⚡ 1ms' : 'MISS 🐢 200ms'}</span>}
        </div>
        <div className="panel center" style={{ borderColor: valid ? 'var(--green)' : undefined }}>
          <div style={{ fontSize: '1.6rem' }}>🧠</div>
          <div className="small bold">Redis</div>
          <div className="mono small">{valid ? `popular-products = $${entry!.price}` : tx('(vacía)', '(empty)')}</div>
          {valid && <div className="tiny muted">{tx('expira en', 'expires in')} {remaining}s</div>}
        </div>
        <div className="panel center">
          <div style={{ fontSize: '1.6rem' }}>🗄️</div>
          <div className="small bold">{tx('Base de datos', 'Database')}</div>
          <div className="mono small">price = ${dbPrice}</div>
          <div className="tiny muted">{tx('consultas:', 'queries:')} {stats.db}</div>
        </div>
      </div>
      {stale && <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="feedback bad small">⚠️ {tx('¡Datos viejos! La BD dice', 'Stale data! The DB says')} ${dbPrice} {tx('pero la caché sigue sirviendo', 'but the cache keeps serving')} ${entry!.price}. {tx('Este es el famoso problema de invalidación de caché.', 'This is the famous cache invalidation problem.')}</motion.div>}
      <div className="row small">
        <span className="pill">{tx('Requests', 'Requests')}: {stats.reqs}</span>
        <span className="pill green">HIT: {stats.hits}</span>
        <span className="pill yellow">{tx('Consultas BD', 'DB queries')}: {stats.db}</span>
        <span className="pill purple">{tx('Promedio', 'Average')}: {avg} ms</span>
      </div>
      <Tasks
        labId={labId}
        items={[
          { key: 'misshit', label: t('Haz un MISS (primera vez) y luego un HIT (desde caché)', 'Get a MISS (first time) and then a HIT (from cache)'), done: done.miss && done.hit },
          { key: 'burst', label: t('Con caché, atiende a 100 usuarios con máximo 1 consulta a la BD', 'With cache, serve 100 users with at most 1 DB query'), done: done.burst },
          { key: 'stale', label: t('Provoca datos viejos: cambia el precio con la caché llena', 'Cause stale data: change the price while the cache is full'), done: done.stale },
          { key: 'inv', label: t('Arréglalo invalidando la caché', 'Fix it by invalidating the cache'), done: done.invalidated },
        ]}
      />
    </div>
  );
}

// =====================================================================
// Capas de caché: navegador → CDN → Redis → BD
// =====================================================================
type Res = 'logo' | 'products' | 'me';
const LAYERS = [
  { id: 'browser', emoji: '🧑‍💻', ms: 0, can: ['logo'] as Res[] },
  { id: 'cdn', emoji: '🌍', ms: 20, can: ['logo'] as Res[] },
  { id: 'redis', emoji: '🧠', ms: 3, can: ['products'] as Res[] },
  { id: 'db', emoji: '🗄️', ms: 200, can: ['logo', 'products', 'me'] as Res[] },
];

export function CacheLayers({ labId }: SimProps) {
  const { tx } = useLang();
  const names: Record<string, string> = {
    browser: tx('Caché del navegador', 'Browser cache'),
    cdn: tx('CDN (servidor cercano)', 'CDN (nearby server)'),
    redis: tx('Caché de la app (Redis)', 'App cache (Redis)'),
    db: tx('Servidor + Base de datos', 'Server + Database'),
  };
  const resNames: Record<Res, string> = { logo: '🖼️ logo.png', products: '📦 /api/popular-products', me: '🔒 /api/me' };
  const [stores, setStores] = useState<Record<string, Set<Res>>>({ browser: new Set(), cdn: new Set(), redis: new Set(), db: new Set(['logo', 'products', 'me']) });
  const [path, setPath] = useState<{ layer: number; found: number; res: Res } | null>(null);
  const [total, setTotal] = useState(0);
  const [hits, setHits] = useState<Record<string, boolean>>({});

  const fetchRes = (res: Res) => {
    const found = LAYERS.findIndex((l) => stores[l.id].has(res));
    const ms = LAYERS.slice(0, found + 1).reduce((a, l) => a + l.ms, 0);
    setTotal(ms);
    setPath({ layer: found, found, res });
    setHits((h) => ({ ...h, [LAYERS[found].id]: true }));
    setStores((s) => {
      const n = { ...s };
      LAYERS.slice(0, found).forEach((l) => {
        if (l.can.includes(res)) n[l.id] = new Set([...s[l.id], res]);
      });
      return n;
    });
  };

  return (
    <div className="sim stack">
      <div className="sim-title">🧅 {tx('Las capas de caché: ¿dónde se encuentra lo que pides?', 'Cache layers: where is what you asked for found?')}</div>
      <div className="row">
        {(Object.keys(resNames) as Res[]).map((r) => (
          <button key={r} className="btn btn-sm" onClick={() => fetchRes(r)}>{tx('Pedir', 'Get')} {resNames[r]}</button>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={() => { setStores({ browser: new Set(), cdn: new Set(), redis: new Set(), db: new Set(['logo', 'products', 'me']) }); setPath(null); }}>↺</button>
      </div>
      <div className="stack" style={{ gap: 6 }}>
        {LAYERS.map((l, i) => {
          const visited = path && i <= path.found;
          const isFound = path?.found === i;
          return (
            <motion.div key={l.id} animate={{ x: isFound ? 8 : 0 }} className="row" style={{ padding: '10px 12px', borderRadius: 14, border: `2px solid ${isFound ? 'var(--green)' : visited ? 'var(--yellow)' : 'var(--border)'}`, background: 'var(--surface)' }}>
              <span style={{ fontSize: '1.4rem' }}>{l.emoji}</span>
              <span className="bold grow">{names[l.id]}</span>
              <span className="tiny muted">{[...stores[l.id]].map((r) => resNames[r].split(' ')[0]).join(' ') || '—'}</span>
              <span className="mono tiny">+{l.ms}ms</span>
              {isFound && <span className="pill green">{tx('¡aquí!', 'here!')}</span>}
              {visited && !isFound && <span className="pill yellow">miss</span>}
            </motion.div>
          );
        })}
      </div>
      {path && <div className="panel small">⏱️ {resNames[path.res]}: <b>{total} ms</b>. {path.res === 'me' ? tx('Los datos privados (tu perfil) NO se guardan en CDN ni en cachés compartidas.', 'Private data (your profile) is NOT stored in the CDN or shared caches.') : path.found === LAYERS.length - 1 ? tx('Primera vez: hay que ir hasta el fondo. Pídelo otra vez…', 'First time: it has to go all the way down. Ask again…') : tx('¡Encontrado en una capa cercana! Mucho más rápido.', 'Found in a nearby layer! Much faster.')}</div>}
      <Tasks
        labId={labId}
        items={[
          { key: 'browser', label: t('Haz que el logo salga directo de la caché del navegador (0 ms)', 'Make the logo come straight from the browser cache (0 ms)'), done: !!hits.browser },
          { key: 'redis', label: t('Haz que /api/popular-products salga de Redis', 'Make /api/popular-products come from Redis'), done: !!hits.redis },
        ]}
      />
    </div>
  );
}
