import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { Exercise as Ex } from '../../types';
import { useLang } from '../../i18n/lang';
import { addXp } from '../../store/progress';
import { Exercise } from './Exercise';

type Item = { ex: Ex; key: string; retry: boolean };

/**
 * Sesión de práctica estilo "repetir hasta dominarlo":
 * si fallas un ejercicio, vuelve a aparecer unos pasos después. La sesión termina cuando aciertas todos.
 */
export function PracticeRunner({ exercises, onFinish, title }: { exercises: Ex[]; onFinish?: (score: number) => void; title?: string }) {
  const { tx } = useLang();
  const initial = useMemo<Item[]>(() => exercises.map((ex, i) => ({ ex, key: `e${i}`, retry: false })), [exercises]);
  const [queue, setQueue] = useState<Item[]>(initial);
  const [firstTry, setFirstTry] = useState<Record<string, boolean>>({});
  const [doneKeys, setDoneKeys] = useState<Set<string>>(new Set());
  const [round, setRound] = useState(0);
  const [finished, setFinished] = useState(false);
  const total = initial.length;

  const current = queue[0];

  const handle = (correct: boolean) => {
    const it = queue[0];
    if (!(it.key in firstTry)) setFirstTry((f) => ({ ...f, [it.key]: correct }));
    let rest = queue.slice(1);
    if (correct) {
      setDoneKeys((d) => new Set(d).add(it.key));
      addXp(it.retry ? 3 : 10);
    } else {
      // Repetición: lo reinsertamos 2 posiciones más adelante (o al final).
      const pos = Math.min(2, rest.length);
      rest = [...rest.slice(0, pos), { ...it, retry: true }, ...rest.slice(pos)];
    }
    setRound((r) => r + 1);
    if (!rest.length) {
      const first = { ...firstTry, ...(it.key in firstTry ? {} : { [it.key]: correct }) };
      const score = Math.round((Object.values(first).filter(Boolean).length / total) * 100);
      setFinished(true);
      onFinish?.(score);
    }
    setQueue(rest);
  };

  if (finished || !current) {
    const score = Math.round((Object.values(firstTry).filter(Boolean).length / Math.max(1, total)) * 100);
    const missed = total - Object.values(firstTry).filter(Boolean).length;
    return (
      <motion.div className="card center stack" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ alignItems: 'center', padding: 36 }}>
        <div style={{ fontSize: '4rem' }}>{score >= 90 ? '🏆' : score >= 70 ? '🌟' : '💪'}</div>
        <h2>{tx('¡Sesión completada!', 'Session complete!')}</h2>
        <div style={{ fontSize: '2.4rem', fontWeight: 900, color: score >= 80 ? 'var(--green)' : 'var(--yellow)' }}>{score}%</div>
        <div className="muted">{tx('acertados a la primera', 'right on the first try')}</div>
        {missed > 0 && <p className="small" style={{ maxWidth: 460 }}>{tx(`Fallaste ${missed} al principio, pero los repetiste hasta acertarlos. Así se construye la memoria: ver → fallar → repetir → recordar.`, `You missed ${missed} at first, but you repeated them until you got them right. That is how memory is built: see → fail → repeat → remember.`)}</p>}
        <button
          className="btn btn-primary btn-lg mt"
          onClick={() => {
            setQueue(initial.map((x) => ({ ...x })));
            setFirstTry({});
            setDoneKeys(new Set());
            setFinished(false);
            setRound((r) => r + 1);
          }}
        >
          ↺ {tx('Practicar otra vez', 'Practice again')}
        </button>
      </motion.div>
    );
  }

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        {title && <span className="bold small hide-mobile">{title}</span>}
        <div className="progress grow">
          <div style={{ width: `${(doneKeys.size / total) * 100}%` }} />
        </div>
        <span className="small bold mono">
          {doneKeys.size}/{total}
        </span>
      </div>
      {current.retry && <div className="pill yellow" style={{ alignSelf: 'flex-start' }}>🔁 {tx('Repaso: este lo fallaste antes', 'Review: you missed this one before')}</div>}
      <motion.div key={round} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="card">
        <Exercise ex={current.ex} onResult={handle} />
      </motion.div>
    </div>
  );
}
