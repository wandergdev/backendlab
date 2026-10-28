import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLang } from '../i18n/lang';
import { MODULES } from '../content';
import { applyImport, level, markBackup, portable, resetProgress, useProgress, type PortableProgress } from '../store/progress';
import { decodeProgress, encodeProgress, summarize, syncLink } from '../lib/sync';
import { moduleStatus } from '../lib/status';

function Summary({ p, title, color }: { p: PortableProgress; title: string; color: string }) {
  const { tx } = useLang();
  const s = summarize(p);
  return (
    <div className="panel" style={{ borderColor: color, borderWidth: 2 }}>
      <div className="bold mb">{title}</div>
      <div className="small">⭐ {s.xp} XP · 🔥 {s.streak} {tx('días', 'days')}</div>
      <div className="small">👀 {s.lessons} {tx('lecciones', 'lessons')} · 🧠 {s.cards} {tx('tarjetas', 'cards')} · 🎯 {s.tasks} {tx('objetivos', 'goals')}</div>
    </div>
  );
}

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleString() : null);

export function Progress() {
  const { tx } = useLang();
  const s = useProgress((x) => x);
  const [link, setLink] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [qrTooBig, setQrTooBig] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paste, setPaste] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();
  const lv = level(s.xp);
  const doneLessons = MODULES.filter((m) => moduleStatus(m, s).lesson).length;

  const makeLink = async () => {
    const code = await encodeProgress();
    const url = syncLink(code);
    setLink(url);
    markBackup();
    try {
      const qrcode = (await import('qrcode-generator')).default;
      const q = qrcode(0, 'L');
      q.addData(url);
      q.make();
      setQr(q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }));
      setQrTooBig(false);
    } catch {
      setQr(null);
      setQrTooBig(true);
    }
  };

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(portable(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `backendlab-progreso-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    markBackup();
  };

  const openFile = async (f: File) => {
    setError(null);
    try {
      const data = JSON.parse(await f.text()) as PortableProgress;
      if (data.version !== 1 || typeof data.xp !== 'number') throw new Error('format');
      const code = await encodeProgress(data);
      nav(`/sync?d=${code}`);
    } catch {
      setError(tx('Ese archivo no es un respaldo de BackendLab.', 'That file is not a BackendLab backup.'));
    }
  };

  const openPasted = async () => {
    setError(null);
    try {
      await decodeProgress(paste);
      const code = paste.trim().replace(/^.*[?&]d=/, '').replace(/&.*$/, '');
      nav(`/sync?d=${code}`);
    } catch {
      setError(tx('No reconozco ese enlace o código.', 'I do not recognize that link or code.'));
    }
  };

  return (
    <div className="container narrow mt-lg">
      <h1>💾 {tx('Mi progreso', 'My progress')}</h1>
      <p className="muted">{tx('Tu progreso vive en ESTE navegador (no hay cuentas ni servidor). Aquí puedes llevarlo a otro navegador o dispositivo, o guardar una copia.', 'Your progress lives in THIS browser (no accounts or server). Here you can take it to another browser or device, or save a copy.')}</p>

      <div className="grid grid-3">
        <div className="card tight center"><div style={{ fontSize: '1.6rem' }}>⭐</div><div className="bold">{tx('Nivel', 'Level')} {lv.lvl}</div><div className="tiny muted">{s.xp} XP</div></div>
        <div className="card tight center"><div style={{ fontSize: '1.6rem' }}>👀</div><div className="bold">{doneLessons}/{MODULES.length}</div><div className="tiny muted">{tx('lecciones', 'lessons')}</div></div>
        <div className="card tight center"><div style={{ fontSize: '1.6rem' }}>🧠</div><div className="bold">{Object.keys(s.cards).length}</div><div className="tiny muted">{tx('tarjetas en tu mazo', 'cards in your deck')}</div></div>
      </div>
      <div className="small faint mt">🕓 {tx('Última copia o enlace:', 'Last copy or link:')} {fmtDate(s.settings.lastBackup) ?? tx('nunca', 'never')}</div>

      <div className="card mt-lg stack">
        <h2 style={{ margin: 0 }}>📤 {tx('Llevar mi progreso a otro navegador', 'Take my progress to another browser')}</h2>
        <ol className="small" style={{ margin: 0, paddingLeft: 20 }}>
          <li>{tx('Pulsa "Crear enlace".', 'Press "Create link".')}</li>
          <li>{tx('Ábrelo en el otro navegador (cópialo, envíatelo por WhatsApp/email, o escanea el QR con el móvil).', 'Open it in the other browser (copy it, send it to yourself by WhatsApp/email, or scan the QR with your phone).')}</li>
          <li>{tx('Allí eliges "Combinar": se queda lo mejor de los dos navegadores.', 'There choose "Merge": it keeps the best of both browsers.')}</li>
        </ol>
        <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={makeLink}>🔗 {link ? tx('Crear enlace actualizado', 'Create updated link') : tx('Crear enlace', 'Create link')}</button>
        {link && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-2" style={{ alignItems: 'start' }}>
            <div className="stack">
              <textarea className="textarea" readOnly value={link} style={{ minHeight: 90, fontSize: '0.75rem' }} onFocus={(e) => e.target.select()} />
              <div className="row">
                <button className="btn btn-sm" onClick={copy}>{copied ? `✅ ${tx('¡Copiado!', 'Copied!')}` : `📋 ${tx('Copiar enlace', 'Copy link')}`}</button>
                {typeof navigator.share === 'function' && (
                  <button className="btn btn-sm" onClick={() => navigator.share({ title: 'BackendLab', url: link }).catch(() => {})}>📲 {tx('Compartir', 'Share')}</button>
                )}
              </div>
              <div className="tiny faint">{tx('El enlace es una FOTO de tu progreso de ahora. Si sigues estudiando aquí, crea uno nuevo después.', 'The link is a SNAPSHOT of your progress right now. If you keep studying here, create a new one later.')}</div>
            </div>
            <div className="center">
              {qr ? (
                <div style={{ background: '#fff', padding: 10, borderRadius: 14, width: 220, margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: qr }} />
              ) : qrTooBig ? (
                <div className="small muted">{tx('Tu progreso ya es demasiado grande para un QR: usa el enlace o el archivo.', 'Your progress is too large for a QR now: use the link or the file.')}</div>
              ) : null}
              {qr && <div className="tiny muted mt">📱 {tx('Escanéalo con la cámara del móvil', 'Scan it with your phone camera')}</div>}
            </div>
          </motion.div>
        )}
      </div>

      <div className="card mt stack">
        <h2 style={{ margin: 0 }}>📥 {tx('Traer progreso aquí', 'Bring progress here')}</h2>
        <div className="small muted">{tx('¿Tienes un enlace o código de otro navegador? Pégalo aquí.', 'Have a link or code from another browser? Paste it here.')}</div>
        <div className="row" style={{ flexWrap: 'nowrap' }}>
          <input className="input mono grow" placeholder="https://…/#/sync?d=bl1.…" value={paste} onChange={(e) => setPaste(e.target.value)} />
          <button className="btn btn-primary" disabled={!paste.trim()} onClick={openPasted}>{tx('Revisar', 'Review')}</button>
        </div>
        {error && <div className="feedback bad small">{error}</div>}
      </div>

      <div className="card mt stack">
        <h2 style={{ margin: 0 }}>🗂️ {tx('Copia de seguridad en archivo', 'Backup file')}</h2>
        <div className="small muted">{tx('Útil para guardarla en tu nube (Drive, OneDrive) o si borras los datos del navegador.', 'Useful to keep it in your cloud (Drive, OneDrive) or if you clear browser data.')}</div>
        <div className="row">
          <button className="btn" onClick={download}>⬇️ {tx('Descargar copia (.json)', 'Download backup (.json)')}</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>⬆️ {tx('Cargar copia', 'Load backup')}</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && openFile(e.target.files[0])} />
        </div>
      </div>

      <div className="tip mt small">
        💡 {tx(
          '¿Quieres que se sincronice solo, con usuario y contraseña? Eso necesita un backend con cuentas y base de datos… ¡que es justo lo que estás aprendiendo! Es un gran proyecto para la Fase 3 de la ruta.',
          'Want automatic sync with a username and password? That needs a backend with accounts and a database… which is exactly what you are learning! A great project for Phase 3 of the roadmap.',
        )}
      </div>

      <div className="center mt-lg">
        <button className="btn btn-ghost btn-sm" onClick={() => window.confirm(tx('¿Borrar todo tu progreso en este navegador? No se puede deshacer.', 'Delete all your progress in this browser? This cannot be undone.')) && resetProgress()}>
          🗑️ {tx('Reiniciar mi progreso en este navegador', 'Reset my progress in this browser')}
        </button>
      </div>
    </div>
  );
}

export function SyncImport() {
  const { tx } = useLang();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const current = useProgress((x) => x);
  const [incoming, setIncoming] = useState<PortableProgress | null>(null);
  const [error, setError] = useState(false);
  const [done, setDone] = useState<null | 'merge' | 'replace'>(null);

  useEffect(() => {
    const d = params.get('d');
    if (!d) return setError(true);
    decodeProgress(d).then(setIncoming).catch(() => setError(true));
  }, [params]);

  const apply = (mode: 'merge' | 'replace') => {
    if (!incoming) return;
    applyImport(incoming, mode);
    setDone(mode);
    nav('/sync', { replace: true });
  };

  if (done)
    return (
      <div className="container narrow mt-lg">
        <motion.div className="card center stack" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ alignItems: 'center', padding: 36 }}>
          <div style={{ fontSize: '3.5rem' }}>✅</div>
          <h1>{done === 'merge' ? tx('¡Progreso combinado!', 'Progress merged!') : tx('¡Progreso reemplazado!', 'Progress replaced!')}</h1>
          <p className="muted">{tx('Ya puedes seguir estudiando en este navegador.', 'You can keep studying in this browser now.')}</p>
          <Link className="btn btn-primary btn-lg" to="/">{tx('Ir al inicio', 'Go home')} ▶</Link>
        </motion.div>
      </div>
    );

  if (error)
    return (
      <div className="container narrow mt-lg card center">
        <div style={{ fontSize: '3rem' }}>🤔</div>
        <h2>{tx('Este enlace de sincronización no es válido', 'This sync link is not valid')}</h2>
        <p className="muted">{tx('Puede que se haya cortado al copiarlo. Crea uno nuevo desde "Mi progreso" en el otro navegador.', 'It may have been cut off when copying. Create a new one from "My progress" in the other browser.')}</p>
        <Link className="btn" to="/progress">💾 {tx('Mi progreso', 'My progress')}</Link>
      </div>
    );

  if (!incoming) return <div className="container mt-lg pulse">{tx('Leyendo enlace…', 'Reading link…')}</div>;

  return (
    <div className="container narrow mt-lg">
      <h1>📥 {tx('Importar progreso', 'Import progress')}</h1>
      <p className="muted">{tx('Este enlace trae progreso de otro navegador. ¿Qué quieres hacer?', 'This link brings progress from another browser. What do you want to do?')}</p>
      <div className="grid grid-2">
        <Summary p={incoming} title={tx('📦 Lo que trae el enlace', '📦 What the link brings')} color="var(--blue)" />
        <Summary p={portable(current)} title={tx('💻 Lo que ya hay aquí', '💻 What is already here')} color="var(--border)" />
      </div>
      <div className="grid grid-2 mt">
        <button className="btn btn-green btn-lg" onClick={() => apply('merge')}>🔀 {tx('Combinar (recomendado)', 'Merge (recommended)')}</button>
        <button className="btn btn-lg" onClick={() => apply('replace')}>♻️ {tx('Reemplazar lo de aquí', 'Replace what is here')}</button>
      </div>
      <div className="small muted mt">
        {tx('Combinar se queda con lo mejor de los dos: lecciones y objetivos completados en cualquiera, la mejor nota de práctica y el repaso más reciente de cada tarjeta.', 'Merge keeps the best of both: lessons and goals completed in either, the best practice score and the most recent review of each card.')}
      </div>
      <div className="center mt">
        <Link className="btn btn-ghost btn-sm" to="/">{tx('Cancelar', 'Cancel')}</Link>
      </div>
    </div>
  );
}
