import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { t } from '../../types';
import { useLang } from '../../i18n/lang';
import { Tasks, type SimProps } from './SimHost';
import { Pipeline } from '../visuals/Pipeline';

// =====================================================================
// El ciclo del servidor: escuchar → recibir → enrutar → procesar → responder → repetir
// =====================================================================
const INCOMING = [
  { req: 'GET /users/42', handler: 'getUserById(42)', res: '200 { id: 42, name: "Ahmed" }' },
  { req: 'POST /users', handler: 'createUser(body)', res: '201 { id: 43 }' },
  { req: 'GET /products', handler: 'listProducts()', res: '200 [ …20 productos ]' },
  { req: 'DELETE /users/7', handler: 'deleteUser(7)', res: '403 Forbidden' },
  { req: 'GET /nada', handler: '¿? ninguna ruta', res: '404 Not Found' },
];

export function ServerLoop({ labId }: SimProps) {
  const { tx } = useLang();
  const steps = [
    { emoji: '👂', label: tx('Escuchar', 'Listen'), desc: tx('Esperando en el puerto 443…', 'Waiting on port 443…') },
    { emoji: '📥', label: tx('Recibir', 'Receive'), desc: tx('Lee método, URL, headers y body', 'Reads method, URL, headers and body') },
    { emoji: '🧭', label: tx('Enrutar', 'Route'), desc: tx('¿Qué función se encarga?', 'Which function handles it?') },
    { emoji: '⚙️', label: tx('Procesar', 'Process'), desc: tx('Valida, consulta la BD, calcula', 'Validates, queries the DB, computes') },
    { emoji: '📤', label: tx('Responder', 'Respond'), desc: tx('Código de estado + datos', 'Status code + data') },
  ];
  const [queue, setQueue] = useState<number[]>([]);
  const [cur, setCur] = useState<number | null>(null);
  const [phase, setPhase] = useState(0);
  const [served, setServed] = useState<number[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    if (cur === null) {
      if (queue.length) {
        const id = window.setTimeout(() => {
          setCur(queue[0]);
          setQueue((q) => q.slice(1));
          setPhase(1);
        }, 400);
        return () => clearTimeout(id);
      }
      setPhase(0);
      return;
    }
    const id = window.setTimeout(() => {
      if (phase < 4) setPhase((p) => p + 1);
      else {
        setServed((s) => [cur, ...s].slice(0, 6));
        setCur(null);
        setPhase(0);
      }
    }, 850);
    return () => clearTimeout(id);
  }, [cur, phase, queue]);

  const arrive = () => setQueue((q) => [...q, counter.current++ % INCOMING.length]);
  const r = cur !== null ? INCOMING[cur] : null;

  return (
    <div className="sim stack">
      <div className="sim-title">🔁 {tx('El ciclo de vida de un servidor', 'The life cycle of a server')}</div>
      <div className="row">
        <button className="btn btn-primary btn-sm" onClick={arrive}>📨 {tx('Llega un request', 'A request arrives')}</button>
        <button className="btn btn-sm" onClick={() => { for (let i = 0; i < 3; i++) arrive(); }}>📨×3</button>
        <span className="small muted">{tx('En cola:', 'Queued:')} {queue.length}</span>
      </div>
      <div className="row" style={{ gap: 6, alignItems: 'stretch' }}>
        {steps.map((s, i) => (
          <motion.div
            key={i}
            animate={{ scale: phase === i ? 1.08 : 1, borderColor: phase === i ? 'var(--yellow)' : 'var(--border)' }}
            style={{ flex: '1 1 110px', padding: 10, borderRadius: 14, border: '2px solid var(--border)', background: 'var(--surface)', textAlign: 'center' }}
          >
            <div style={{ fontSize: '1.6rem' }}>{s.emoji}</div>
            <div className="bold small">{i + 1}. {s.label}</div>
            <div className="tiny muted" style={{ lineHeight: 1.3 }}>{s.desc}</div>
          </motion.div>
        ))}
      </div>
      <div className="panel mono small" style={{ minHeight: 70 }}>
        {r ? (
          <>
            <div>📥 {r.req}</div>
            {phase >= 2 && <div>🧭 → {r.handler}</div>}
            {phase >= 3 && <div>⚙️ {tx('trabajando…', 'working…')}</div>}
            {phase >= 4 && <div style={{ color: 'var(--green)' }}>📤 {r.res}</div>}
          </>
        ) : (
          <span className="faint">👂 {tx('Servidor escuchando… (sin hacer nada hasta que llegue algo)', 'Server listening… (doing nothing until something arrives)')}</span>
        )}
      </div>
      {served.length > 0 && <div className="tiny faint">{tx('Atendidos:', 'Served:')} {served.map((s) => INCOMING[s].req).join(' · ')}</div>}
      <Tasks labId={labId} items={[{ key: 'three', label: t('Mira al servidor atender 3 requests completos (y volver a escuchar)', 'Watch the server handle 3 full requests (and go back to listening)'), done: counter.current >= 3 && served.length >= 3 }]} />
    </div>
  );
}

// =====================================================================
// Hilos: el restaurante y sus meseros
// =====================================================================
type Seg = { from: number; to: number; kind: 'queue' | 'cpu' | 'wait' | 'blocked' };
type Mode = 'blocking' | 'async' | 'threads';

function schedule(mode: Mode): Seg[][] {
  const rows: Seg[][] = [];
  for (let i = 0; i < 4; i++) {
    if (mode === 'blocking') {
      const s = i * 5;
      rows.push([{ from: 0, to: s, kind: 'queue' }, { from: s, to: s + 1, kind: 'cpu' }, { from: s + 1, to: s + 4, kind: 'blocked' }, { from: s + 4, to: s + 5, kind: 'cpu' }]);
    } else if (mode === 'async') {
      rows.push([{ from: 0, to: i, kind: 'queue' }, { from: i, to: i + 1, kind: 'cpu' }, { from: i + 1, to: i + 4, kind: 'wait' }, { from: 4 + i, to: 5 + i, kind: 'cpu' }]);
    } else {
      rows.push([{ from: 0, to: 1, kind: 'cpu' }, { from: 1, to: 4, kind: 'blocked' }, { from: 4, to: 5, kind: 'cpu' }]);
    }
  }
  return rows;
}

export function ThreadsSim({ labId }: SimProps) {
  const { tx } = useLang();
  const [mode, setMode] = useState<Mode>('blocking');
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [seen, setSeen] = useState<Record<Mode, boolean>>({ blocking: false, async: false, threads: false });
  const rows = schedule(mode);
  const total = Math.max(...rows.flat().map((s) => s.to));
  const MAXT = 20;

  useEffect(() => {
    if (!running) return;
    if (time >= total) {
      setRunning(false);
      setSeen((s) => ({ ...s, [mode]: true }));
      return;
    }
    const id = window.setTimeout(() => setTime((x) => Math.min(total, x + 0.25)), 70);
    return () => clearTimeout(id);
  }, [running, time, total, mode]);

  const start = (m: Mode) => {
    setMode(m);
    setTime(0);
    setRunning(true);
  };

  const modes: { id: Mode; label: string; desc: string }[] = [
    { id: 'blocking', label: tx('1 mesero que espera (bloqueante)', '1 waiter who waits (blocking)'), desc: tx('El mesero se queda parado en la cocina hasta que el plato está listo. Las demás mesas esperan.', 'The waiter stands at the kitchen until the dish is ready. Other tables wait.') },
    { id: 'async', label: tx('1 mesero que no para (Node.js)', '1 waiter who never stops (Node.js)'), desc: tx('Entrega el pedido a la cocina y va a otra mesa. Cuando el plato está listo, vuelve.', 'Hands the order to the kitchen and goes to another table. When the dish is ready, comes back.') },
    { id: 'threads', label: tx('4 meseros (multi-hilo, Java)', '4 waiters (multi-thread, Java)'), desc: tx('Cada mesa tiene su mesero. Cada uno espera, pero en paralelo. Cuesta más memoria.', 'Each table has its own waiter. Each one waits, but in parallel. Costs more memory.') },
  ];
  const colors: Record<Seg['kind'], string> = { queue: 'color-mix(in srgb, var(--red) 25%, transparent)', cpu: 'var(--primary)', wait: 'repeating-linear-gradient(45deg, var(--blue) 0 6px, transparent 6px 12px)', blocked: 'repeating-linear-gradient(45deg, var(--orange) 0 6px, transparent 6px 12px)' };

  return (
    <div className="sim stack">
      <div className="sim-title">🍽️ {tx('4 mesas piden comida. Cada plato tarda 3 s en la cocina (la base de datos).', '4 tables order food. Each dish takes 3 s in the kitchen (the database).')}</div>
      <div className="row">
        {modes.map((m) => (
          <button key={m.id} className={`btn btn-sm ${mode === m.id ? 'active' : ''}`} onClick={() => start(m.id)}>
            ▶ {m.label}
          </button>
        ))}
      </div>
      <div className="small muted">{modes.find((m) => m.id === mode)!.desc}</div>
      <div className="panel">
        {rows.map((segs, i) => (
          <div key={i} className="row" style={{ flexWrap: 'nowrap', gap: 8, marginBottom: 6 }}>
            <span className="small bold" style={{ width: 70 }}>🪑 {tx('Mesa', 'Table')} {i + 1}</span>
            <div style={{ position: 'relative', flex: 1, height: 22, background: 'var(--bg-2)', borderRadius: 6 }}>
              {segs.filter((s) => s.to > s.from && s.from < time).map((s, j) => (
                <div key={j} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(s.from / MAXT) * 100}%`, width: `${((Math.min(s.to, time) - s.from) / MAXT) * 100}%`, background: colors[s.kind], borderRadius: 4 }} />
              ))}
            </div>
            <span className="tiny mono" style={{ width: 34 }}>{time >= segs[segs.length - 1].to ? `${segs[segs.length - 1].to}s` : ''}</span>
          </div>
        ))}
        <div className="row tiny" style={{ gap: 14, marginTop: 8 }}>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, background: colors.queue, borderRadius: 3 }} /> {tx('esperando turno', 'waiting for a turn')}</span>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, background: 'var(--primary)', borderRadius: 3 }} /> {tx('mesero trabajando (CPU)', 'waiter working (CPU)')}</span>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, background: colors.blocked, borderRadius: 3 }} /> {tx('mesero parado esperando', 'waiter stuck waiting')}</span>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, background: colors.wait, borderRadius: 3 }} /> {tx('cocina trabajando, mesero libre', 'kitchen working, waiter free')}</span>
        </div>
      </div>
      <div className="row between">
        <span className="bold">⏱️ {time.toFixed(1)} s</span>
        {!running && time >= total && <span className="pill green">{tx('Todas atendidas en', 'All served in')} {total} s</span>}
      </div>
      <Tasks labId={labId} items={[{ key: 'all', label: t('Reproduce los 3 modelos y compara el tiempo total', 'Play all 3 models and compare the total time'), done: seen.blocking && seen.async && seen.threads }]} />
    </div>
  );
}

// =====================================================================
// Memoria: stack, heap y la fuga de memoria
// =====================================================================
const STACK_STEPS = [
  { stack: ['main()'], heap: [] as string[], note: { es: 'El programa empieza: main() entra a la pila (stack).', en: 'The program starts: main() goes onto the stack.' } },
  { stack: ['main()', 'getUser(42)'], heap: [], note: { es: 'main llama a getUser(42): un nuevo "plato" encima de la pila.', en: 'main calls getUser(42): a new "plate" on top of the stack.' } },
  { stack: ['main()', 'getUser(42)  id=42'], heap: ['{ id: 42, name: "Ahmed" }'], note: { es: 'Se crea un OBJETO. Los objetos viven en el heap; en el stack solo queda una "flecha" hacia él.', en: 'An OBJECT is created. Objects live in the heap; the stack only keeps an "arrow" to it.' } },
  { stack: ['main()', 'getUser(42)', 'format(user)'], heap: ['{ id: 42, name: "Ahmed" }'], note: { es: 'getUser llama a format(): otra capa más en la pila.', en: 'getUser calls format(): one more layer on the stack.' } },
  { stack: ['main()', 'getUser(42)'], heap: ['{ id: 42, name: "Ahmed" }'], note: { es: 'format() terminó: su espacio en el stack se borra SOLO, al instante.', en: 'format() finished: its stack space is cleared AUTOMATICALLY, instantly.' } },
  { stack: ['main()  user=→'], heap: ['{ id: 42, name: "Ahmed" }'], note: { es: 'getUser() terminó y devolvió el objeto. main lo sigue usando, así que sigue vivo en el heap.', en: 'getUser() finished and returned the object. main still uses it, so it stays alive in the heap.' } },
  { stack: [], heap: [], note: { es: 'Nadie apunta ya al objeto → el recolector de basura (garbage collector) lo limpia. 🧹', en: 'Nothing points to the object anymore → the garbage collector cleans it up. 🧹' } },
];

export function MemorySim({ labId }: SimProps) {
  const { lang, tx } = useLang();
  const [st, setSt] = useState(0);
  const [ram, setRam] = useState(20);
  const [leak, setLeak] = useState(true);
  const [crashed, setCrashed] = useState(false);
  const [crashes, setCrashes] = useState(0);
  const [cleanServed, setCleanServed] = useState(0);
  const [stackSeen, setStackSeen] = useState(false);
  const s = STACK_STEPS[st];

  useEffect(() => {
    if (st === STACK_STEPS.length - 1) setStackSeen(true);
  }, [st]);

  const request = () => {
    if (crashed) return;
    if (leak) {
      setRam((r) => {
        const n = r + 9;
        if (n >= 100) {
          setCrashed(true);
          setCrashes((c) => c + 1);
          setTimeout(() => {
            setCrashed(false);
            setRam(20);
          }, 2200);
          return 100;
        }
        return n;
      });
    } else {
      setRam((r) => Math.min(95, r + 9));
      setTimeout(() => setRam((r) => Math.max(20, r - 9)), 500);
      setCleanServed((c) => c + 1);
    }
  };

  return (
    <div className="sim stack">
      <div className="sim-title">🧠 {tx('La memoria de tu programa', "Your program's memory")}</div>
      <div className="grid grid-2">
        <div className="panel">
          <div className="bold">📚 Stack {tx('(pila de platos)', '(stack of plates)')}</div>
          <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 4, minHeight: 150, justifyContent: 'flex-start', marginTop: 8 }}>
            <AnimatePresence>
              {s.stack.map((f) => (
                <motion.div key={f.split(' ')[0]} layout initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} className="mono small" style={{ padding: '6px 10px', borderRadius: 8, background: 'color-mix(in srgb, var(--primary) 25%, transparent)', border: '2px solid var(--primary)' }}>
                  {f}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div className="panel">
          <div className="bold">🏔️ Heap {tx('(el almacén grande)', '(the big warehouse)')}</div>
          <div className="stack mt" style={{ minHeight: 150 }}>
            <AnimatePresence>
              {s.heap.map((h) => (
                <motion.div key={h} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, rotate: 20 }} className="mono small" style={{ padding: '8px 10px', borderRadius: 10, background: 'color-mix(in srgb, var(--orange) 22%, transparent)', border: '2px solid var(--orange)' }}>
                  {h}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <div className="panel bold small">{lang === 'es' ? s.note.es : s.note.en}</div>
      <div className="row center">
        <button className="btn btn-sm" onClick={() => setSt((x) => Math.max(0, x - 1))} disabled={st === 0}>◀</button>
        <button className="btn btn-primary btn-sm" onClick={() => setSt((x) => (x + 1) % STACK_STEPS.length)}>{st === STACK_STEPS.length - 1 ? '↺' : tx('Siguiente paso ▶', 'Next step ▶')}</button>
        <span className="small faint">{st + 1}/{STACK_STEPS.length}</span>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', width: '100%' }} />
      <div className="bold">💧 {tx('Fuga de memoria (memory leak)', 'Memory leak')}</div>
      <div className="small muted">{tx('Con la fuga activa, cada request guarda datos en una lista global que NUNCA se limpia.', 'With the leak on, each request stores data in a global list that is NEVER cleaned.')}</div>
      <div className="row">
        <button className="btn btn-primary btn-sm" onClick={request} disabled={crashed}>📨 {tx('Atender request', 'Handle request')}</button>
        <label className="small row" style={{ gap: 6 }}>
          <input type="checkbox" checked={leak} onChange={() => setLeak((l) => !l)} /> {tx('Código con fuga', 'Leaky code')}
        </label>
      </div>
      <div className="mono tiny">{leak ? 'const cache = []; app.get("/x", (req) => { cache.push(bigObject); })  // 😱' : 'app.get("/x", (req) => { const temp = bigObject; /* se libera al terminar */ })  // ✅'}</div>
      <div>
        <div className="row between small"><span>RAM</span><span className="mono">{ram}%</span></div>
        <div className="progress" style={{ height: 18 }}>
          <div style={{ width: `${ram}%`, background: ram > 80 ? 'var(--red)' : ram > 55 ? 'var(--yellow)' : undefined }} />
        </div>
      </div>
      {crashed && (
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="feedback bad">
          💥 {tx('¡El proceso murió por falta de memoria! (Out Of Memory)… Un gestor como PM2/Docker lo reinicia automáticamente ⟳', 'The process died out of memory! (OOM)… A manager like PM2/Docker restarts it automatically ⟳')}
        </motion.div>
      )}
      <Tasks
        labId={labId}
        items={[
          { key: 'stack', label: t('Recorre el stack paso a paso hasta que el garbage collector limpia', 'Step through the stack until the garbage collector cleans up'), done: stackSeen },
          { key: 'crash', label: t('Tumba el servidor con la fuga de memoria', 'Crash the server with the memory leak'), done: crashes > 0 },
          { key: 'fix', label: t('Arregla el código (quita la fuga) y atiende 10 requests sin caerte', 'Fix the code (remove the leak) and handle 10 requests without crashing'), done: cleanServed >= 10 },
        ]}
      />
    </div>
  );
}

// =====================================================================
// Capas: un pedido de comida atraviesa controller → service → repository → BD
// =====================================================================
export function LayersSim({ labId }: SimProps) {
  const { tx } = useLang();
  const [seen, setSeen] = useState<Set<number>>(new Set());
  return (
    <div className="stack">
      <Pipeline
        item={t('POST /orders { restaurantId: 5, items: [🍕, 🥤] }', 'POST /orders { restaurantId: 5, items: [🍕, 🥤] }')}
        itemEmoji="🛵"
        success={t('201 Created: pedido #981 confirmado. El restaurante fue notificado.', '201 Created: order #981 confirmed. The restaurant was notified.')}
        onFinish={(f) => setSeen((s) => new Set(s).add(f))}
        stages={[
          { emoji: '🎮', label: 'Controller', desc: t('Recibe el request y saca restaurantId e items del body', 'Receives the request and extracts restaurantId and items from the body') },
          { emoji: '🧠', label: t('Service: ¿restaurante abierto?', 'Service: restaurant open?'), desc: t('Regla de negocio', 'Business rule'), gate: { question: t('¿Está abierto?', 'Is it open?'), failResult: t('409: "El restaurante está cerrado"', '409: "The restaurant is closed"') } },
          { emoji: '💰', label: t('Service: ¿saldo suficiente?', 'Service: enough balance?'), desc: t('Regla de negocio', 'Business rule'), gate: { question: t('¿Le alcanza el saldo?', 'Is the balance enough?'), failResult: t('402: "Saldo insuficiente"', '402: "Insufficient balance"') } },
          { emoji: '🛵', label: t('Service: ¿hay repartidor?', 'Service: driver available?'), desc: t('Coordina con otro servicio', 'Coordinates with another service'), gate: { question: t('¿Hay repartidor libre?', 'Is a driver free?'), failResult: t('503: "No hay repartidores, intenta en 5 min"', '503: "No drivers, try again in 5 min"') } },
          { emoji: '🗄️', label: 'Repository', desc: t('INSERT INTO orders… y UPDATE users SET balance…', 'INSERT INTO orders… and UPDATE users SET balance…') },
          { emoji: '💾', label: t('Base de datos', 'Database'), desc: t('Guarda todo de forma permanente', 'Stores everything permanently') },
        ]}
      />
      <div className="tiny faint">{tx('Cada capa tiene UNA responsabilidad. Si mañana cambias de base de datos, solo tocas el Repository.', 'Each layer has ONE responsibility. If you switch databases tomorrow, you only touch the Repository.')}</div>
      <Tasks
        labId={labId}
        items={[
          { key: 'ok', label: t('Haz un pedido que llegue hasta la base de datos', 'Place an order that reaches the database'), done: seen.has(-1) },
          { key: 'rule', label: t('Haz que una regla del Service rechace el pedido', 'Make a Service rule reject the order'), done: [1, 2, 3].some((i) => seen.has(i)) },
          { key: 'all', label: t('Prueba las 3 reglas del Service por separado', 'Try the 3 Service rules separately'), done: [1, 2, 3].every((i) => seen.has(i)) },
        ]}
      />
    </div>
  );
}
