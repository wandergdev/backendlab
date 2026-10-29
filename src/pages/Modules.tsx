import { Link } from 'react-router-dom';
import type { Module } from '../types';
import { useLang } from '../i18n/lang';
import { MODULES } from '../content';
import { useProgress } from '../store/progress';
import { moduleStatus } from '../lib/status';
import { ModuleIcon, Ic } from '../components/ui/Icon';

export function Stars({ n }: { n: number }) {
  const { tx } = useLang();
  return (
    <span className="stars" role="img" aria-label={tx(`${n} de 3 estrellas`, `${n} of 3 stars`)} style={{ display: 'inline-flex', gap: 2 }}>
      {[0, 1, 2].map((i) => (
        <Ic key={i} n="star" size={15} weight={i < n ? 'fill' : 'regular'} color={i < n ? 'var(--primary)' : 'var(--faint)'} />
      ))}
    </span>
  );
}

/** Una fila del temario: número, icono, título y estado. Se lee como el índice de un libro. */
function SyllabusRow({ m }: { m: Module }) {
  const { tr, tx } = useLang();
  const st = useProgress((s) => moduleStatus(m, s));
  return (
    <li>
      <Link to={`/m/${m.id}`}>
        <span className="num">{m.num}</span>
        <ModuleIcon id={m.id} color={m.color} size={44} />
        <span style={{ minWidth: 0 }}>
          <span className="title" style={{ display: 'block' }}>{tr(m.title)}</span>
          <span className="tag">{tr(m.tagline)}</span>
        </span>
        <span className="state">
          <Stars n={st.stars} />
          {st.started ? (
            <>
              <span className="bar" aria-hidden><span style={{ width: `${st.pct}%` }} /></span>
              <span style={{ minWidth: '3ch', textAlign: 'right' }}>{st.pct}%</span>
            </>
          ) : (
            <span>{tx('Sin empezar', 'Not started')}</span>
          )}
        </span>
      </Link>
    </li>
  );
}

/** Tarjeta compacta de módulo (se mantiene para otras pantallas). */
export function ModuleCard({ m }: { m: Module }) {
  return (
    <ul className="syllabus">
      <SyllabusRow m={m} />
    </ul>
  );
}

export function Modules() {
  const { tx } = useLang();
  const core = MODULES.filter((m) => m.track !== 'stack');
  const stack = MODULES.filter((m) => m.track === 'stack');
  return (
    <div className="container narrow mt-lg">
      <h1>{tx('Temario', 'Syllabus')}</h1>
      <p className="muted">
        {tx(
          'Cada módulo da tres estrellas: una por terminar la lección, otra por sacar al menos 80% en la práctica y otra por explorar sus laboratorios.',
          'Each module gives three stars: one for finishing the lesson, one for scoring at least 80% in practice and one for exploring its labs.',
        )}
      </p>

      <h2 className="mt-lg">{tx('Fundamentos', 'Fundamentals')}</h2>
      <p className="muted small">{tx('Sirven en cualquier lenguaje. Síguelos en orden: cada uno usa piezas del anterior.', 'They work in any language. Follow them in order: each one uses pieces from the one before.')}</p>
      <ol className="syllabus">
        {core.map((m) => <SyllabusRow key={m.id} m={m} />)}
      </ol>

      <h2 className="mt-lg">{tx('Tu stack: Node/TS y C#/.NET', 'Your stack: Node/TS and C#/.NET')}</h2>
      <p className="muted small">{tx('Las herramientas concretas para construir. Puedes intercalarlos: TypeScript o C# junto al módulo 2, EF Core después del 6.', 'The concrete tools to build with. You can interleave them: TypeScript or C# alongside module 2, EF Core after module 6.')}</p>
      <ol className="syllabus">
        {stack.map((m) => <SyllabusRow key={m.id} m={m} />)}
      </ol>
    </div>
  );
}
