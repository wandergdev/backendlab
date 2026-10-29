import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLang } from '../i18n/lang';
import { MODULES } from '../content';
import { dueCardIds, level, useProgress } from '../store/progress';
import { moduleStatus } from '../lib/status';
import { Blocks } from '../components/visuals/Blocks';
import { ModuleCard } from './Modules';
import { Ic, IcTile, type IcName } from '../components/ui/Icon';

export function Home() {
  const { tx } = useLang();
  const s = useProgress((x) => x);
  const due = dueCardIds(s).length;
  const lv = level(s.xp);
  const next = MODULES.find((m) => !moduleStatus(m, s).lesson) ?? MODULES[0];
  const nextStatus = moduleStatus(next, s);
  const totalStars = MODULES.reduce((a, m) => a + moduleStatus(m, s).stars, 0);

  const method = [
    { icon: 'eye' as IcName, color: 'var(--blue)', title: tx('1. Ver', '1. See'), desc: tx('Lecciones animadas: cada idea entra por los ojos, paso a paso, con ejemplos del mundo real y de código.', 'Animated lessons: every idea goes in through your eyes, step by step, with real-world and code examples.') },
    { icon: 'repeat' as IcName, color: 'var(--primary-2)', title: tx('2. Repetir', '2. Repeat'), desc: tx('Práctica donde lo que fallas VUELVE a aparecer hasta que lo dominas.', 'Practice where whatever you miss COMES BACK until you master it.') },
    { icon: 'flask' as IcName, color: 'var(--green)', title: tx('3. Hacer', '3. Do'), desc: tx('Laboratorios: terminal Linux, Git, SQL real, una API, ataques de seguridad… todo dentro de la web.', 'Labs: Linux terminal, Git, real SQL, an API, security attacks… all inside the website.') },
    { icon: 'brain' as IcName, color: 'var(--pink)', title: tx('4. Recordar', '4. Remember'), desc: tx('Tarjetas con repetición espaciada: vuelven justo cuando estás por olvidarlas.', 'Flashcards with spaced repetition: they come back right when you are about to forget.') },
  ];

  return (
    <>
      <section className="hero-glow">
        <div className="container" style={{ padding: '48px 16px 32px' }}>
          <div className="grid grid-2" style={{ alignItems: 'center', gap: 32 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="pill purple"><Ic n="sparkle" size={16} /> {tx(`${MODULES.length} módulos · Node/TS y C#/.NET · ES / EN`, `${MODULES.length} modules · Node/TS and C#/.NET · ES / EN`)}</span>
              <h1 style={{ marginTop: 14 }}>{tx('Aprende backend viéndolo, no solo leyéndolo.', 'Learn backend by seeing it, not just reading it.')}</h1>
              <p className="muted" style={{ fontSize: '1.1rem' }}>
                {tx(
                  'Como cuando aprendimos a leer: primero las letras, luego las sílabas, luego las palabras. Aquí cada concepto grande se arma con piezas pequeñas que ya viste, y lo repites hasta que se queda.',
                  'Like when we learned to read: first letters, then syllables, then words. Here every big concept is built from small pieces you have already seen, and you repeat it until it sticks.',
                )}
              </p>
              <div className="row mt">
                <Link className="btn btn-primary btn-lg" to={nextStatus.started ? `/m/${next.id}/lesson` : `/m/${next.id}`}>
                  {nextStatus.started ? tx('Continuar', 'Continue') : tx('Empezar ahora', 'Start now')} ▶
                </Link>
                {due > 0 && (
                  <Link className="btn btn-lg" to="/review">
                    <Ic n="cards" /> {tx(`Repasar ${due} tarjetas`, `Review ${due} cards`)}
                  </Link>
                )}
              </div>
            </motion.div>
            <motion.div className="card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
              <div className="tiny bold faint center">{tx('ASÍ APRENDIMOS A LEER…', 'THIS IS HOW WE LEARNED TO READ…')}</div>
              <Blocks pieces={[{ label: 'L', color: '#ff9f43' }, { label: 'A', color: '#4cc9f0' }]} result="LA" compact />
              <div className="tiny bold faint center mt">{tx('…Y ASÍ APRENDERÁS BACKEND', '…AND THIS IS HOW YOU WILL LEARN BACKEND')}</div>
              <Blocks pieces={[{ label: 'GET', emoji: '📥' }, { label: '/users/42', emoji: '🔗' }]} result={tx('"Dame el usuario 42"', '"Give me user 42"')} resultEmoji="👤" compact />
              <Blocks pieces={[{ label: 'Request', emoji: '📨' }, { label: tx('Servidor', 'Server'), emoji: '🖥️' }, { label: 'Response', emoji: '📬' }]} result={tx('Toda la web', 'The whole web')} resultEmoji="🌐" compact />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="container mt">
        <div className="grid grid-3">
          <div className="card tight center"><IcTile n="fire" color="var(--orange)" size={48} /><div className="bold" style={{ fontSize: '1.5rem' }}>{s.streak.count}</div><div className="small muted">{tx('días de racha', 'day streak')}</div></div>
          <div className="card tight center"><IcTile n="star" color="var(--yellow)" size={48} /><div className="bold" style={{ fontSize: '1.5rem' }}>{tx('Nivel', 'Level')} {lv.lvl}</div><div className="progress mt"><div style={{ width: `${(lv.into / lv.need) * 100}%` }} /></div><div className="tiny muted">{s.xp} XP</div></div>
          <div className="card tight center"><IcTile n="trophy" color="var(--green)" size={48} /><div className="bold" style={{ fontSize: '1.5rem' }}>{totalStars}/{MODULES.length * 3}</div><div className="small muted">{tx('estrellas de dominio', 'mastery stars')}</div></div>
        </div>
      </section>

      <section className="container mt-lg">
        <h2>{tx('El método: 4 pasos que se repiten en cada módulo', 'The method: 4 steps repeated in every module')}</h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {method.map((m, i) => (
            <motion.div key={i} className="card" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <IcTile n={m.icon} color={m.color} size={56} />
              <h3>{m.title}</h3>
              <p className="small muted" style={{ margin: 0 }}>{m.desc}</p>
            </motion.div>
          ))}
        </div>
        <div className="tip mt small">
          <Ic n="bulb" size={20} color="var(--yellow)" /> {tx(
            '¿Sientes que si no lo has visto, no lo sabes? Es normal. Por eso aquí todo se VE primero y luego se repite muchas veces de formas distintas (tarjeta, quiz, laboratorio). Repetir no es perder el tiempo: es como el cerebro guarda las cosas.',
            'Feel like if you have not seen it, you do not know it? That is normal. That is why here everything is SEEN first and then repeated many times in different ways (card, quiz, lab). Repeating is not wasting time: it is how the brain stores things.',
          )}
        </div>
      </section>

      <section className="container mt-lg">
        <div className="row between">
          <h2 style={{ margin: 0 }}>{tx('Tu camino', 'Your path')}</h2>
          <Link to="/modules">{tx('Ver todos →', 'See all →')}</Link>
        </div>
        <div className="grid grid-auto mt">
          {MODULES.slice(0, 6).map((m) => (
            <ModuleCard key={m.id} m={m} />
          ))}
        </div>
      </section>
    </>
  );
}
