import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLang } from '../i18n/lang';
import { GLOSSARY } from '../content/glossary';
import { getModule } from '../content';
import { Glyph, Ic } from '../components/ui/Icon';

export function Glossary() {
  const { tr, tx } = useLang();
  const [q, setQ] = useState('');
  const [quiz, setQuiz] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return GLOSSARY.filter((g) => !n || g.term.toLowerCase().includes(n) || tr(g.def).toLowerCase().includes(n)).sort((a, b) => a.term.localeCompare(b.term));
  }, [q, tr]);

  return (
    <div className="container mt-lg">
      <h1 className="h-icon"><Ic n="books" size={36} /> {tx('Glosario visual', 'Visual glossary')}</h1>
      <p className="muted">{tx(`${GLOSSARY.length} términos. Activa el modo "adivina" para tapar las definiciones y ponerte a prueba.`, `${GLOSSARY.length} terms. Turn on "guess" mode to hide the definitions and test yourself.`)}</p>
      <div className="row mb">
        <input className="input grow" placeholder={tx('Buscar: cache, JWT, puerto…', 'Search: cache, JWT, port…')} value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 420 }} />
        <label className="small row" style={{ gap: 6 }}>
          <input type="checkbox" checked={quiz} onChange={() => { setQuiz((v) => !v); setRevealed(new Set()); }} /> <Ic n="eyeSlash" size={18} /> {tx('Modo adivina', 'Guess mode')}
        </label>
      </div>
      <div className="grid grid-auto">
        {list.map((g, i) => {
          const m = getModule(g.module);
          const hidden = quiz && !revealed.has(g.term);
          return (
            <motion.div key={g.term} className="card tight" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.015, 0.4) }} onClick={() => quiz && setRevealed((r) => new Set(r).add(g.term))} style={{ cursor: quiz ? 'pointer' : 'default' }}>
              <div className="row between">
                <span className="bold ic"><Glyph emoji={g.emoji} size={22} /> {g.term}</span>
                {m && <Link to={`/m/${m.id}`} className="tiny" onClick={(e) => e.stopPropagation()}>{tx('Módulo', 'Module')} {m.num}</Link>}
              </div>
              {hidden ? (
                <div className="small faint mt">{tx('¿Qué significa? Piénsalo y toca para ver.', 'What does it mean? Think, then tap to see.')}</div>
              ) : (
                <>
                  <div className="small mt" style={{ lineHeight: 1.45 }}>{tr(g.def)}</div>
                  {g.formula && <div className="tiny mono mt" style={{ color: 'var(--green)', display: 'flex', gap: 6 }}><Ic n="puzzle" size={16} /> {tr(g.formula)}</div>}
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
