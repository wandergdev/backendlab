import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { Card } from '../../types';
import { useLang } from '../../i18n/lang';
import { reviewCard, useProgress } from '../../store/progress';
import { Ic, IcTile } from '../ui/Icon';

/**
 * Tarjetas de memoria con repetición espaciada (sistema Leitner):
 * lo que sabes vuelve en días; lo que no, vuelve en esta misma sesión hasta que lo sepas.
 */
export function CardDeck({ cards, onDone, srs = true }: { cards: Card[]; onDone?: () => void; srs?: boolean }) {
  const { tr, tx } = useLang();
  const initial = useMemo(() => [...cards].sort(() => Math.random() - 0.5), [cards]);
  const [queue, setQueue] = useState<Card[]>(initial);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [again, setAgain] = useState(0);
  const boxes = useProgress((s) => s.cards);
  const card = queue[0];

  const answer = (ok: boolean) => {
    if (srs) reviewCard(card.id, ok);
    setFlipped(false);
    setTimeout(() => {
      setQueue((q) => {
        const rest = q.slice(1);
        if (ok) return rest;
        const pos = Math.min(3, rest.length);
        return [...rest.slice(0, pos), card, ...rest.slice(pos)];
      });
      if (ok) setKnown((k) => k + 1);
      else setAgain((a) => a + 1);
    }, 160);
  };

  if (!card) {
    return (
      <div className="card center stack" style={{ alignItems: 'center', padding: 36 }}>
        <IcTile n="brain" color="var(--pink)" size={80} />
        <h2>{tx('¡Mazo terminado!', 'Deck finished!')}</h2>
        <p className="muted">
          {tx(`Dominaste ${known} tarjetas con ${again} repeticiones extra.`, `You mastered ${known} cards with ${again} extra repetitions.`)}
        </p>
        <div className="row center">
          <button className="btn btn-primary" onClick={() => { setQueue([...cards].sort(() => Math.random() - 0.5)); setKnown(0); setAgain(0); }}>
            <Ic n="reset" /> {tx('Repasar otra vez', 'Review again')}
          </button>
          {onDone && <button className="btn" onClick={onDone}>{tx('Volver', 'Back')}</button>}
        </div>
      </div>
    );
  }

  const box = boxes[card.id]?.box ?? 1;

  return (
    <div className="stack" style={{ gap: 14, maxWidth: 620, margin: '0 auto', width: '100%' }}>
      <div className="row between small">
        <span className="muted">{tx('Quedan', 'Left')}: <b>{queue.length}</b></span>
        {srs && <span className="pill purple" title={tx('Cuanto más alta la caja, más días tarda en volver', 'The higher the box, the more days until it returns')}>📦 {tx('Caja', 'Box')} {box}/5</span>}
      </div>
      <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped((f) => !f)} role="button" tabIndex={0} onKeyDown={(e) => e.key === ' ' && (e.preventDefault(), setFlipped((f) => !f))}>
        <motion.div key={card.id + queue.length} className="flashcard-inner" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div className="flashcard-face">
            {card.emoji && <div style={{ fontSize: '3rem' }}>{card.emoji}</div>}
            <div className="bold" style={{ fontSize: '1.35rem', lineHeight: 1.35 }}>{tr(card.front)}</div>
            <div className="tiny faint mt">{tx('Piensa la respuesta… luego toca para girar', 'Think of the answer… then tap to flip')}</div>
          </div>
          <div className="flashcard-face back">
            <div style={{ fontSize: '1.12rem', lineHeight: 1.5, fontWeight: 700, whiteSpace: 'pre-line' }}>{tr(card.back)}</div>
          </div>
        </motion.div>
      </div>
      {flipped ? (
        <div className="grid grid-2">
          <button className="btn btn-red btn-lg" onClick={() => answer(false)}><Ic n="repeat" /> {tx('Repasar otra vez', 'Show again')}</button>
          <button className="btn btn-green btn-lg" onClick={() => answer(true)}><Ic n="checkCircle" /> {tx('Lo sabía', 'I knew it')}</button>
        </div>
      ) : (
        <button className="btn btn-primary btn-lg" onClick={() => setFlipped(true)}><Ic n="flip" /> {tx('Girar tarjeta', 'Flip card')}</button>
      )}
    </div>
  );
}
