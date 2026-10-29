import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n/lang';
import { MODULES } from '../content';
import { dueCardIds, level, useProgress } from '../store/progress';
import { moduleStatus } from '../lib/status';
import { Blocks } from '../components/visuals/Blocks';
import { Ic, ModuleIcon, type IcName } from '../components/ui/Icon';
import type { BlockPiece, Txt } from '../types';
import { t } from '../types';

// La "cartilla": la misma idea de leer (L + A = LA) aplicada a backend. Es el único movimiento automático de la portada.
const PRIMER: { pieces: BlockPiece[]; result: Txt; resultEmoji?: string; caption: Txt }[] = [
  { pieces: [{ label: 'L', color: '#f0b34a' }, { label: 'A', color: '#7fb2ff' }], result: 'LA', caption: t('Así aprendiste a leer: dos letras, una sílaba.', 'This is how you learned to read: two letters, one syllable.') },
  { pieces: [{ label: 'GET', emoji: '📥', color: '#6bcb8b' }, { label: '/users/42', emoji: '🔗', color: '#7fb2ff' }], result: t('Dame el usuario 42', 'Give me user 42'), resultEmoji: '👤', caption: t('Así se lee un request: un verbo y una dirección.', 'This is how you read a request: a verb and an address.') },
  { pieces: [{ label: 'Request', emoji: '📨', color: '#7fb2ff' }, { label: t('Servidor', 'Server'), emoji: '🖥️', color: '#f0b34a' }, { label: 'Response', emoji: '📬', color: '#6bcb8b' }], result: t('Toda la web', 'The whole web'), resultEmoji: '🌐', caption: t('Y con tres piezas ya entiendes cómo funciona la web.', 'And with three pieces you understand how the web works.') },
];

function Primer() {
  const { tr, tx } = useLang();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (paused) return;
    const id = window.setTimeout(() => setI((x) => (x + 1) % PRIMER.length), 5200);
    return () => clearTimeout(id);
  }, [i, paused]);
  const p = PRIMER[i];
  return (
    <figure className="primer" style={{ margin: 0 }} onMouseEnter={() => setPaused(true)} onFocus={() => setPaused(true)}>
      <Blocks key={i} pieces={p.pieces} result={p.result} resultEmoji={p.resultEmoji} replay={false} />
      <figcaption className="primer-caption" aria-live="polite">{tr(p.caption)}</figcaption>
      <div className="primer-dots">
        {PRIMER.map((_, k) => (
          <button key={k} aria-label={tx(`Ejemplo ${k + 1}`, `Example ${k + 1}`)} aria-current={k === i} onClick={() => { setI(k); setPaused(true); }}>
            <span />
          </button>
        ))}
      </div>
    </figure>
  );
}

export function Home() {
  const { tr, tx } = useLang();
  const s = useProgress((x) => x);
  const due = dueCardIds(s).length;
  const lv = level(s.xp);
  const next = MODULES.find((m) => !moduleStatus(m, s).lesson) ?? MODULES[0];
  const nextStatus = moduleStatus(next, s);
  const totalStars = MODULES.reduce((a, m) => a + moduleStatus(m, s).stars, 0);
  const startedAny = s.xp > 0;

  const method: { icon: IcName; title: string; desc: string }[] = [
    { icon: 'eye', title: tx('Ver', 'See'), desc: tx('Cada idea en una pantalla, animada, con un ejemplo de la vida real y otro de código.', 'One idea per screen, animated, with a real-life example and a code example.') },
    { icon: 'repeat', title: tx('Repetir', 'Repeat'), desc: tx('Lo que fallas vuelve a salir hasta que lo aciertas.', 'Whatever you miss comes back until you get it right.') },
    { icon: 'flask', title: tx('Hacer', 'Do'), desc: tx('Terminal, Git, SQL real y una API de práctica, sin instalar nada.', 'Terminal, Git, real SQL and a practice API, with nothing to install.') },
    { icon: 'brain', title: tx('Recordar', 'Remember'), desc: tx('Tarjetas que vuelven justo cuando las estás olvidando.', 'Cards that come back just as you start forgetting them.') },
  ];

  return (
    <>
      <section className="home-hero">
        <div className="container">
          <div className="grid grid-2" style={{ alignItems: 'center', gap: 40 }}>
            <div>
              <h1>{tx('Aprende backend como aprendiste a leer.', 'Learn backend the way you learned to read.')}</h1>
              <p className="lead">
                {tx(
                  'Primero las letras, luego las palabras. Cada concepto se arma con piezas que ya viste, y lo repites hasta que se queda.',
                  'Letters first, then words. Every concept is built from pieces you have already seen, and you repeat it until it sticks.',
                )}
              </p>
              <div className="row mt">
                <Link className="btn btn-primary btn-lg" to={nextStatus.started ? `/m/${next.id}/lesson` : `/m/${next.id}`}>
                  {nextStatus.started ? tx('Continuar la lección', 'Continue the lesson') : startedAny ? tx(`Empezar: ${tr(next.title)}`, `Start: ${tr(next.title)}`) : tx('Empezar la lección 1', 'Start lesson 1')}
                </Link>
                {due > 0 ? (
                  <Link className="btn btn-lg" to="/review">
                    <Ic n="cards" /> {tx(`Repasar ${due} tarjetas`, `Review ${due} cards`)}
                  </Link>
                ) : (
                  <Link className="btn btn-ghost btn-lg" to="/modules">{tx('Ver el temario', 'See the syllabus')}</Link>
                )}
              </div>
            </div>
            <Primer />
          </div>
        </div>
      </section>

      <section className="container mt-lg">
        <div className="facts" role="list">
          <div role="listitem"><Ic n="fire" size={24} color="var(--orange)" /><span><strong>{s.streak.count}</strong><small>{tx(s.streak.count === 1 ? 'día seguido' : 'días seguidos', s.streak.count === 1 ? 'day in a row' : 'days in a row')}</small></span></div>
          <div role="listitem"><Ic n="star" size={24} color="var(--primary-2)" /><span><strong>{tx('Nivel', 'Level')} {lv.lvl}</strong><small>{tx(`${lv.need - lv.into} XP para el siguiente`, `${lv.need - lv.into} XP to the next one`)}</small></span></div>
          <div role="listitem"><Ic n="trophy" size={24} color="var(--green)" /><span><strong>{totalStars} / {MODULES.length * 3}</strong><small>{tx('estrellas de dominio', 'mastery stars')}</small></span></div>
          <div role="listitem"><Ic n="cards" size={24} color="var(--blue)" /><span><strong>{due}</strong><small>{tx('tarjetas para hoy', 'cards for today')}</small></span></div>
        </div>
      </section>

      <section className="container mt-lg">
        <h2>{tx('Continúa donde lo dejaste', 'Pick up where you left off')}</h2>
        <Link to={`/m/${next.id}`} className="next-up">
          <ModuleIcon id={next.id} color={next.color} size={52} />
          <span className="grow" style={{ minWidth: 0 }}>
            <span className="module-num">{tx('Módulo', 'Module')} {next.num}</span>
            <span className="bold" style={{ display: 'block', fontSize: '1.1rem' }}>{tr(next.title)}</span>
            <span className="small muted">{tr(next.tagline)}</span>
          </span>
          <span className="hide-mobile small muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{nextStatus.pct}%</span>
          <Ic n="right" size={22} />
        </Link>
        <p className="small mt"><Link to="/modules">{tx(`Ver los ${MODULES.length} módulos`, `See all ${MODULES.length} modules`)}</Link></p>
      </section>

      <section className="container mt-lg">
        <h2>{tx('Cómo se estudia aquí', 'How you study here')}</h2>
        <p className="muted">{tx('Los mismos cuatro pasos en cada módulo. Repetir no es perder el tiempo: es como el cerebro guarda las cosas.', 'The same four steps in every module. Repeating is not wasting time: it is how the brain stores things.')}</p>
        <ol className="steps mt">
          {method.map((m, k) => (
            <li key={m.title}>
              <div className="step-head">
                <span className="step-n">{k + 1}</span>
                <span className="step-line" />
              </div>
              <h3><Ic n={m.icon} size={20} color="var(--primary-2)" /> {m.title}</h3>
              <p>{m.desc}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
