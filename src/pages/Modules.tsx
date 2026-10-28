import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import type { Module } from '../types';
import { useLang } from '../i18n/lang';
import { MODULES } from '../content';
import { useProgress } from '../store/progress';
import { moduleStatus } from '../lib/status';
import { ModuleIcon } from '../components/ui/Icon';

export function Stars({ n }: { n: number }) {
  return <span className="stars">{[0, 1, 2].map((i) => (i < n ? '⭐' : '☆')).join('')}</span>;
}

export function ModuleCard({ m }: { m: Module }) {
  const { tr, tx } = useLang();
  const st = useProgress((s) => moduleStatus(m, s));
  return (
    <Link to={`/m/${m.id}`} className="card module-card" style={{ ['--mc' as string]: m.color }}>
      <ModuleIcon id={m.id} color={m.color} />
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="module-num">{tx('Módulo', 'Module')} {m.num}</div>
        <div className="bold" style={{ lineHeight: 1.25 }}>{tr(m.title)}</div>
        <div className="small muted" style={{ lineHeight: 1.35, marginTop: 2 }}>{tr(m.tagline)}</div>
        <div className="row between mt" style={{ gap: 6 }}>
          <Stars n={st.stars} />
          <span className="tiny faint">{st.pct}%</span>
        </div>
        <div className="progress" style={{ height: 6, marginTop: 4 }}>
          <div style={{ width: `${st.pct}%` }} />
        </div>
      </div>
    </Link>
  );
}

export function Modules() {
  const { tx } = useLang();
  const core = MODULES.filter((m) => m.track !== 'stack');
  const stack = MODULES.filter((m) => m.track === 'stack');
  const grid = (list: Module[]) => (
    <div className="grid grid-auto mt">
      {list.map((m, i) => (
        <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
          <ModuleCard m={m} />
        </motion.div>
      ))}
    </div>
  );
  return (
    <div className="container mt-lg">
      <h1>{tx('Los módulos', 'The modules')}</h1>
      <p className="muted">{tx('⭐ lección · ⭐ práctica ≥ 80% · ⭐ laboratorios.', '⭐ lesson · ⭐ practice ≥ 80% · ⭐ labs.')}</p>
      <h2 className="mt-lg">🧱 {tx(`Fundamentos (${core.length})`, `Fundamentals (${core.length})`)}</h2>
      <p className="muted small">{tx('Los conceptos que sirven en cualquier lenguaje. Síguelos en orden: cada uno usa piezas del anterior.', 'Concepts that work in any language. Follow them in order: each one uses pieces from the previous.')}</p>
      {grid(core)}
      <h2 className="mt-lg">🟩🟪 {tx(`Tu stack: Node/TS y C#/.NET (${stack.length})`, `Your stack: Node/TS and C#/.NET (${stack.length})`)}</h2>
      <p className="muted small">{tx('Las herramientas concretas para construir de verdad. Puedes intercalarlos con los fundamentos (por ejemplo, TypeScript y C# junto al módulo 2, EF Core después del 6).', 'The concrete tools to build for real. You can interleave them with the fundamentals (e.g. TypeScript and C# alongside module 2, EF Core after module 6).')}</p>
      {grid(stack)}
    </div>
  );
}
