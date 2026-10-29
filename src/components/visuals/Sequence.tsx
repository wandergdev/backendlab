import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { SeqActor, SeqMessage } from '../../types';
import { useLang } from '../../i18n/lang';
import { Glyph } from '../ui/Icon';
import { Ic } from '../ui/Icon';

/**
 * Diagrama de secuencia animado: cada mensaje "viaja" de un actor a otro como un paquete.
 * Se puede reproducir solo (como un video) o avanzar paso a paso.
 */
export function Sequence({ actors, messages, autoplay = false }: { actors: SeqActor[]; messages: SeqMessage[]; autoplay?: boolean }) {
  const { tr, tx } = useLang();
  const [step, setStep] = useState(autoplay ? 0 : 0);
  const [playing, setPlaying] = useState(autoplay);
  const timer = useRef<number | undefined>(undefined);
  const n = actors.length;
  const col = (id: string) => Math.max(0, actors.findIndex((a) => a.id === id));
  const center = (i: number) => ((i + 0.5) / n) * 100;

  useEffect(() => {
    if (!playing) return;
    if (step >= messages.length) {
      setPlaying(false);
      return;
    }
    timer.current = window.setTimeout(() => setStep((s) => s + 1), step === 0 ? 300 : 1700);
    return () => clearTimeout(timer.current);
  }, [playing, step, messages.length]);

  const play = () => {
    if (step >= messages.length) setStep(0);
    setPlaying(true);
  };

  return (
    <div className="sim" style={{ padding: '14px 10px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 4, marginBottom: 6 }}>
        {actors.map((a) => (
          <div key={a.id} style={{ textAlign: 'center' }}>
            <div style={{ lineHeight: 1.1, display: 'flex', justifyContent: 'center', color: 'var(--primary-2)' }}><Glyph emoji={a.emoji} size={34} /></div>
            <div className="small bold" style={{ lineHeight: 1.2 }}>{tr(a.label)}</div>
          </div>
        ))}
      </div>
      <div style={{ position: 'relative', paddingTop: 4 }}>
        {actors.map((a, i) => (
          <div key={a.id} style={{ position: 'absolute', top: 0, bottom: 0, left: `${center(i)}%`, borderLeft: '2px dashed var(--border)' }} />
        ))}
        {messages.map((m, i) => {
          const visible = i < step;
          const current = i === step - 1;
          const a = col(m.from);
          const b = col(m.to);
          const self = a === b;
          const left = Math.min(center(a), center(b));
          const width = Math.abs(center(b) - center(a));
          const color = m.color ?? (b < a ? 'var(--green)' : 'var(--primary-2)');
          return (
            <div key={i} style={{ position: 'relative', height: m.note ? 74 : 54, opacity: visible ? 1 : 0.12, transition: 'opacity .3s' }}>
              {self ? (
                <div
                  className="small bold"
                  style={{
                    position: 'absolute', left: `${center(a)}%`, transform: 'translateX(-50%)', top: 8, background: 'var(--surface)',
                    border: `2px solid ${color}`, borderRadius: 10, padding: '4px 10px', maxWidth: '46%', textAlign: 'center', lineHeight: 1.25,
                  }}
                >
                  <Ic n="gear" size={16} /> {tr(m.label)}
                </div>
              ) : (
                <>
                  <div className="small bold" style={{ position: 'absolute', left: `${left}%`, width: `${width}%`, top: 2, textAlign: 'center', lineHeight: 1.2, padding: '0 4px' }}>
                    {tr(m.label)}
                  </div>
                  <div style={{ position: 'absolute', left: `${left}%`, width: `${width}%`, top: 32, height: 3, background: color, borderRadius: 2 }}>
                    <div
                      style={{
                        position: 'absolute', top: -6, [b > a ? 'right' : 'left']: -2, width: 0, height: 0,
                        borderTop: '7.5px solid transparent', borderBottom: '7.5px solid transparent',
                        [b > a ? 'borderLeft' : 'borderRight']: `11px solid ${color}`,
                      }}
                    />
                    {current && (
                      <motion.div
                        key={`dot-${step}`}
                        initial={{ left: b > a ? '0%' : '100%' }}
                        animate={{ left: b > a ? '100%' : '0%' }}
                        transition={{ duration: 0.9, ease: 'easeInOut' }}
                        style={{ position: 'absolute', top: -7, width: 16, height: 16, marginLeft: -8, borderRadius: 6, background: 'var(--yellow)', boxShadow: '0 0 12px var(--yellow)' }}
                      />
                    )}
                  </div>
                </>
              )}
              {m.note && (
                <div className="tiny muted" style={{ position: 'absolute', top: self ? 44 : 40, left: `${self ? center(a) - 23 : left}%`, width: `${self ? 46 : width}%`, textAlign: 'center', lineHeight: 1.2 }}>
                  {tr(m.note)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="row center mt">
        <button className="btn btn-primary btn-sm" onClick={playing ? () => setPlaying(false) : play}>
          {playing ? <><Ic n="pause" size={18} /> {tx('Pausa', 'Pause')}</> : step >= messages.length ? <><Ic n="reset" size={18} /> {tx('Repetir', 'Replay')}</> : <><Ic n="play" size={18} weight="fill" /> {tx('Reproducir', 'Play')}</>}
        </button>
        <button className="btn btn-sm" disabled={step >= messages.length} onClick={() => { setPlaying(false); setStep((s) => s + 1); }}>
          <Ic n="next" size={18} /> {tx('Paso', 'Step')}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setPlaying(false); setStep(0); }}>
          <Ic n="prev" size={18} /> {tx('Inicio', 'Start')}
        </button>
        <span className="small faint">{Math.min(step, messages.length)}/{messages.length}</span>
      </div>
    </div>
  );
}
