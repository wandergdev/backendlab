import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import { t, type L } from '../../types';
import { useLang } from '../../i18n/lang';
import { gitExec, headCommit, initialGit, type GitLine, type GitState } from '../../lib/git';
import { Tasks, type SimProps } from './SimHost';

const LANE_COLORS = ['#7c6cff', '#00d29a', '#ff9f43', '#4cc9f0', '#f78fb3'];

type Goal = { key: string; label: L; hint: string; test: (s: GitState, cmd: string) => boolean };
const GOALS: Goal[] = [
  { key: 'init', label: t('Empieza a rastrear el proyecto', 'Start tracking the project'), hint: 'git init', test: (s) => s.initialized },
  { key: 'add', label: t('Prepara los cambios (staging)', 'Stage the changes'), hint: 'git add .', test: (s) => Object.keys(s.index).length > 0 },
  { key: 'commit', label: t('Guarda tu primera foto (commit)', 'Save your first snapshot (commit)'), hint: 'git commit -m "Primer commit"', test: (s) => s.commits.length >= 1 },
  { key: 'branch', label: t('Crea y cámbiate a una rama feature-login', 'Create and switch to a feature-login branch'), hint: 'git checkout -b feature-login', test: (s) => 'feature-login' in s.branches && s.head === 'feature-login' },
  { key: 'featcommit', label: t('En la rama, crea login.js y haz commit', 'On the branch, create login.js and commit'), hint: 'touch login.js → git add . → git commit -m "Add login"', test: (s) => s.commits.some((c) => c.branch === 'feature-login') },
  { key: 'back', label: t('Vuelve a main', 'Go back to main'), hint: 'git checkout main', test: (s, cmd) => s.head === 'main' && /checkout|switch/.test(cmd) && 'feature-login' in s.branches },
  { key: 'merge', label: t('Fusiona feature-login dentro de main', 'Merge feature-login into main'), hint: 'git merge feature-login', test: (s) => { const h = headCommit(s); return s.head === 'main' && !!h && 'login.js' in h.files; } },
  { key: 'push', label: t('Sube main a GitHub', 'Push main to GitHub'), hint: 'git push origin main', test: (s) => !!s.remote.main && s.remote.main === s.branches.main && s.commits.length > 1 },
];

function Graph({ s }: { s: GitState }) {
  const { tx } = useLang();
  if (!s.commits.length) return <div className="small faint center" style={{ padding: 30 }}>{tx('(Aún no hay commits. Tu historia empieza con el primero.)', '(No commits yet. Your history starts with the first one.)')}</div>;
  const lane = (b: string) => Math.max(0, s.branchOrder.indexOf(b));
  const X = (n: number) => 36 + n * 92;
  const Y = (l: number) => 34 + l * 62;
  const width = X(s.commits.length) + 90;
  const height = Y(Math.max(1, s.branchOrder.length - 1)) + 40;
  const byId = Object.fromEntries(s.commits.map((c) => [c.id, c]));
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        {s.commits.flatMap((c) =>
          c.parents.map((p) => {
            const pc = byId[p];
            const x1 = X(pc.n), y1 = Y(lane(pc.branch)), x2 = X(c.n), y2 = Y(lane(c.branch));
            return <path key={c.id + p} d={`M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`} stroke={LANE_COLORS[lane(c.branch) % 5]} strokeWidth={3} fill="none" opacity={0.8} />;
          }),
        )}
        {s.commits.map((c) => (
          <g key={c.id}>
            <motion.circle initial={{ r: 0 }} animate={{ r: 11 }} cx={X(c.n)} cy={Y(lane(c.branch))} fill={LANE_COLORS[lane(c.branch) % 5]} stroke="var(--bg)" strokeWidth={3} />
            <text x={X(c.n)} y={Y(lane(c.branch)) + 26} fontSize={9} textAnchor="middle" fill="var(--muted)" fontFamily="var(--mono)">{c.id.slice(0, 5)}</text>
          </g>
        ))}
        {Object.entries(s.branches).map(([b, id], i) => {
          if (!id) return null;
          const c = byId[id];
          const isHead = b === s.head;
          const pushed = s.remote[b] === id;
          const sameTip = Object.entries(s.branches).filter(([, x]) => x === id).map(([n]) => n);
          const offset = sameTip.indexOf(b);
          return (
            <g key={b + i}>
              <rect x={X(c.n) + 14} y={Y(lane(c.branch)) - 22 - offset * 18} rx={6} width={b.length * 7 + (isHead ? 52 : 14) + (pushed ? 16 : 0)} height={16} fill={isHead ? 'var(--yellow)' : 'var(--surface-2)'} />
              <text x={X(c.n) + 20} y={Y(lane(c.branch)) - 10 - offset * 18} fontSize={11} fontWeight={800} fill={isHead ? '#222' : 'var(--text)'} fontFamily="var(--mono)">
                {isHead ? 'HEAD → ' : ''}{b}{pushed ? ' ☁️' : ''}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function GitSim({ labId }: SimProps) {
  const { tr, tx } = useLang();
  const [s, setS] = useState<GitState>(initialGit);
  const [lines, setLines] = useState<(GitLine & { cmd?: boolean })[]>([{ text: tx('Proyecto con un archivo: server.js. Escribe "git init" para empezar.', 'Project with one file: server.js. Type "git init" to start.'), cls: 'muted' }]);
  const [input, setInput] = useState('');
  const [done, setDone] = useState<Record<string, boolean>>({});
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [lines]);

  const run = (cmd: string) => {
    if (!cmd.trim()) return;
    if (cmd.trim() === 'clear') {
      setLines([]);
      setInput('');
      return;
    }
    const r = gitExec(s, cmd);
    setS(r.state);
    setLines((l) => [...l, { text: cmd, cmd: true }, ...r.out]);
    setDone((d) => {
      const n = { ...d };
      GOALS.forEach((g) => {
        if (!n[g.key] && g.test(r.state, cmd)) n[g.key] = true;
      });
      return n;
    });
    setInput('');
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && run(input);

  const head = headCommit(s)?.files ?? {};
  const staged = Object.keys(s.index).filter((f) => s.index[f] !== head[f]);
  const changed = Object.keys(s.working).filter((f) => s.working[f] !== (s.index[f] ?? head[f]) || !(f in s.index || f in head));
  const nextGoal = GOALS.find((g) => !done[g.key]);
  const colorFor = (c?: string) => (c === 'err' ? 'err' : c === 'ok' ? 'prompt' : c === 'add' ? 'prompt' : c === 'mod' ? 'err' : c === 'muted' ? 'faint' : '');

  return (
    <div className="sim stack">
      <div className="sim-title">🌳 {tx('Git: la máquina del tiempo de tu código', "Git: your code's time machine")}</div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
        {[
          { emoji: '📝', title: tx('Tu carpeta (working)', 'Your folder (working)'), files: changed, color: 'var(--orange)', cmd: 'git add →' },
          { emoji: '📦', title: tx('Preparado (staging)', 'Staged'), files: staged, color: 'var(--blue)', cmd: 'git commit →' },
          { emoji: '📸', title: tx('Historial (commits)', 'History (commits)'), files: Object.keys(head), color: 'var(--primary)', cmd: 'git push →' },
          { emoji: '☁️', title: 'GitHub', files: s.remote.main ? [`main @ ${s.remote.main.slice(0, 5)}`] : [], color: 'var(--green)', cmd: '' },
        ].map((b) => (
          <div key={b.title} className="panel" style={{ borderColor: b.color, borderWidth: 2 }}>
            <div className="small bold">{b.emoji} {b.title}</div>
            <div className="mono tiny" style={{ minHeight: 34 }}>{b.files.length ? b.files.join(', ') : '—'}</div>
            {b.cmd && <div className="tiny faint">{b.cmd}</div>}
          </div>
        ))}
      </div>
      <div className="panel">
        <Graph s={s} />
      </div>
      <div className="terminal" ref={box} style={{ minHeight: 180 }}>
        {lines.map((l, i) => (l.cmd ? <div key={i}><span className="prompt">$</span> {l.text}</div> : <div key={i} className={colorFor(l.cls)} style={{ whiteSpace: 'pre-wrap' }}>{l.text}</div>))}
        <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
          <span className="prompt">~/proyecto ({s.initialized ? s.head : '—'})$</span>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} spellCheck={false} autoCapitalize="off" aria-label="git terminal" />
        </div>
      </div>
      {nextGoal && <div className="small">💡 {tx('Siguiente:', 'Next:')} <span className="kbd">{nextGoal.hint}</span></div>}
      <Tasks labId={labId} items={GOALS.map((g) => ({ key: g.key, label: g.label, done: !!done[g.key] }))} />
      <div className="row">
        <button className="btn btn-ghost btn-sm" onClick={() => { setS(initialGit()); setLines([]); setDone({}); }}>↺ {tx('Empezar de cero', 'Start over')}</button>
        <span className="tiny faint">{tr(t('Comandos de archivos: touch, echo "texto" > archivo, rm, ls, cat', 'File commands: touch, echo "text" > file, rm, ls, cat'))}</span>
      </div>
    </div>
  );
}
