import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n/lang';
import { CARD_INDEX, MODULES, mixedExercises } from '../content';
import { dueCardIds, MAX_BOX, useProgress } from '../store/progress';
import { CardDeck } from '../components/exercises/CardDeck';
import { PracticeRunner } from '../components/exercises/PracticeRunner';
import { Ic, IcTile } from '../components/ui/Icon';

export function Review() {
  const { tr, tx } = useLang();
  const s = useProgress((x) => x);
  const [mode, setMode] = useState<'cards' | 'quiz' | null>(null);
  const [all, setAll] = useState(false);
  const [session, setSession] = useState(0);

  const due = dueCardIds(s).filter((id) => CARD_INDEX[id]);
  const deckIds = Object.keys(s.cards).filter((id) => CARD_INDEX[id]);
  const studied = MODULES.filter((m) => s.lessons[m.id]?.done).map((m) => m.id);
  const cards = useMemo(() => (all ? deckIds : due).map((id) => CARD_INDEX[id].card), [session, all]);
  const quiz = useMemo(() => mixedExercises(studied.length ? studied : MODULES.map((m) => m.id), 12), [session, studied.join()]);
  const boxes = Array.from({ length: MAX_BOX }, (_, i) => deckIds.filter((id) => s.cards[id].box === i + 1).length);
  const maxBox = Math.max(1, ...boxes);

  if (mode === 'cards') {
    return (
      <div className="container mt">
        <button className="btn btn-ghost btn-sm mb" onClick={() => setMode(null)}><Ic n="left" size={16} /> {tx('Repaso', 'Review')}</button>
        {cards.length ? <CardDeck key={session} cards={cards} onDone={() => setMode(null)} /> : <div className="card center">{tx('No hay tarjetas.', 'No cards.')}</div>}
      </div>
    );
  }
  if (mode === 'quiz') {
    return (
      <div className="container narrow mt">
        <button className="btn btn-ghost btn-sm mb" onClick={() => setMode(null)}><Ic n="left" size={16} /> {tx('Repaso', 'Review')}</button>
        <PracticeRunner key={session} exercises={quiz} title={tx('Repaso mezclado', 'Mixed review')} />
      </div>
    );
  }

  return (
    <div className="container mt-lg">
      <h1 className="h-icon"><Ic n="brain" size={36} /> {tx('Repaso diario', 'Daily review')}</h1>
      <p className="muted" style={{ maxWidth: 720 }}>
        {tx(
          'Aquí vuelve todo lo que ya viste. Las tarjetas suben de caja cada vez que las sabes (1 → 5) y tardan más en volver; si fallas, vuelven a la caja 1. Así repasas justo lo que estás por olvidar.',
          'Everything you have already seen comes back here. Cards move up a box each time you know them (1 → 5) and take longer to return; if you miss, they go back to box 1. This way you review exactly what you are about to forget.',
        )}
      </p>
      <div className="grid grid-2 mt">
        <div className="card stack">
          <IcTile n="cards" color="var(--primary-2)" />
          <h2 style={{ margin: 0 }}>{tx('Tarjetas para hoy', 'Cards for today')}</h2>
          <div style={{ fontSize: '2.6rem', fontWeight: 900, color: due.length ? 'var(--yellow)' : 'var(--green)' }}>{due.length}</div>
          {deckIds.length === 0 ? (
            <p className="small muted">{tx('Tu mazo está vacío. Termina una lección y sus tarjetas aparecerán aquí.', 'Your deck is empty. Finish a lesson and its cards will appear here.')} <Link to="/m/internet/lesson">{tx('Empieza por el módulo 1 →', 'Start with module 1 →')}</Link></p>
          ) : (
            <div className="row">
              <button className="btn btn-primary" disabled={!due.length} onClick={() => { setAll(false); setSession((x) => x + 1); setMode('cards'); }}>▶ {tx('Repasar', 'Review')}</button>
              <button className="btn" onClick={() => { setAll(true); setSession((x) => x + 1); setMode('cards'); }}>{tx(`Repasar todo (${deckIds.length})`, `Review all (${deckIds.length})`)}</button>
            </div>
          )}
          {!due.length && deckIds.length > 0 && <div className="small" style={{ color: 'var(--green)' }}><Ic n="checkCircle" size={18} /> {tx('¡Al día! Vuelve mañana o repasa todo si quieres más.', 'All caught up! Come back tomorrow or review everything for more.')}</div>}
        </div>
        <div className="card stack">
          <IcTile n="dice" color="var(--orange)" />
          <h2 style={{ margin: 0 }}>{tx('Quiz mezclado', 'Mixed quiz')}</h2>
          <p className="small muted">{tx('12 preguntas al azar de los módulos que ya estudiaste. Mezclar temas obliga al cerebro a "buscar" la respuesta, y eso la fija mejor.', '12 random questions from the modules you have studied. Mixing topics forces the brain to "search" for the answer, which makes it stick better.')}</p>
          <div className="small">{studied.length ? studied.map((id) => MODULES.find((m) => m.id === id)!.emoji).join(' ') : tx('(todavía ninguno: usaremos todos)', '(none yet: we will use all)')}</div>
          <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => { setSession((x) => x + 1); setMode('quiz'); }}>▶ {tx('Empezar quiz', 'Start quiz')}</button>
        </div>
      </div>

      {deckIds.length > 0 && (
        <div className="card mt">
          <h3 className="h-icon"><Ic n="box" size={24} /> {tx('Tus tarjetas por caja', 'Your cards by box')}</h3>
          <div className="row" style={{ alignItems: 'flex-end', gap: 14, height: 150 }}>
            {boxes.map((n, i) => (
              <div key={i} className="grow center" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                <div className="small bold">{n}</div>
                <div style={{ height: `${(n / maxBox) * 100}px`, minHeight: 4, borderRadius: '8px 8px 0 0', background: `color-mix(in srgb, var(--green) ${30 + i * 15}%, var(--primary))` }} />
                <div className="tiny muted">{tx('Caja', 'Box')} {i + 1}</div>
              </div>
            ))}
          </div>
          <div className="tiny faint mt">{tx('Caja 1: hoy · 2: mañana · 3: en 3 días · 4: en 7 días · 5: en 16 días', 'Box 1: today · 2: tomorrow · 3: in 3 days · 4: in 7 days · 5: in 16 days')}</div>
          <div className="small mt">
            {tx('Más difíciles para ti:', 'Hardest for you:')}{' '}
            {deckIds
              .filter((id) => s.cards[id].lapses > 0)
              .sort((a, b) => s.cards[b].lapses - s.cards[a].lapses)
              .slice(0, 5)
              .map((id) => (
                <span key={id} className="pill red" style={{ marginRight: 6 }}>{tr(CARD_INDEX[id].card.front)}</span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
