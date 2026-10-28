import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { t } from '../../types';
import { useLang } from '../../i18n/lang';
import { Tasks, type SimProps } from './SimHost';

// =====================================================================
// Monolito vs Microservicios
// =====================================================================
const SERVICES = [
  { id: 'users', emoji: '👤' },
  { id: 'orders', emoji: '🧾' },
  { id: 'payments', emoji: '💳' },
  { id: 'email', emoji: '📧' },
];

export function MonoMicro({ labId }: SimProps) {
  const { tx } = useLang();
  const [mode, setMode] = useState<'mono' | 'micro'>('mono');
  const [down, setDown] = useState<string | null>(null);
  const [deploying, setDeploying] = useState<string[]>([]);
  const [tried, setTried] = useState<Record<string, boolean>>({});
  const names: Record<string, string> = { users: tx('Usuarios', 'Users'), orders: tx('Pedidos', 'Orders'), payments: tx('Pagos', 'Payments'), email: 'Email' };

  const crash = () => {
    setDown('payments');
    setTried((x) => ({ ...x, [`crash-${mode}`]: true }));
    setTimeout(() => setDown(null), 3000);
  };
  const deploy = () => {
    setDeploying(mode === 'mono' ? SERVICES.map((s) => s.id) : ['payments']);
    setTried((x) => ({ ...x, [`deploy-${mode}`]: true }));
    setTimeout(() => setDeploying([]), 2200);
  };
  const isDown = (id: string) => down !== null && (mode === 'mono' || down === id);

  return (
    <div className="sim stack">
      <div className="sim-title">🏠 vs 🏘️ {tx('Una casa grande o un barrio de casitas', 'One big house or a neighborhood of small houses')}</div>
      <div className="row">
        <button className={`btn btn-sm ${mode === 'mono' ? 'active' : ''}`} onClick={() => setMode('mono')}>🏠 {tx('Monolito', 'Monolith')}</button>
        <button className={`btn btn-sm ${mode === 'micro' ? 'active' : ''}`} onClick={() => setMode('micro')}>🏘️ {tx('Microservicios', 'Microservices')}</button>
        <span className="grow" />
        <button className="btn btn-sm" onClick={deploy}>🚀 {tx('Desplegar un cambio en Pagos', 'Deploy a change to Payments')}</button>
        <button className="btn btn-red btn-sm" onClick={crash}>💥 {tx('Pagos tiene un bug y se cae', 'Payments has a bug and crashes')}</button>
      </div>
      <motion.div layout className="panel" style={{ border: mode === 'mono' ? '3px solid var(--primary)' : '1px dashed var(--border)', padding: 14 }}>
        {mode === 'mono' && <div className="tiny bold muted mb">📦 {tx('UNA sola aplicación · UN despliegue · UNA base de datos', 'ONE application · ONE deployment · ONE database')}</div>}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: mode === 'mono' ? 6 : 16 }}>
          {SERVICES.map((s) => (
            <motion.div layout key={s.id} className="center" style={{ padding: 12, borderRadius: 14, background: 'var(--surface)', border: `2px solid ${isDown(s.id) ? 'var(--red)' : deploying.includes(s.id) ? 'var(--yellow)' : 'var(--border)'}`, opacity: isDown(s.id) ? 0.5 : 1 }}>
              <div style={{ fontSize: '1.7rem' }}>{isDown(s.id) ? '💀' : deploying.includes(s.id) ? '⏳' : s.emoji}</div>
              <div className="bold small">{names[s.id]}</div>
              {mode === 'micro' && <div className="tiny faint">🗄️ {tx('su propia BD', 'its own DB')}</div>}
            </motion.div>
          ))}
        </div>
      </motion.div>
      <div className="small">
        {down && (mode === 'mono' ? tx('💀 Un bug en Pagos tumbó TODA la aplicación: nadie puede ni iniciar sesión.', '💀 A bug in Payments took down the WHOLE app: nobody can even log in.') : tx('✅ Solo Pagos está caído. Los usuarios pueden navegar y ver pedidos.', '✅ Only Payments is down. Users can still browse and see orders.'))}
        {deploying.length > 0 && (mode === 'mono' ? tx('⏳ Para cambiar Pagos hay que redesplegar TODO.', '⏳ To change Payments you must redeploy EVERYTHING.') : tx('⏳ Solo se redespliega Pagos.', '⏳ Only Payments is redeployed.'))}
      </div>
      <div className="grid grid-2 small">
        <div className="panel">🏠 <b>{tx('Monolito', 'Monolith')}</b>: {tx('fácil de crear, depurar y desplegar. Ideal para empezar y para equipos pequeños.', 'easy to build, debug and deploy. Ideal to start and for small teams.')}</div>
        <div className="panel">🏘️ <b>{tx('Microservicios', 'Microservices')}</b>: {tx('independencia y escalado por partes, pero llamadas por red, más cosas que monitorear y más complejidad.', 'independence and per-part scaling, but network calls, more things to monitor and much more complexity.')}</div>
      </div>
      <Tasks
        labId={labId}
        items={[
          { key: 'crash', label: t('Provoca la caída de Pagos en ambos modelos', 'Crash Payments in both models'), done: !!tried['crash-mono'] && !!tried['crash-micro'] },
          { key: 'deploy', label: t('Despliega un cambio en ambos modelos', 'Deploy a change in both models'), done: !!tried['deploy-mono'] && !!tried['deploy-micro'] },
        ]}
      />
    </div>
  );
}

// =====================================================================
// Arquitectura orientada a eventos (cola de mensajes)
// =====================================================================
type Ev = { id: number; name: string };
const SUBS = [
  { id: 'email', emoji: '📧' },
  { id: 'inventory', emoji: '📦' },
  { id: 'analytics', emoji: '📊' },
];

export function PubSubSim({ labId }: SimProps) {
  const { tx } = useLang();
  const [mode, setMode] = useState<'events' | 'direct'>('events');
  const [emailDown, setEmailDown] = useState(false);
  const [queue, setQueue] = useState<Ev[]>([]);
  const [handled, setHandled] = useState<Record<string, number>>({ email: 0, inventory: 0, analytics: 0 });
  const [flash, setFlash] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [n, setN] = useState(1);
  const [done, setDone] = useState({ placed: false, buffered: false, delivered: false, directFail: false });
  const names: Record<string, string> = { email: tx('Servicio de Email', 'Email Service'), inventory: tx('Servicio de Inventario', 'Inventory Service'), analytics: tx('Analíticas', 'Analytics') };

  const pulse = (ids: string[]) => {
    setFlash(ids);
    setTimeout(() => setFlash([]), 700);
  };

  const order = () => {
    const ev = { id: n, name: `OrderPlaced #${n}` };
    setN((x) => x + 1);
    if (mode === 'direct') {
      if (emailDown) {
        setMsg({ ok: false, text: tx('❌ El servicio de pedidos llamó directamente a Email, Email no respondió… y el pedido FALLÓ. El cliente ve un error 500.', '❌ The order service called Email directly, Email did not answer… and the order FAILED. The customer sees a 500 error.') });
        setDone((d) => ({ ...d, directFail: true }));
        return;
      }
      setHandled((h) => ({ email: h.email + 1, inventory: h.inventory + 1, analytics: h.analytics + 1 }));
      pulse(['email', 'inventory', 'analytics']);
      setMsg({ ok: true, text: tx('✅ Pedido creado. Pero Pedidos tuvo que conocer y esperar a los 3 servicios.', '✅ Order created. But Orders had to know and wait for all 3 services.') });
      return;
    }
    const live = SUBS.filter((s) => !(s.id === 'email' && emailDown)).map((s) => s.id);
    setHandled((h) => ({ ...h, ...Object.fromEntries(live.map((id) => [id, h[id] + 1])) }));
    pulse(live);
    if (emailDown) {
      setQueue((q) => [...q, ev]);
      setDone((d) => ({ ...d, buffered: true, placed: true }));
      setMsg({ ok: true, text: tx('✅ Pedido creado al instante. El evento para Email espera en la cola hasta que vuelva.', '✅ Order created instantly. The event for Email waits in the queue until it comes back.') });
    } else {
      setDone((d) => ({ ...d, placed: true }));
      setMsg({ ok: true, text: tx('✅ Pedido creado. Pedidos solo publicó "OrderPlaced"; no sabe quién escucha.', '✅ Order created. Orders only published "OrderPlaced"; it does not know who listens.') });
    }
  };

  const toggleEmail = () => {
    if (emailDown && queue.length) {
      setHandled((h) => ({ ...h, email: h.email + queue.length }));
      pulse(['email']);
      setMsg({ ok: true, text: tx(`📬 Email volvió y procesó ${queue.length} evento(s) pendientes. ¡Nada se perdió!`, `📬 Email is back and processed ${queue.length} pending event(s). Nothing was lost!`) });
      setQueue([]);
      setDone((d) => ({ ...d, delivered: true }));
    }
    setEmailDown((v) => !v);
  };

  return (
    <div className="sim stack">
      <div className="sim-title">📣 {tx('Eventos: "¡Hice un pedido!" y quien quiera escucha', 'Events: "An order was placed!" and whoever cares listens')}</div>
      <div className="row">
        <button className={`btn btn-sm ${mode === 'events' ? 'active' : ''}`} onClick={() => setMode('events')}>📣 {tx('Con cola de eventos', 'With an event queue')}</button>
        <button className={`btn btn-sm ${mode === 'direct' ? 'active' : ''}`} onClick={() => setMode('direct')}>☎️ {tx('Llamadas directas', 'Direct calls')}</button>
        <span className="grow" />
        <label className="small row" style={{ gap: 6 }}><input type="checkbox" checked={emailDown} onChange={toggleEmail} /> 💀 {tx('Email caído', 'Email down')}</label>
      </div>
      <div className="row" style={{ alignItems: 'stretch', flexWrap: 'nowrap', gap: 10 }}>
        <div className="panel center" style={{ flex: '0 0 130px' }}>
          <div style={{ fontSize: '1.7rem' }}>🧾</div>
          <div className="bold small">{tx('Servicio de Pedidos', 'Order Service')}</div>
          <button className="btn btn-primary btn-sm mt" onClick={order}>🛒 {tx('Pedido', 'Order')}</button>
        </div>
        {mode === 'events' && (
          <div className="panel center" style={{ flex: '0 0 140px' }}>
            <div style={{ fontSize: '1.7rem' }}>📬</div>
            <div className="bold small">{tx('Cola (RabbitMQ/Kafka)', 'Queue (RabbitMQ/Kafka)')}</div>
            <div className="stack mt" style={{ gap: 4 }}>
              <AnimatePresence>
                {queue.map((e) => (
                  <motion.div key={e.id} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ x: 60, opacity: 0 }} className="pill yellow tiny">{e.name}</motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
        <div className="stack grow" style={{ gap: 6 }}>
          {SUBS.map((s) => {
            const off = s.id === 'email' && emailDown;
            return (
              <motion.div key={s.id} animate={{ scale: flash.includes(s.id) ? 1.04 : 1, borderColor: off ? 'var(--red)' : flash.includes(s.id) ? 'var(--green)' : 'var(--border)' }} className="row" style={{ padding: '8px 12px', borderRadius: 12, border: '2px solid var(--border)', background: 'var(--surface)', opacity: off ? 0.5 : 1 }}>
                <span style={{ fontSize: '1.3rem' }}>{off ? '💀' : s.emoji}</span>
                <span className="bold small grow">{names[s.id]}</span>
                <span className="pill">{handled[s.id]}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
      {msg && <div className={`feedback small ${msg.ok ? 'ok' : 'bad'}`}>{msg.text}</div>}
      <Tasks
        labId={labId}
        items={[
          { key: 'placed', label: t('Haz un pedido en modo eventos', 'Place an order in event mode'), done: done.placed },
          { key: 'buffered', label: t('Apaga Email y haz pedidos: los eventos esperan en la cola', 'Turn off Email and place orders: events wait in the queue'), done: done.buffered },
          { key: 'delivered', label: t('Enciende Email otra vez y mira cómo procesa lo pendiente', 'Turn Email back on and watch it process the backlog'), done: done.delivered },
          { key: 'direct', label: t('En llamadas directas con Email caído, el pedido falla', 'With direct calls and Email down, the order fails'), done: done.directFail },
        ]}
      />
    </div>
  );
}
