import { useEffect, useRef } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLang } from '../i18n/lang';
import { MODULES, getModule } from '../content';
import { addCardsToDeck, recordPractice, useProgress } from '../store/progress';
import { moduleStatus } from '../lib/status';
import { Blocks } from '../components/visuals/Blocks';
import { PracticeRunner } from '../components/exercises/PracticeRunner';
import { CardDeck } from '../components/exercises/CardDeck';
import { SimHost } from '../components/sims/SimHost';
import { Stars } from './Modules';
import { ModuleIcon } from '../components/ui/Icon';
import { Ic, IcTile, type IcName } from '../components/ui/Icon';

type Tab = 'overview' | 'practice' | 'labs' | 'cards';

export function ModulePage({ tab = 'overview' }: { tab?: Tab }) {
  const { id } = useParams();
  const { tr, tx } = useLang();
  const m = getModule(id);
  const s = useProgress((x) => x);
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (tab !== 'overview') setTimeout(() => contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }, [tab, id]);
  if (!m) return <Navigate to="/modules" replace />;
  const st = moduleStatus(m, s);
  const idx = MODULES.indexOf(m);
  const prev = MODULES[idx - 1];
  const next = MODULES[idx + 1];

  const steps = [
    { tab: 'lesson', icon: 'eye' as IcName, color: 'var(--blue)', title: tx('Lección animada', 'Animated lesson'), desc: tx(`${m.lesson.length} pasos visuales`, `${m.lesson.length} visual steps`), done: st.lesson, to: `/m/${m.id}/lesson`, status: st.lesson ? tx('Completada', 'Completed') : st.lessonStep > 0 ? tx(`Vas por el paso ${st.lessonStep + 1}`, `You are on step ${st.lessonStep + 1}`) : tx('Empieza aquí', 'Start here') },
    { tab: 'practice', icon: 'repeat' as IcName, color: 'var(--primary-2)', title: tx('Práctica', 'Practice'), desc: tx(`${m.practice.length} ejercicios que se repiten si fallas`, `${m.practice.length} exercises that repeat if you miss`), done: st.practice, to: `/m/${m.id}/practice`, status: st.practiceBest ? tx(`Mejor: ${st.practiceBest}%`, `Best: ${st.practiceBest}%`) : tx('Sin intentos', 'No attempts') },
    { tab: 'labs', icon: 'flask' as IcName, color: 'var(--green)', title: tx('Laboratorios', 'Labs'), desc: tx(`${m.labs.length} simuladores con objetivos`, `${m.labs.length} simulators with goals`), done: st.labs, to: `/m/${m.id}/labs`, status: `${st.labsTouched}/${m.labs.length}` },
    { tab: 'cards', icon: 'brain' as IcName, color: 'var(--pink)', title: tx('Tarjetas', 'Cards'), desc: tx(`${m.cards.length} tarjetas de memoria`, `${m.cards.length} memory cards`), done: st.cardsMastered === m.cards.length, to: `/m/${m.id}/cards`, status: tx(`${st.cardsMastered} dominadas`, `${st.cardsMastered} mastered`) },
  ];

  return (
    <div className="container mt" style={{ ['--mc' as string]: m.color }}>
      <div className="row small">
        <Link to="/modules" className="ic"><Ic n="left" size={16} /> {tx('Módulos', 'Modules')}</Link>
      </div>
      <div className="card mt">
        <div className="row" style={{ alignItems: 'flex-start', gap: 18 }}>
          <ModuleIcon id={m.id} color={m.color} size={76} />
          <div className="grow" style={{ minWidth: 220 }}>
            <div className="module-num">{tx(`Módulo ${m.num} de ${MODULES.length}`, `Module ${m.num} of ${MODULES.length}`)}</div>
            <h1 style={{ margin: '4px 0' }}>{tr(m.title)}</h1>
            <div className="muted">{tr(m.tagline)}</div>
            <div className="row mt">
              <Stars n={st.stars} />
              <span className="small faint">{st.pct}% {tx('completado', 'complete')}</span>
            </div>
          </div>
        </div>
        <Blocks pieces={m.formula.pieces} result={m.formula.result} />
      </div>

      <div className="grid mt" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        {steps.map((stp) => (
          <Link key={stp.tab} to={stp.to} className="card module-card" style={{ ['--mc' as string]: m.color, flexDirection: 'column', gap: 4, borderColor: tab === stp.tab ? m.color : undefined }}>
            <div className="row between" style={{ width: '100%' }}>
              <IcTile n={stp.icon} color={stp.color} size={48} />
              {stp.done && <span className="pill green"><Ic n="check" size={14} weight="bold" label={tx('Completado', 'Done')} /></span>}
            </div>
            <div className="bold">{stp.title}</div>
            <div className="small muted">{stp.desc}</div>
            <div className="tiny faint">{stp.status}</div>
          </Link>
        ))}
      </div>

      <div className="mt-lg" ref={contentRef} style={{ scrollMarginTop: 80 }}>
        {tab === 'overview' && (
          <div className="card center stack" style={{ alignItems: 'center' }}>
            <IcTile n="eye" color="var(--blue)" />
            <h2>{st.lesson ? tx('¡Lección completada!', 'Lesson completed!') : tx('Empieza por la lección', 'Start with the lesson')}</h2>
            <p className="muted" style={{ maxWidth: 560 }}>
              {st.lesson
                ? tx('Ahora repite: haz la práctica, juega con los laboratorios y repasa las tarjetas. Repetir de formas distintas es lo que fija el conocimiento.', 'Now repeat: do the practice, play with the labs and review the cards. Repeating in different ways is what makes knowledge stick.')
                : tx('Cada paso muestra UNA idea con una animación, una analogía del mundo real y un ejemplo de código. No hay prisa: puedes volver atrás cuando quieras.', 'Each step shows ONE idea with an animation, a real-world analogy and a code example. No rush: you can go back anytime.')}
            </p>
            <Link className="btn btn-primary btn-lg" to={st.lesson ? `/m/${m.id}/practice` : `/m/${m.id}/lesson`}>
              {st.lesson ? tx('Ir a la práctica', 'Go to practice') : st.lessonStep > 0 ? tx('Continuar lección', 'Continue lesson') : tx('Empezar lección', 'Start lesson')} <Ic n="right" size={18} weight="bold" />
            </Link>
          </div>
        )}

        {tab === 'practice' && (
          <div className="narrow" style={{ margin: '0 auto' }}>
            <PracticeRunner key={m.id} exercises={m.practice} title={tr(m.title)} onFinish={(score) => recordPractice(m.id, score)} />
          </div>
        )}

        {tab === 'labs' && (
          <div className="stack" style={{ gap: 28 }}>
            {m.labs.map((l) => (
              <motion.section key={l.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="h-icon" style={{ marginBottom: 4 }}><Ic n="flask" size={26} /> {tr(l.title)}</h2>
                <p className="muted">{tr(l.desc)}</p>
                <SimHost id={l.sim} props={l.props} labId={l.id} />
              </motion.section>
            ))}
          </div>
        )}

        {tab === 'cards' && (
          <div className="stack">
            <div className="small muted center">{tx('Las tarjetas que marques como "Lo sabía" vuelven en unos días. Las demás, en esta misma sesión.', 'Cards you mark "I knew it" come back in a few days. The rest come back in this same session.')}</div>
            <CardDeck key={m.id} cards={m.cards} />
            <div className="center">
              <button className="btn btn-ghost btn-sm" onClick={() => addCardsToDeck(m.cards.map((c) => c.id))}><Ic n="plus" size={18} /> {tx('Añadir estas tarjetas a mi repaso diario', 'Add these cards to my daily review')}</button>
            </div>
          </div>
        )}
      </div>

      <div className="row between mt-lg">
        {prev ? <Link className="btn" to={`/m/${prev.id}`}><Ic n="left" size={18} /> {tr(prev.title)}</Link> : <span />}
        {next && <Link className="btn" to={`/m/${next.id}`}>{tr(next.title)} <Ic n="right" size={18} /></Link>}
      </div>
    </div>
  );
}
