import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { t, type L } from '../../types';
import { useLang } from '../../i18n/lang';
import { exec, initialTerm, promptPath, type Line, type TermState } from '../../lib/terminal';
import { Tasks, type SimProps } from './SimHost';

type Ctx = { state: TermState; cmd: string; out: Line[] };
type Goal = { key: string; label: L; hint: string; test: (c: Ctx) => boolean };

const has = (st: TermState, path: string[]) => {
  let n: unknown = st.root;
  for (const p of path) {
    const node = n as { type: string; children?: Record<string, unknown> };
    if (node?.type !== 'dir' || !node.children?.[p]) return false;
    n = node.children[p];
  }
  return true;
};

const GOALS: Goal[] = [
  { key: 'pwd', label: t('¿Dónde estás? Usa pwd', 'Where are you? Use pwd'), hint: 'pwd', test: (c) => c.cmd.trim() === 'pwd' },
  { key: 'ls', label: t('Mira qué hay en la carpeta con ls', 'See what is in the folder with ls'), hint: 'ls', test: (c) => /^ls\b/.test(c.cmd.trim()) },
  { key: 'cat', label: t('Entra a proyecto (cd) y lee server.js con cat', 'Go into proyecto (cd) and read server.js with cat'), hint: 'cd proyecto  →  cat server.js', test: (c) => /^cat\s+.*server\.js/.test(c.cmd.trim()) && !c.out.some((l) => l.cls === 'err') },
  { key: 'log', label: t('Ve a /var/log (los logs del servidor)', 'Go to /var/log (the server logs)'), hint: 'cd /var/log', test: (c) => c.state.cwd.join('/') === 'var/log' },
  { key: 'grep', label: t('Encuentra solo las líneas con ERROR en app.log', 'Find only the lines with ERROR in app.log'), hint: 'grep "ERROR" app.log', test: (c) => /^grep\b/.test(c.cmd.trim()) && c.out.some((l) => l.text.includes('ERROR')) },
  { key: 'find', label: t('Busca todos los archivos .js desde tu home', 'Find all .js files from your home'), hint: 'cd ~  →  find . -name "*.js"', test: (c) => /^find\b/.test(c.cmd.trim()) && c.out.some((l) => l.text.endsWith('.js')) },
  { key: 'mkdir', label: t('Crea una carpeta llamada mi-api', 'Create a folder called mi-api'), hint: 'mkdir mi-api', test: (c) => has(c.state, ['home', 'dev', 'mi-api']) || /^mkdir\s+mi-api/.test(c.cmd.trim()) },
  { key: 'kill', label: t('Hay un proceso colgado usando 99% de CPU. Encuéntralo (ps aux) y mátalo (kill)', 'A stuck process is using 99% CPU. Find it (ps aux) and kill it (kill)'), hint: 'ps aux  →  kill 4242', test: (c) => !c.state.procs.some((p) => p.pid === 4242) },
  { key: 'curl', label: t('Haz un request HTTP a tu API: curl localhost:3000/api/users', 'Make an HTTP request to your API: curl localhost:3000/api/users'), hint: 'curl localhost:3000/api/users', test: (c) => /^curl\b/.test(c.cmd.trim()) && c.out.some((l) => l.text.includes('200')) },
];

export default function TerminalSim({ labId }: SimProps) {
  const { tr, tx } = useLang();
  const [state, setState] = useState<TermState>(initialTerm);
  const [lines, setLines] = useState<(Line & { prompt?: string })[]>([
    { text: tx('Bienvenido a tu servidor Linux simulado 🐧  Escribe "help" para ver los comandos.', 'Welcome to your simulated Linux server 🐧  Type "help" to see the commands.'), cls: 'muted' },
  ]);
  const [input, setInput] = useState('');
  const [hIdx, setHIdx] = useState<number | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const box = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [lines]);

  const run = (cmd: string) => {
    const prompt = `${state.user}@${state.host}:${promptPath(state)}$`;
    const r = exec(state, cmd);
    setState(r.state);
    setLines((l) => (r.clear ? [] : [...l, { text: cmd, cls: 'cmd', prompt }, ...r.out]));
    const ctx = { state: r.state, cmd, out: r.out };
    setDone((d) => {
      const n = { ...d };
      GOALS.forEach((g) => {
        if (!n[g.key] && g.test(ctx)) n[g.key] = true;
      });
      return n;
    });
    setInput('');
    setHIdx(null);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') run(input);
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const h = state.history;
      if (!h.length) return;
      const i = hIdx === null ? h.length - 1 : Math.max(0, hIdx - 1);
      setHIdx(i);
      setInput(h[i]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const h = state.history;
      if (hIdx === null) return;
      const i = hIdx + 1;
      if (i >= h.length) {
        setHIdx(null);
        setInput('');
      } else {
        setHIdx(i);
        setInput(h[i]);
      }
    }
  };

  const nextGoal = GOALS.find((g) => !done[g.key]);

  return (
    <div className="sim stack">
      <div className="sim-title">🐧 {tx('Terminal Linux (simulada, puedes romper lo que quieras)', 'Linux terminal (simulated, break whatever you want)')}</div>
      <div className="terminal" ref={box} onClick={() => inputRef.current?.focus()}>
        {lines.map((l, i) =>
          l.cls === 'cmd' ? (
            <div key={i}>
              <span className="prompt">{l.prompt}</span> {l.text}
            </div>
          ) : (
            <div key={i} className={l.cls === 'err' ? 'err' : l.cls === 'muted' ? 'faint' : ''} style={{ whiteSpace: 'pre-wrap', color: l.cls === 'ok' ? '#ffd166' : undefined }}>
              {l.text}
            </div>
          ),
        )}
        <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
          <span className="prompt">{`${state.user}@${state.host}:`}<span className="path">{promptPath(state)}</span>$</span>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} spellCheck={false} autoCapitalize="off" autoComplete="off" aria-label="terminal" />
        </div>
      </div>
      {nextGoal && (
        <div className="small">
          💡 {tx('Pista para el siguiente objetivo:', 'Hint for the next goal:')} <span className="kbd">{nextGoal.hint}</span>
        </div>
      )}
      <Tasks labId={labId} items={GOALS.map((g) => ({ key: g.key, label: g.label, done: !!done[g.key] }))} />
      <div className="tiny faint">{tr(t('Atajos: ↑ y ↓ recorren tu historial de comandos (como en una terminal real).', 'Shortcuts: ↑ and ↓ walk through your command history (like a real terminal).'))}</div>
    </div>
  );
}
