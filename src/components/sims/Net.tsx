import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { t } from '../../types';
import { useLang } from '../../i18n/lang';
import { Tasks, type SimProps } from './SimHost';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// =====================================================================
// DNS: la guía telefónica de Internet
// =====================================================================
const DNS_DB: Record<string, string> = {
  'google.com': '142.250.80.46',
  'youtube.com': '142.250.72.14',
  'github.com': '140.82.112.3',
  'wikipedia.org': '208.80.154.224',
  'dev.to': '151.101.2.217',
  'backendlab.dev': '10.0.0.42',
};

export function DnsSim({ labId }: SimProps) {
  const { tx } = useLang();
  const [domain, setDomain] = useState('google.com');
  const [active, setActive] = useState(-1);
  const [log, setLog] = useState<{ text: string; ok?: boolean }[]>([]);
  const [busy, setBusy] = useState(false);
  const [cache, setCache] = useState<Record<string, string>>({});
  const [done, setDone] = useState({ lookup: false, cached: false, nx: false });

  const stations = [
    { emoji: '🧑‍💻', label: tx('Tu navegador', 'Your browser') },
    { emoji: '📒', label: tx('Caché local', 'Local cache') },
    { emoji: '🏢', label: tx('Resolver (tu proveedor)', 'Resolver (your ISP)') },
    { emoji: '🌐', label: tx('Servidor raíz', 'Root server') },
    { emoji: '🏷️', label: tx('Servidor .com/.org', '.com/.org server') },
    { emoji: '📗', label: tx('Servidor autoritativo', 'Authoritative server') },
  ];

  const lookup = async () => {
    const d = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!d || busy) return;
    setBusy(true);
    setLog([]);
    const add = (text: string, ok?: boolean) => setLog((l) => [...l, { text, ok }]);
    const tld = d.split('.').pop();
    setActive(0);
    add(tx(`Escribiste "${d}". El computador NO entiende nombres, solo números (IP).`, `You typed "${d}". Computers DON'T understand names, only numbers (IPs).`));
    await sleep(700);
    setActive(1);
    if (cache[d]) {
      add(tx(`📒 ¡Ya lo tenía guardado! ${d} → ${cache[d]} (0 viajes, ~1 ms)`, `📒 Already cached! ${d} → ${cache[d]} (0 trips, ~1 ms)`), true);
      setDone((x) => ({ ...x, cached: true }));
      setActive(-1);
      setBusy(false);
      return;
    }
    add(tx('📒 No está en la caché. Hay que preguntar…', '📒 Not in the cache. We need to ask…'));
    await sleep(700);
    setActive(2);
    add(tx('🏢 Resolver: "Déjame averiguarlo por ti".', '🏢 Resolver: "Let me find out for you".'));
    await sleep(800);
    setActive(3);
    add(tx(`🌐 Raíz: "No sé ${d}, pero pregunta al servidor de .${tld}".`, `🌐 Root: "I don't know ${d}, but ask the .${tld} server".`));
    await sleep(800);
    setActive(4);
    const ip = DNS_DB[d];
    if (!ip) {
      add(tx(`🏷️ .${tld}: "No existe ningún dominio ${d}" → NXDOMAIN ❌`, `🏷️ .${tld}: "There is no domain ${d}" → NXDOMAIN ❌`), false);
      setDone((x) => ({ ...x, nx: true }));
      setActive(-1);
      setBusy(false);
      return;
    }
    add(tx(`🏷️ .${tld}: "El responsable de ${d} es ns1.${d}".`, `🏷️ .${tld}: "${d} is handled by ns1.${d}".`));
    await sleep(800);
    setActive(5);
    add(tx(`📗 Autoritativo: "${d} está en ${ip}" ✅`, `📗 Authoritative: "${d} is at ${ip}" ✅`), true);
    await sleep(800);
    setActive(0);
    add(tx(`🧑‍💻 Navegador: ¡listo! Me conecto a ${ip} y lo guardo en caché para la próxima vez.`, `🧑‍💻 Browser: done! Connecting to ${ip} and caching it for next time.`), true);
    setCache((c) => ({ ...c, [d]: ip }));
    setDone((x) => ({ ...x, lookup: true }));
    await sleep(500);
    setActive(-1);
    setBusy(false);
  };

  return (
    <div className="sim stack">
      <div className="sim-title">📞 {tx('Simulador DNS', 'DNS simulator')}</div>
      <div className="row">
        <input className="input mono grow" value={domain} onChange={(e) => setDomain(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && lookup()} style={{ maxWidth: 320 }} />
        <button className="btn btn-primary" onClick={lookup} disabled={busy}>
          🔎 {tx('Buscar IP', 'Find IP')}
        </button>
      </div>
      <div className="row small faint">
        {tx('Prueba:', 'Try:')}
        {Object.keys(DNS_DB).slice(0, 4).map((d) => (
          <button key={d} className="btn btn-ghost btn-sm" onClick={() => setDomain(d)}>{d}</button>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={() => setDomain('noexiste123.com')}>noexiste123.com</button>
      </div>
      <div className="row" style={{ gap: 6, justifyContent: 'space-between' }}>
        {stations.map((s, i) => (
          <motion.div
            key={i}
            animate={{ scale: active === i ? 1.12 : 1, borderColor: active === i ? 'var(--yellow)' : 'var(--border)' }}
            style={{ flex: '1 1 90px', textAlign: 'center', padding: '8px 4px', border: '2px solid var(--border)', borderRadius: 14, background: 'var(--surface)' }}
          >
            <div style={{ fontSize: '1.7rem' }}>{s.emoji}</div>
            <div className="tiny bold" style={{ lineHeight: 1.2 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>
      <div className="panel mono small" style={{ minHeight: 120 }}>
        <AnimatePresence>
          {log.map((l, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ color: l.ok === true ? 'var(--green)' : l.ok === false ? 'var(--red)' : undefined }}>
              {l.text}
            </motion.div>
          ))}
        </AnimatePresence>
        {!log.length && <span className="faint">{tx('Pulsa "Buscar IP" para ver el viaje de la pregunta.', 'Press "Find IP" to watch the question travel.')}</span>}
      </div>
      {Object.keys(cache).length > 0 && (
        <div className="small">
          📒 {tx('Caché:', 'Cache:')}{' '}
          {Object.entries(cache).map(([d, ip]) => (
            <span key={d} className="pill" style={{ marginRight: 6 }}>
              {d} → {ip}
            </span>
          ))}
        </div>
      )}
      <Tasks
        labId={labId}
        items={[
          { key: 'lookup', label: t('Busca la IP de un dominio real (ej: google.com)', 'Find the IP of a real domain (e.g. google.com)'), done: done.lookup },
          { key: 'cached', label: t('Busca el MISMO dominio otra vez y mira lo rápido que es (caché)', 'Look up the SAME domain again and see how fast it is (cache)'), done: done.cached },
          { key: 'nx', label: t('Busca un dominio que no existe y mira el error NXDOMAIN', 'Look up a domain that does not exist and see the NXDOMAIN error'), done: done.nx },
        ]}
      />
    </div>
  );
}

// =====================================================================
// Puertos: las puertas del edificio
// =====================================================================
const PORTS = [
  { port: 22, name: 'SSH', es: 'Quiero controlar el servidor desde mi terminal (SSH)', en: 'I want to control the server from my terminal (SSH)' },
  { port: 80, name: 'HTTP', es: 'Quiero ver una página web normal (sin candado)', en: 'I want to see a normal web page (no padlock)' },
  { port: 443, name: 'HTTPS', es: 'Quiero ver una página web segura 🔒', en: 'I want to see a secure web page 🔒' },
  { port: 3306, name: 'MySQL', es: 'Soy la app y necesito hablar con MySQL', en: 'I am the app and need to talk to MySQL' },
  { port: 5432, name: 'PostgreSQL', es: 'Soy la app y necesito hablar con PostgreSQL', en: 'I am the app and need to talk to PostgreSQL' },
  { port: 6379, name: 'Redis', es: 'Necesito leer algo de la caché Redis', en: 'I need to read something from the Redis cache' },
  { port: 27017, name: 'MongoDB', es: 'Necesito guardar un documento en MongoDB', en: 'I need to save a document in MongoDB' },
];

export function PortsSim({ labId }: SimProps) {
  const { lang, tx } = useLang();
  const [target, setTarget] = useState(() => Math.floor(Math.random() * PORTS.length));
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [flash, setFlash] = useState<number | null>(null);
  const [showNames, setShowNames] = useState(true);

  const knock = (i: number) => {
    if (i === target) {
      setScore((s) => s + 1);
      setFlash(i);
      setWrong(null);
      setTimeout(() => {
        setFlash(null);
        let n = target;
        while (n === target) n = Math.floor(Math.random() * PORTS.length);
        setTarget(n);
      }, 650);
    } else setWrong(i);
  };
  const p = PORTS[target];
  return (
    <div className="sim stack">
      <div className="sim-title">🏢 {tx('El edificio del servidor: ¿qué puerta abres?', 'The server building: which door do you open?')}</div>
      <div className="panel row between">
        <div>
          <div className="tiny faint bold">{tx('UN VISITANTE DICE:', 'A VISITOR SAYS:')}</div>
          <div className="bold">🧑 “{lang === 'es' ? p.es : p.en}”</div>
        </div>
        <span className="pill purple">⭐ {score}</span>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 10 }}>
        {PORTS.map((d, i) => (
          <motion.button
            key={d.port}
            onClick={() => knock(i)}
            className={`option ${flash === i ? 'correct' : wrong === i ? 'wrong shake' : ''}`}
            style={{ flexDirection: 'column', gap: 2, padding: '12px 6px', alignItems: 'center' }}
            whileTap={{ scale: 0.94 }}
          >
            <span style={{ fontSize: '1.8rem' }}>{flash === i ? '🚪✨' : '🚪'}</span>
            <span className="mono bold">{d.port}</span>
            {showNames && <span className="tiny muted">{d.name}</span>}
          </motion.button>
        ))}
      </div>
      <label className="small row" style={{ gap: 6 }}>
        <input type="checkbox" checked={!showNames} onChange={() => setShowNames((v) => !v)} />
        {tx('Modo difícil: ocultar los nombres (¡memoria pura!)', 'Hard mode: hide the names (pure memory!)')}
      </label>
      <Tasks
        labId={labId}
        items={[
          { key: 'five', label: t('Acierta 5 puertas', 'Get 5 doors right'), done: score >= 5 },
          { key: 'twelve', label: t('Acierta 12 puertas (repetición = memoria)', 'Get 12 doors right (repetition = memory)'), done: score >= 12 },
        ]}
      />
    </div>
  );
}

// =====================================================================
// OSI: el sobre dentro del sobre
// =====================================================================
export function OsiSim({ labId }: SimProps) {
  const { tx } = useLang();
  const [step, setStep] = useState(0);
  const [seenAll, setSeenAll] = useState(false);
  const layers = [
    { name: tx('Aplicación (HTTP)', 'Application (HTTP)'), color: '#7c6cff', label: 'GET /api/users  Host: api.tienda.com', note: tx('Tu código vive aquí: requests y responses.', 'Your code lives here: requests and responses.') },
    { name: tx('Transporte (TCP)', 'Transport (TCP)'), color: '#4cc9f0', label: tx('Puerto origen 52044 → destino 443 · seq #1', 'Src port 52044 → dst port 443 · seq #1'), note: tx('TCP numera los pedazos y confirma que lleguen.', 'TCP numbers the pieces and confirms they arrive.') },
    { name: tx('Red (IP)', 'Network (IP)'), color: '#ff9f43', label: 'IP 192.168.1.20 → 142.250.80.46', note: tx('IP pone la dirección de la casa destino.', 'IP puts the destination house address.') },
  ];
  // pasos: 0 datos, 1-3 envolver, 4 viajar, 5-7 desenvolver
  const wrapped = step <= 3 ? step : step === 4 ? 3 : 7 - step;
  const side = step >= 4 ? 'server' : 'client';
  useEffect(() => {
    if (step === 7) setSeenAll(true);
  }, [step]);
  const desc = [
    tx('Tu app quiere pedir la lista de usuarios. Empieza con los datos.', 'Your app wants the user list. It starts with the data.'),
    tx('1. Capa de Aplicación: se escribe el mensaje HTTP.', '1. Application layer: the HTTP message is written.'),
    tx('2. Capa de Transporte: TCP lo mete en un sobre con puertos y número de orden.', '2. Transport layer: TCP wraps it with ports and a sequence number.'),
    tx('3. Capa de Red: IP lo mete en otro sobre con la dirección IP destino.', '3. Network layer: IP wraps it with the destination IP address.'),
    tx('🚚 El paquete viaja por cables, Wi-Fi y routers hasta el servidor.', '🚚 The packet travels over cables, Wi-Fi and routers to the server.'),
    tx('El servidor abre el sobre de IP: "sí, es para mí".', 'The server opens the IP envelope: "yes, it is for me".'),
    tx('Abre el sobre de TCP: "va al puerto 443, mi servidor web".', 'Opens the TCP envelope: "it goes to port 443, my web server".'),
    tx('¡Tu código recibe el request HTTP limpio! 🎉', 'Your code receives the clean HTTP request! 🎉'),
  ][step];

  const renderBox = (level: number): ReactNode => {
    if (level === 0) return <div className="mono small" style={{ padding: 8, background: 'var(--surface)', borderRadius: 8 }}>📄 {tx('datos', 'data')}</div>;
    const l = layers[level - 1];
    return (
      <motion.div layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ border: `3px solid ${l.color}`, borderRadius: 12, padding: 8, background: `color-mix(in srgb, ${l.color} 10%, transparent)` }}>
        <div className="tiny bold" style={{ color: l.color }}>{l.name}</div>
        <div className="tiny mono" style={{ marginBottom: 6 }}>{l.label}</div>
        {renderBox(level - 1)}
      </motion.div>
    );
  };

  return (
    <div className="sim stack">
      <div className="sim-title">✉️ {tx('Sobres dentro de sobres (capas de red)', 'Envelopes inside envelopes (network layers)')}</div>
      <div className="row between">
        <span className="bold">{side === 'client' ? '💻 ' + tx('Cliente', 'Client') : '🖥️ ' + tx('Servidor', 'Server')}</span>
        {step === 4 && <motion.span animate={{ x: [0, 30, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} style={{ fontSize: '1.6rem' }}>🚚</motion.span>}
      </div>
      <div style={{ maxWidth: 520, margin: '0 auto', width: '100%' }}>{renderBox(wrapped)}</div>
      <div className="panel bold">{desc}</div>
      {wrapped > 0 && step !== 4 && <div className="small muted">💡 {layers[wrapped - 1].note}</div>}
      <div className="row center">
        <button className="btn btn-sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>◀ {tx('Atrás', 'Back')}</button>
        <button className="btn btn-primary btn-sm" onClick={() => setStep((s) => (s >= 7 ? 0 : s + 1))}>{step >= 7 ? `↺ ${tx('Otra vez', 'Again')}` : `${tx('Siguiente', 'Next')} ▶`}</button>
        <span className="small faint">{step}/7</span>
      </div>
      <Tasks labId={labId} items={[{ key: 'trip', label: t('Acompaña al paquete en todo su viaje (envolver → viajar → desenvolver)', 'Follow the packet all the way (wrap → travel → unwrap)'), done: seenAll }]} />
    </div>
  );
}

// =====================================================================
// TCP vs UDP
// =====================================================================
type Pkt = { n: number; state: 'flying' | 'ok' | 'lost' | 'resent' };

export function TcpUdpSim({ labId }: SimProps) {
  const { tx } = useLang();
  const [tcp, setTcp] = useState<Pkt[]>([]);
  const [udp, setUdp] = useState<Pkt[]>([]);
  const [times, setTimes] = useState<{ tcp: number; udp: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [ran, setRan] = useState(0);

  const run = async () => {
    setBusy(true);
    setTcp([]);
    setUdp([]);
    setTimes(null);
    const N = 6;
    const lost = new Set<number>();
    while (lost.size < 2) lost.add(1 + Math.floor(Math.random() * N));
    // UDP: dispara todo y no espera
    const udpOrder = Array.from({ length: N }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    for (const n of udpOrder) {
      setUdp((u) => [...u, { n, state: lost.has(n) ? 'lost' : 'ok' }]);
      await sleep(180);
    }
    const udpTime = N * 20;
    // TCP: en orden, con confirmaciones y reenvíos
    for (let n = 1; n <= N; n++) {
      if (lost.has(n)) {
        setTcp((x) => [...x, { n, state: 'lost' }]);
        await sleep(450);
        setTcp((x) => x.map((p) => (p.n === n ? { ...p, state: 'resent' } : p)));
        await sleep(350);
      } else {
        setTcp((x) => [...x, { n, state: 'ok' }]);
        await sleep(300);
      }
    }
    setTimes({ tcp: N * 45 + lost.size * 120, udp: udpTime });
    setRan((r) => r + 1);
    setBusy(false);
  };

  const Row = ({ title, emoji, pkts, desc }: { title: string; emoji: string; pkts: Pkt[]; desc: string }) => (
    <div className="panel">
      <div className="bold">{emoji} {title}</div>
      <div className="small muted mb">{desc}</div>
      <div className="row" style={{ gap: 6, minHeight: 44 }}>
        {pkts.map((p, i) => (
          <motion.span
            key={`${p.n}-${i}`}
            initial={{ scale: 0, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            className="mono bold"
            style={{
              padding: '6px 10px', borderRadius: 8,
              background: p.state === 'lost' ? 'color-mix(in srgb, var(--red) 25%, transparent)' : p.state === 'resent' ? 'color-mix(in srgb, var(--yellow) 25%, transparent)' : 'color-mix(in srgb, var(--green) 22%, transparent)',
              border: `2px solid ${p.state === 'lost' ? 'var(--red)' : p.state === 'resent' ? 'var(--yellow)' : 'var(--green)'}`,
              textDecoration: p.state === 'lost' ? 'line-through' : undefined,
            }}
          >
            #{p.n} {p.state === 'lost' ? '💨' : p.state === 'resent' ? '🔁✓' : '✓'}
          </motion.span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="sim stack">
      <div className="sim-title">📦 TCP vs UDP — {tx('envía 6 paquetes por una red con fallos', 'send 6 packets over a lossy network')}</div>
      <button className="btn btn-primary" onClick={run} disabled={busy} style={{ alignSelf: 'flex-start' }}>▶ {tx('Enviar 6 paquetes', 'Send 6 packets')}</button>
      <Row title="TCP" emoji="📮" pkts={tcp} desc={tx('Como un envío certificado: confirma cada paquete, reenvía los perdidos y los entrega EN ORDEN.', 'Like certified mail: confirms each packet, resends lost ones and delivers them IN ORDER.')} />
      <Row title="UDP" emoji="📢" pkts={udp} desc={tx('Como gritar en una fiesta: rápido, sin confirmar. Si algo se pierde, se pierde. Puede llegar desordenado.', 'Like shouting at a party: fast, no confirmations. If something is lost, it is lost. May arrive out of order.')} />
      {times && (
        <div className="grid grid-2">
          <div className="feedback ok small">📮 TCP: {tx('6 de 6 llegaron en orden', '6 of 6 arrived in order')} · ~{times.tcp} ms → {tx('ideal para páginas web, APIs, pagos', 'ideal for web pages, APIs, payments')}</div>
          <div className="feedback bad small">📢 UDP: {udp.filter((p) => p.state === 'ok').length} {tx('de 6 llegaron', 'of 6 arrived')} · ~{times.udp} ms → {tx('ideal para videollamadas y juegos', 'ideal for video calls and games')}</div>
        </div>
      )}
      <Tasks labId={labId} items={[{ key: 'run', label: t('Envía paquetes y compara qué protocolo los entrega todos', 'Send packets and compare which protocol delivers them all'), done: ran > 0 }, { key: 'twice', label: t('Repite el envío: mira cómo las pérdidas cambian cada vez', 'Send again: see how the losses change every time'), done: ran > 1 }]} />
    </div>
  );
}

// =====================================================================
// WebSocket vs Polling
// =====================================================================
export function WebSocketSim({ labId }: SimProps) {
  const { tx } = useLang();
  const [pollReqs, setPollReqs] = useState(0);
  const [pollInbox, setPollInbox] = useState<string[]>([]);
  const [wsInbox, setWsInbox] = useState<string[]>([]);
  const [pending, setPending] = useState<{ text: string; at: number }[]>([]);
  const [pollPulse, setPollPulse] = useState(0);
  const [wsPulse, setWsPulse] = useState(0);
  const [sent, setSent] = useState(0);
  const pendRef = useRef(pending);
  pendRef.current = pending;

  useEffect(() => {
    const id = window.setInterval(() => {
      setPollReqs((r) => r + 1);
      setPollPulse((p) => p + 1);
      const p = pendRef.current;
      if (p.length) {
        setPollInbox((inbox) => [...p.map((m) => `${m.text} (${((Date.now() - m.at) / 1000).toFixed(1)}s)`), ...inbox].slice(0, 5));
        setPending([]);
      }
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const message = () => {
    const texts = ['⚽ Gol! 1-0', '💬 Hola!', '🔔 Nuevo pedido', '📈 BTC +2%', '🍕 Tu pizza va en camino'];
    const text = texts[sent % texts.length];
    setSent((s) => s + 1);
    setPending((p) => [...p, { text, at: Date.now() }]);
    setWsPulse((p) => p + 1);
    setWsInbox((inbox) => [`${text} (0.0s)`, ...inbox].slice(0, 5));
  };

  return (
    <div className="sim stack">
      <div className="sim-title">📞 {tx('Cartas (HTTP polling) vs Llamada abierta (WebSocket)', 'Letters (HTTP polling) vs open call (WebSocket)')}</div>
      <button className="btn btn-primary" onClick={message} style={{ alignSelf: 'flex-start' }}>📨 {tx('El servidor recibe un mensaje nuevo', 'The server gets a new message')}</button>
      <div className="grid grid-2">
        <div className="panel">
          <div className="bold">✉️ HTTP polling</div>
          <div className="small muted">{tx('El cliente pregunta cada 3 s: "¿hay algo nuevo?"', 'The client asks every 3 s: "anything new?"')}</div>
          <div className="row mt" style={{ gap: 6 }}>
            <span>💻</span>
            <motion.span key={pollPulse} initial={{ x: 0, opacity: 1 }} animate={{ x: 80, opacity: 0 }} transition={{ duration: 0.8 }}>
              ❓
            </motion.span>
            <span style={{ marginLeft: 'auto' }}>🖥️</span>
          </div>
          <div className="small mt">
            {tx('Requests hechos:', 'Requests made:')} <b>{pollReqs}</b> · {tx('útiles:', 'useful:')} <b>{Math.min(sent, pollReqs)}</b>
          </div>
          <div className="mono tiny mt">{pollInbox.map((m, i) => <div key={i}>{m}</div>)}</div>
        </div>
        <div className="panel">
          <div className="bold">📞 WebSocket</div>
          <div className="small muted">{tx('Una sola conexión abierta. El servidor avisa en cuanto pasa algo.', 'A single open connection. The server tells you the instant something happens.')}</div>
          <div className="row mt" style={{ gap: 6 }}>
            <span>💻</span>
            <div style={{ flex: 1, height: 3, background: 'var(--green)', position: 'relative', borderRadius: 2 }}>
              <motion.span key={wsPulse} initial={{ right: 0, opacity: wsPulse ? 1 : 0 }} animate={{ right: '90%', opacity: 0 }} transition={{ duration: 0.6 }} style={{ position: 'absolute', top: -12 }}>
                💌
              </motion.span>
            </div>
            <span>🖥️</span>
          </div>
          <div className="small mt">{tx('Conexiones:', 'Connections:')} <b>1</b> · {tx('mensajes:', 'messages:')} <b>{sent}</b></div>
          <div className="mono tiny mt">{wsInbox.map((m, i) => <div key={i}>{m}</div>)}</div>
        </div>
      </div>
      <Tasks labId={labId} items={[{ key: 'msgs', label: t('Envía 3 mensajes y compara el retraso de cada lado', 'Send 3 messages and compare the delay on each side'), done: sent >= 3 }]} />
    </div>
  );
}

// =====================================================================
// Balanceador de carga
// =====================================================================
type Strategy = 'rr' | 'least' | 'hash';
type Job = { id: number; user: number; server: number; left: number };
const USER_COLORS = ['#ff6b81', '#4cc9f0', '#ffd166', '#00d29a'];

export function LoadBalancerSim({ labId }: SimProps) {
  const { tx } = useLang();
  const [strategy, setStrategy] = useState<Strategy>('rr');
  const [alive, setAlive] = useState([true, true, true]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [served, setServed] = useState([0, 0, 0]);
  const [auto, setAuto] = useState(false);
  const [used, setUsed] = useState<Record<Strategy, boolean>>({ rr: false, least: false, hash: false });
  const [rerouted, setRerouted] = useState(false);
  const rr = useRef(0);
  const nextId = useRef(1);
  const state = useRef({ jobs, alive, strategy });
  state.current = { jobs, alive, strategy };
  const autoRef = useRef(auto);
  autoRef.current = auto;

  const send = () => {
    const { jobs: js, alive: al, strategy: st } = state.current;
    const up = [0, 1, 2].filter((i) => al[i]);
    if (!up.length) return;
    const user = Math.floor(Math.random() * 4);
    let server: number;
    if (st === 'rr') {
      do server = rr.current++ % 3;
      while (!al[server]);
    } else if (st === 'least') {
      server = up.reduce((best, i) => (js.filter((j) => j.server === i).length < js.filter((j) => j.server === best).length ? i : best), up[0]);
    } else {
      server = user % 3;
      if (!al[server]) server = up[user % up.length];
    }
    if (al.some((a) => !a)) setRerouted(true);
    setUsed((u) => ({ ...u, [st]: true }));
    // Algunos requests son más pesados que otros
    const left = 2 + Math.floor(Math.random() * 7);
    setJobs((j) => [...j, { id: nextId.current++, user, server, left }]);
    setServed((s) => s.map((v, i) => (i === server ? v + 1 : v)));
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      setJobs((js) => js.map((j) => ({ ...j, left: j.left - 1 })).filter((j) => j.left > 0));
      if (autoRef.current) send();
    }, 600);
    return () => clearInterval(id);
  }, []);

  const strategies: { id: Strategy; label: string; desc: string }[] = [
    { id: 'rr', label: tx('Por turnos (round-robin)', 'Round-robin'), desc: tx('1, 2, 3, 1, 2, 3… como repartir cartas.', '1, 2, 3, 1, 2, 3… like dealing cards.') },
    { id: 'least', label: tx('Menos conexiones', 'Least connections'), desc: tx('Va al servidor menos ocupado ahora mismo.', 'Goes to the least busy server right now.') },
    { id: 'hash', label: 'IP hash', desc: tx('El mismo usuario (color) siempre va al mismo servidor.', 'The same user (color) always goes to the same server.') },
  ];

  return (
    <div className="sim stack">
      <div className="sim-title">⚖️ {tx('Balanceador de carga: varias cajas en el supermercado', 'Load balancer: several checkout lines')}</div>
      <div className="row">
        {strategies.map((s) => (
          <button key={s.id} className={`btn btn-sm ${strategy === s.id ? 'active' : ''}`} onClick={() => setStrategy(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="small muted">{strategies.find((s) => s.id === strategy)!.desc}</div>
      <div className="row">
        <button className="btn btn-primary btn-sm" onClick={send}>➕ {tx('1 request', '1 request')}</button>
        <button className="btn btn-sm" onClick={() => { for (let i = 0; i < 6; i++) setTimeout(send, i * 90); }}>➕ 6</button>
        <label className="small row" style={{ gap: 6 }}>
          <input type="checkbox" checked={auto} onChange={() => setAuto((a) => !a)} /> {tx('Tráfico automático', 'Automatic traffic')}
        </label>
      </div>
      <div style={{ textAlign: 'center', fontSize: '1.8rem' }}>👥 → ⚖️</div>
      <div className="grid grid-3">
        {[0, 1, 2].map((i) => {
          const mine = jobs.filter((j) => j.server === i);
          const load = Math.min(100, mine.length * 12);
          return (
            <div key={i} className="panel" style={{ opacity: alive[i] ? 1 : 0.45, borderColor: load > 70 ? 'var(--red)' : undefined }}>
              <div className="row between">
                <span className="bold">🖥️ {tx('Servidor', 'Server')} {i + 1}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setAlive((a) => a.map((v, j) => (j === i ? !v : v)))}>{alive[i] ? '🟢' : '🔴'}</button>
              </div>
              <div className="progress mt" style={{ height: 10 }}>
                <div style={{ width: `${load}%`, background: load > 70 ? 'var(--red)' : undefined }} />
              </div>
              <div className="row mt" style={{ gap: 4, minHeight: 26 }}>
                <AnimatePresence>
                  {mine.map((j) => (
                    <motion.span key={j.id} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ width: 16, height: 16, borderRadius: 5, background: USER_COLORS[j.user], display: 'inline-block' }} />
                  ))}
                </AnimatePresence>
              </div>
              <div className="tiny faint">{tx('Atendidos:', 'Served:')} {served[i]}</div>
            </div>
          );
        })}
      </div>
      <div className="tiny faint">{tx('Cada color es un usuario distinto. Pulsa 🟢 para "apagar" un servidor y ver cómo el balanceador lo esquiva.', 'Each color is a different user. Press 🟢 to "turn off" a server and see how the balancer avoids it.')}</div>
      <Tasks
        labId={labId}
        items={[
          { key: 'all', label: t('Prueba las 3 estrategias', 'Try all 3 strategies'), done: used.rr && used.least && used.hash },
          { key: 'down', label: t('Apaga un servidor y envía requests: el tráfico se redirige', 'Turn off a server and send requests: traffic is rerouted'), done: rerouted },
        ]}
      />
    </div>
  );
}

// =====================================================================
// HTTP vs HTTPS: el espía del Wi-Fi
// =====================================================================
export function HttpsSniffSim({ labId }: SimProps) {
  const { tx } = useLang();
  const [secure, setSecure] = useState(false);
  const [msg, setMsg] = useState('password=miClave123');
  const [run, setRun] = useState(0);
  const [tried, setTried] = useState({ http: false, https: false });
  const scrambled = useMemo(() => {
    const chars = 'A9f$kQ2#zX8@pL0!wR7%tY5&mN3*';
    return Array.from(msg, (_, i) => chars[(i * 7 + msg.charCodeAt(i)) % chars.length]).join('') + '==';
  }, [msg]);
  const send = () => {
    setRun((r) => r + 1);
    setTried((x) => ({ ...x, [secure ? 'https' : 'http']: true }));
  };
  return (
    <div className="sim stack">
      <div className="sim-title">🕵️ {tx('El espía del Wi-Fi del café', 'The coffee-shop Wi-Fi spy')}</div>
      <div className="row">
        <input className="input mono grow" value={msg} onChange={(e) => setMsg(e.target.value)} />
        <button className={`btn btn-sm ${!secure ? 'active' : ''}`} onClick={() => setSecure(false)}>http://</button>
        <button className={`btn btn-sm ${secure ? 'active' : ''}`} onClick={() => setSecure(true)}>🔒 https://</button>
        <button className="btn btn-primary btn-sm" onClick={send}>▶ {tx('Enviar', 'Send')}</button>
      </div>
      <div className="row between" style={{ fontSize: '2rem', position: 'relative', padding: '10px 0' }}>
        <span>💻</span>
        <span>📶</span>
        <span>🖥️</span>
        {run > 0 && (
          <motion.span key={run} initial={{ left: '5%' }} animate={{ left: '85%' }} transition={{ duration: 1.6 }} style={{ position: 'absolute', fontSize: '1.4rem' }}>
            {secure ? '🔐' : '📄'}
          </motion.span>
        )}
      </div>
      <div className="panel">
        <div className="bold">🕵️ {tx('Lo que ve el espía conectado al mismo Wi-Fi:', 'What the spy on the same Wi-Fi sees:')}</div>
        <div className="mono mt" style={{ color: secure ? 'var(--green)' : 'var(--red)', wordBreak: 'break-all' }}>
          {run === 0 ? '…' : secure ? scrambled : msg}
        </div>
        <div className="small mt">{run === 0 ? '' : secure ? tx('✅ Basura sin sentido: solo el servidor tiene la llave para descifrarlo.', '✅ Meaningless garbage: only the server has the key to decrypt it.') : tx('❌ ¡Lo lee todo! Tu contraseña viajó en texto plano.', '❌ It reads everything! Your password travelled in plain text.')}</div>
      </div>
      <Tasks labId={labId} items={[{ key: 'both', label: t('Envía tu contraseña por http:// y luego por https://', 'Send your password via http:// and then via https://'), done: tried.http && tried.https }]} />
    </div>
  );
}
