import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { PipeStage, Txt } from '../../types';
import { useLang } from '../../i18n/lang';

/**
 * Una "línea de ensamblaje": algo (un request, un pedido, un commit) pasa por estaciones.
 * Las estaciones con condición se pueden apagar para ver EXACTAMENTE dónde se detiene.
 */
export function Pipeline({ item, itemEmoji, stages, success, vertical = true, onFinish }: { item: Txt; itemEmoji: string; stages: PipeStage[]; success: Txt; vertical?: boolean; onFinish?: (failedAt: number) => void }) {
  const { tr, tx } = useLang();
  const [pass, setPass] = useState<boolean[]>(() => stages.map(() => true));
  const [pos, setPos] = useState(-1);
  const [running, setRunning] = useState(false);
  const failIdx = stages.findIndex((s, i) => s.gate && !pass[i]);
  const stopAt = failIdx === -1 ? stages.length : failIdx;
  const finished = !running && pos >= 0;

  useEffect(() => {
    if (!running) return;
    if (pos >= stopAt) {
      setRunning(false);
      onFinish?.(failIdx);
      return;
    }
    const id = window.setTimeout(() => setPos((p) => p + 1), pos === -1 ? 150 : 850);
    return () => clearTimeout(id);
  }, [running, pos, stopAt, failIdx, onFinish]);

  const start = () => {
    setPos(-1);
    setRunning(true);
  };

  return (
    <div className="sim">
      <div className="row between mb">
        <div className="bold">
          {itemEmoji} {tr(item)}
        </div>
        <button className="btn btn-primary btn-sm" onClick={start} disabled={running}>
          ▶ {tx('Enviar', 'Send')}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', flexWrap: vertical ? 'nowrap' : 'wrap', gap: 8, alignItems: 'stretch' }}>
        {stages.map((s, i) => {
          const isHere = pos === i;
          const passed = pos > i || (finished && pos === i && i !== failIdx);
          const failedHere = finished && failIdx === i && pos >= i;
          const border = failedHere ? 'var(--red)' : isHere ? 'var(--yellow)' : passed ? 'var(--green)' : 'var(--border)';
          return (
            <div key={i} style={{ flex: vertical ? undefined : '1 1 150px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 14, border: `2px solid ${border}`, background: 'var(--surface)', transition: 'border-color .25s', position: 'relative' }}>
                <div style={{ fontSize: '1.6rem', width: 36, textAlign: 'center' }}>{s.emoji}</div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="bold">{tr(s.label)}</div>
                  {s.desc && <div className="small muted" style={{ lineHeight: 1.35 }}>{tr(s.desc)}</div>}
                  {s.gate && (
                    <label className="small row" style={{ gap: 6, marginTop: 4, cursor: 'pointer' }}>
                      <input type="checkbox" checked={pass[i]} disabled={running} onChange={() => setPass((p) => p.map((v, j) => (j === i ? !v : v)))} />
                      <span>{tr(s.gate.question)}</span>
                      <span className={`pill ${pass[i] ? 'green' : 'red'}`}>{pass[i] ? tx('sí', 'yes') : 'no'}</span>
                    </label>
                  )}
                  {failedHere && s.gate && <div className="small bold" style={{ color: 'var(--red)', marginTop: 4 }}>⛔ {tr(s.gate.failResult)}</div>}
                </div>
                {isHere && running && (
                  <motion.div layoutId="pipe-token" style={{ fontSize: '1.5rem' }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
                    {itemEmoji}
                  </motion.div>
                )}
                {passed && !isHere && <span style={{ color: 'var(--green)', fontWeight: 900 }}>✓</span>}
              </div>
              {vertical && i < stages.length - 1 && <div style={{ textAlign: 'center', color: 'var(--faint)', lineHeight: 1, margin: '2px 0' }}>↓</div>}
            </div>
          );
        })}
      </div>
      {finished && failIdx === -1 && pos >= stages.length && (
        <motion.div className="feedback ok mt" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          ✅ {tr(success)}
        </motion.div>
      )}
      {stages.some((s) => s.gate) && <div className="tiny faint mt">{tx('Desmarca una condición y vuelve a enviar para ver dónde se detiene.', 'Uncheck a condition and send again to see where it stops.')}</div>}
    </div>
  );
}
