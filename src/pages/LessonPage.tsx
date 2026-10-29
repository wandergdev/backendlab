import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useLang } from '../i18n/lang';
import { getModule } from '../content';
import { addXp, completeLesson, getProgress, setLessonStep } from '../store/progress';
import type { Step } from '../types';
import { Visual } from '../components/visuals/Visual';
import { CodeBlock } from '../components/visuals/CodeBlock';
import { Exercise } from '../components/exercises/Exercise';
import { Glyph } from '../components/ui/Icon';
import { Ic, IcTile } from '../components/ui/Icon';

function StepView({ step, onCheck }: { step: Step; onCheck: (ok: boolean) => void }) {
  const { tr, tx } = useLang();
  if (step.kind === 'check') {
    return (
      <div className="card">
        <div className="pill yellow" style={{ marginBottom: 12 }}><Ic n="lightning" size={16} /> {tx('Comprueba rápido', 'Quick check')}</div>
        <Exercise ex={step.exercise} onResult={onCheck} />
      </div>
    );
  }
  if (step.kind === 'recap') {
    return (
      <div className="card">
        <IcTile n="puzzle" />
        <h2>{tx('Resumen: léelo en voz alta', 'Summary: read it out loud')}</h2>
        <p className="muted small">{tx('Decirlo en voz alta activa otra parte del cerebro. Tápate la pantalla e intenta repetir cada punto.', 'Saying it out loud activates another part of the brain. Cover the screen and try to repeat each point.')}</p>
        <div className="stack">
          {step.points.map((p, i) => (
            <motion.div key={i} className="panel bold" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.35 }}>
              {tr(p)}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="stack" style={{ gap: 18 }}>
      <div>
        {step.emoji && <div className="icon-tile" style={{ width: 64, height: 64, color: 'var(--primary-2)', ['--tile' as string]: 'var(--primary)' }}><Glyph emoji={step.emoji} size={36} /></div>}
        <h1 style={{ fontSize: 'clamp(1.5rem, 3.6vw, 2.2rem)', marginTop: 8 }}>{tr(step.title)}</h1>
        <p style={{ fontSize: '1.12rem' }}>{tr(step.body)}</p>
      </div>
      {step.visual && <Visual v={step.visual} />}
      {step.analogy && (
        <div className="analogy">
          <div className="real">
            <div className="lbl ic" style={{ color: 'var(--orange)' }}><Ic n="globe" size={18} /> {tx('En el mundo real', 'In the real world')}</div>
            <div>{tr(step.analogy.real)}</div>
          </div>
          <div className="prog">
            <div className="lbl ic" style={{ color: 'var(--blue)' }}><Ic n="code" size={18} /> {tx('En programación', 'In programming')}</div>
            <div>{tr(step.analogy.code)}</div>
          </div>
        </div>
      )}
      {step.code && <CodeBlock snippet={step.code} />}
      {step.tip && <div className="tip ic" style={{ alignItems: 'flex-start' }}><Ic n="bulb" size={22} color="var(--yellow)" /> <span>{tr(step.tip)}</span></div>}
    </div>
  );
}

export function LessonPage() {
  const { id } = useParams();
  const { tr, tx } = useLang();
  const nav = useNavigate();
  const m = getModule(id);
  const [i, setI] = useState(() => (m ? Math.min(getProgress().lessons[m.id]?.step ?? 0, m.lesson.length - 1) : 0));
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (m && !finished) setLessonStep(m.id, i);
  }, [i, m, finished]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!m) return <Navigate to="/modules" replace />;
  const step = m.lesson[i];
  const isCheck = step.kind === 'check';
  const blocked = isCheck && !(i in checked);
  const last = i === m.lesson.length - 1;

  function go(d: number, force = false) {
    if (!m) return;
    if (d > 0 && blocked && !force) return;
    if (d > 0 && last) {
      completeLesson(m.id, m.cards.map((c) => c.id));
      setFinished(true);
      return;
    }
    setI((x) => Math.max(0, Math.min(m.lesson.length - 1, x + d)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (finished) {
    return (
      <div className="container narrow mt-lg">
        <motion.div className="card center stack" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ alignItems: 'center', padding: 40 }}>
          <IcTile n="celebrate" color="var(--green)" size={88} />
          <h1>{tx('¡Lección completada!', 'Lesson completed!')}</h1>
          <p className="muted" style={{ maxWidth: 520 }}>
            {tx(
              `Acabas de VER "${tr(m.title)}". Sus ${m.cards.length} tarjetas ya están en tu repaso diario. Ahora toca repetir para que se quede.`,
              `You just SAW "${tr(m.title)}". Its ${m.cards.length} cards are now in your daily review. Now it is time to repeat so it sticks.`,
            )}
          </p>
          <div className="row center">
            <Link className="btn btn-primary btn-lg" to={`/m/${m.id}/practice`}><Ic n="repeat" /> {tx('Practicar ahora', 'Practice now')}</Link>
            <Link className="btn btn-lg" to={`/m/${m.id}/labs`}><Ic n="flask" /> {tx('Laboratorios', 'Labs')}</Link>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { setFinished(false); setI(0); setChecked({}); }}><Ic n="reset" size={18} /> {tx('Ver la lección otra vez', 'Watch the lesson again')}</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="lesson-shell">
      <div className="container narrow">
        <div className="lesson-top">
          <button className="btn btn-ghost icon-btn" onClick={() => nav(`/m/${m.id}`)} aria-label={tx('Salir de la lección', 'Exit lesson')}><Ic n="x" size={22} /></button>
          <div className="progress grow">
            <div style={{ width: `${((i + 1) / m.lesson.length) * 100}%` }} />
          </div>
          <span className="small mono bold">{i + 1}/{m.lesson.length}</span>
        </div>
        <div className="lesson-body">
          <AnimatePresence mode="wait">
            <motion.div key={i} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>
              <StepView
                step={step}
                onCheck={(ok) => {
                  setChecked((c) => ({ ...c, [i]: ok }));
                  if (ok) addXp(5);
                  go(1, true);
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="lesson-footer">
        <div className="container narrow row between">
          <button className="btn" onClick={() => go(-1)} disabled={i === 0}><Ic n="left" size={18} /> {tx('Atrás', 'Back')}</button>
          <span className="tiny faint hide-mobile">{tx('Usa las flechas ← → del teclado', 'Use the ← → arrow keys')}</span>
          <button className="btn btn-primary btn-lg" onClick={() => go(1)} disabled={blocked}>
            {blocked ? tx('Responde para seguir', 'Answer to continue') : last ? <><Ic n="celebrate" /> {tx('Terminar', 'Finish')}</> : <>{tx('Siguiente', 'Next')} <Ic n="right" size={18} weight="bold" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
