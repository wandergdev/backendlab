import { AnimatePresence, motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { useLang } from '../../i18n/lang';
import { STACKS, useStack, type Stack } from '../../i18n/stack';
import { useProgress } from '../../store/progress';
import { Ic, IcTile } from '../ui/Icon';

/** Control de dos opciones, siempre visible, que deja claro qué stack se está mostrando. */
export function StackSwitch() {
  const { tx } = useLang();
  const { stack, setStack } = useStack();
  return (
    <div className="stack-switch" role="radiogroup" aria-label={tx('Lenguaje de los ejemplos de código', 'Language of the code examples')} title={tx('Cambia el lenguaje de TODOS los ejemplos de código', 'Changes the language of ALL code examples')}>
      <span className="stack-switch-label">{tx('Código:', 'Code:')}</span>
      {(['node', 'dotnet'] as Stack[]).map((st) => (
        <button
          key={st}
          role="radio"
          aria-checked={stack === st}
          className={`stack-opt ${stack === st ? 'on' : ''}`}
          style={stack === st ? { background: STACKS[st].color, borderColor: STACKS[st].color } : undefined}
          onClick={() => setStack(st)}
        >
          <Ic n={st === 'node' ? 'file' : 'csharp'} size={18} weight={stack === st ? 'fill' : 'duotone'} />
          <span className="stack-opt-text">{STACKS[st].short}</span>
        </button>
      ))}
    </div>
  );
}

const CHOICES: { id: Stack; title: string; items: { es: string; en: string }[] }[] = [
  {
    id: 'node',
    title: 'Node.js + TypeScript',
    items: [
      { es: 'Express y middleware con next()', en: 'Express and middleware with next()' },
      { es: 'Promise<T> y async/await', en: 'Promise<T> and async/await' },
      { es: 'Vitest, npm y Docker con Node', en: 'Vitest, npm and Docker with Node' },
    ],
  },
  {
    id: 'dotnet',
    title: 'C# + ASP.NET Core + EF Core',
    items: [
      { es: 'Controladores y minimal APIs', en: 'Controllers and minimal APIs' },
      { es: 'Task<T>, LINQ y Entity Framework', en: 'Task<T>, LINQ and Entity Framework' },
      { es: 'xUnit, dotnet CLI y Docker con .NET', en: 'xUnit, dotnet CLI and Docker with .NET' },
    ],
  },
];

/** Primera visita: explica el selector y deja elegir el stack con una decisión clara. */
export function StackOnboarding() {
  const { lang, tx } = useLang();
  const { setStack } = useStack();
  const chosen = useProgress((s) => !!s.settings.stackChosen);
  const loc = useLocation();
  const show = !chosen && !loc.pathname.startsWith('/sync');
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal card" initial={{ y: 30, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="stack-title">
            <IcTile n="wave" color="var(--yellow)" />
            <h2 id="stack-title" style={{ marginBottom: 4 }}>{tx('¿En qué lenguaje quieres ver los ejemplos?', 'Which language do you want to see the examples in?')}</h2>
            <p className="muted small">{tx('Los conceptos son los mismos en los dos. Esto solo cambia el código que verás en las lecciones.', 'The concepts are the same in both. This only changes the code you will see in the lessons.')}</p>
            <div className="grid grid-2">
              {CHOICES.map((c) => (
                <button key={c.id} className="option" onClick={() => setStack(c.id)} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: 16, borderColor: STACKS[c.id].color }}>
                  <IcTile n={c.id === 'node' ? 'file' : 'csharp'} color={STACKS[c.id].color} size={52} />
                  <span className="bold">{c.title}</span>
                  <ul className="small muted" style={{ margin: 0, paddingLeft: 18, fontWeight: 600 }}>
                    {c.items.map((it) => (
                      <li key={it.es}>{lang === 'es' ? it.es : it.en}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
            <div className="tip small mt">
              <Ic n="bulb" size={18} color="var(--yellow)" /> {tx('Puedes cambiarlo cuando quieras con el selector de la cabecera', 'You can change it anytime with the selector in the header')}{' '}
              <span className="pill">{tx('Código:', 'Code:')} Node/TS | C#/.NET</span> {tx('o con las pestañas de cada bloque de código.', 'or with the tabs on each code block.')}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
