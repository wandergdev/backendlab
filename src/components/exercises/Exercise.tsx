import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { CodeTest, Exercise as FullEx, ExerciseBase as Ex, Txt } from '../../types';
import { pickExercise, useStack } from '../../i18n/stack';
import { stripTypes } from '../../lib/ts';
import { useLang } from '../../i18n/lang';
import { CodeBlock } from '../visuals/CodeBlock';
import { highlight } from '../../lib/highlight';
import { freshDb, runQuery, sameResult, type QueryResult } from '../../lib/sql';
import { DataTable } from '../visuals/Visual';
import { Ic } from '../ui/Icon';

function shuffle<T>(arr: T[], seed: number): T[] {
  // Barajado determinista por ejercicio (no cambia en cada render).
  const a = [...arr];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const seedOf = (x: unknown) => {
  const s = JSON.stringify(x);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) + Math.floor(Math.random() * 1000);
};

export const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/;+$/, '').replace(/["“”]/g, '"');

type Props = { ex: FullEx; onResult: (correct: boolean) => void };

/** Pinta un ejercicio, lo corrige y muestra la explicación. Llama a onResult al pulsar "Continuar". */
export function Exercise({ ex: full, onResult }: Props) {
  const { tr, tx } = useLang();
  const { stack } = useStack();
  const ex = pickExercise(full, stack);
  const [state, setState] = useState<'answering' | 'right' | 'wrong'>('answering');
  const [ready, setReady] = useState(false);
  const [checker, setChecker] = useState<(() => boolean | Promise<boolean>) | null>(null);

  const register = (canCheck: boolean, fn: () => boolean | Promise<boolean>) => {
    setReady(canCheck);
    setChecker(() => fn);
  };

  const check = async () => {
    if (!checker) return;
    const ok = await checker();
    setState(ok ? 'right' : 'wrong');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'TEXTAREA') return;
      if (state === 'answering' && ready) check();
      else if (state !== 'answering') onResult(state === 'right');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const locked = state !== 'answering';
  const selfChecking = ex.type === 'match';

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="bold" style={{ fontSize: '1.15rem', lineHeight: 1.4 }}>{tr(ex.q)}</div>
      {'code' in ex && ex.code && typeof ex.code === 'object' && <CodeBlock snippet={ex.code} copy={false} />}
      <Body key={stack} ex={ex} locked={locked} register={register} onSelfResult={(ok) => setState(ok ? 'right' : 'wrong')} />
      {state === 'answering' && !selfChecking && (
        <button className="btn btn-primary btn-lg" onClick={check} disabled={!ready} style={{ alignSelf: 'flex-start' }}>
          {tx('Comprobar', 'Check')}
        </button>
      )}
      {locked && (
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`feedback ${state === 'right' ? 'ok' : 'bad'}`}>
          <div style={{ fontSize: '1.1rem', marginBottom: 4 }}><span className="ic">{state === 'right' ? <><Ic n="celebrate" size={22} color="var(--green)" /> {tx('¡Correcto!', 'Correct!')}</> : <><Ic n="repeat" size={22} color="var(--red)" /> {tx('Casi. Lo repetiremos más adelante.', 'Almost. We will repeat it later.')}</>}</span></div>
          <div style={{ fontWeight: 600 }}>{tr(ex.explain)}</div>
          <button className={`btn ${state === 'right' ? 'btn-green' : 'btn-red'} mt`} onClick={() => onResult(state === 'right')}>
            {tx('Continuar', 'Continue')} ▶
          </button>
        </motion.div>
      )}
    </div>
  );
}

type BodyProps = { ex: Ex; locked: boolean; register: (ready: boolean, fn: () => boolean | Promise<boolean>) => void; onSelfResult: (ok: boolean) => void };

function Body(p: BodyProps) {
  switch (p.ex.type) {
    case 'mcq':
      return <Mcq {...p} ex={p.ex} />;
    case 'tf':
      return <TrueFalse {...p} ex={p.ex} />;
    case 'order':
      return <Order {...p} ex={p.ex} />;
    case 'match':
      return <Match {...p} ex={p.ex} />;
    case 'fill':
      return <Fill {...p} ex={p.ex} />;
    case 'type':
      return <TypeIn {...p} ex={p.ex} />;
    case 'sql':
      return <SqlEx {...p} ex={p.ex} />;
    case 'code':
      return <CodeEx {...p} ex={p.ex} />;
  }
}

// ---------------------------------------------------------------------
function Mcq({ ex, locked, register }: BodyProps & { ex: Extract<Ex, { type: 'mcq' }> }) {
  const { tr } = useLang();
  const order = useMemo(() => shuffle(ex.options.map((_, i) => i), seedOf(ex.options)), [ex]);
  const [sel, setSel] = useState<number | null>(null);
  useEffect(() => register(sel !== null, () => sel === ex.answer), [sel]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (!locked && n >= 1 && n <= order.length && (e.target as HTMLElement)?.tagName !== 'INPUT') setSel(order[n - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [locked, order]);
  return (
    <div className="stack" style={{ gap: 8 }}>
      {order.map((i, k) => {
        const cls = locked ? (i === ex.answer ? 'correct' : i === sel ? 'wrong' : '') : i === sel ? 'selected' : '';
        return (
          <button key={i} className={`option ${cls}`} disabled={locked} onClick={() => setSel(i)}>
            <span className="opt-key">{k + 1}</span>
            <span>{tr(ex.options[i])}</span>
          </button>
        );
      })}
    </div>
  );
}

function TrueFalse({ ex, locked, register }: BodyProps & { ex: Extract<Ex, { type: 'tf' }> }) {
  const { tx } = useLang();
  const [sel, setSel] = useState<boolean | null>(null);
  useEffect(() => register(sel !== null, () => sel === ex.answer), [sel]);
  return (
    <div className="grid grid-2">
      {[true, false].map((v) => {
        const cls = locked ? (v === ex.answer ? 'correct' : v === sel ? 'wrong' : '') : v === sel ? 'selected' : '';
        return (
          <button key={String(v)} className={`option ${cls}`} disabled={locked} onClick={() => setSel(v)} style={{ justifyContent: 'center', fontSize: '1.1rem', padding: 18 }}>
            <span className="ic">{v ? <><Ic n="checkCircle" size={22} color="var(--green)" /> {tx('Verdadero', 'True')}</> : <><Ic n="xCircle" size={22} color="var(--red)" /> {tx('Falso', 'False')}</>}</span>
          </button>
        );
      })}
    </div>
  );
}

function Order({ ex, locked, register }: BodyProps & { ex: Extract<Ex, { type: 'order' }> }) {
  const { tr, tx } = useLang();
  const pool = useMemo(() => {
    let s = shuffle(ex.items.map((_, i) => i), seedOf(ex.items));
    if (s.every((v, i) => v === i)) s = [...s.slice(1), s[0]];
    return s;
  }, [ex]);
  const [picked, setPicked] = useState<number[]>([]);
  useEffect(() => register(picked.length === ex.items.length, () => picked.every((v, i) => v === i)), [picked]);
  return (
    <div className="stack">
      <div className="panel stack" style={{ minHeight: 60, gap: 6 }}>
        {picked.length === 0 && <span className="faint small">{tx('Toca los pasos en el orden correcto…', 'Tap the steps in the right order…')}</span>}
        {picked.map((i, k) => (
          <motion.button
            layout
            key={i}
            className={`option ${locked ? (i === k ? 'correct' : 'wrong') : ''}`}
            disabled={locked}
            onClick={() => setPicked((p) => p.filter((x) => x !== i))}
            style={{ padding: '8px 12px' }}
          >
            <span className="opt-key">{k + 1}</span> {tr(ex.items[i])}
          </motion.button>
        ))}
      </div>
      <div className="stack" style={{ gap: 6 }}>
        {pool.filter((i) => !picked.includes(i)).map((i) => (
          <motion.button layout key={i} className="option" disabled={locked} onClick={() => setPicked((p) => [...p, i])} style={{ padding: '8px 12px' }}>
            {tr(ex.items[i])}
          </motion.button>
        ))}
      </div>
      {locked && picked.some((v, i) => v !== i) && (
        <div className="small">
          <b>{tx('Orden correcto:', 'Correct order:')}</b>
          <ol style={{ margin: '4px 0 0', paddingLeft: 22 }}>{ex.items.map((it, i) => <li key={i}>{tr(it)}</li>)}</ol>
        </div>
      )}
    </div>
  );
}

const MATCH_COLORS = ['#7c6cff', '#00d29a', '#ff9f43', '#4cc9f0', '#f78fb3', '#ffd166', '#a29bfe', '#ff6b81'];

function Match({ ex, locked, onSelfResult }: BodyProps & { ex: Extract<Ex, { type: 'match' }> }) {
  const { tr } = useLang();
  const right = useMemo(() => shuffle(ex.pairs.map((_, i) => i), seedOf(ex.pairs)), [ex]);
  const [left, setLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [bad, setBad] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const pickRight = (i: number) => {
    if (left === null || locked) return;
    if (i === left) {
      const m = [...matched, i];
      setMatched(m);
      setLeft(null);
      setBad(null);
      if (m.length === ex.pairs.length) setTimeout(() => onSelfResult(mistakes === 0), 300);
    } else {
      setBad(i);
      setMistakes((x) => x + 1);
      setTimeout(() => setBad(null), 450);
    }
  };
  const colorOf = (i: number) => MATCH_COLORS[matched.indexOf(i) % MATCH_COLORS.length];

  return (
    <div className="grid grid-2" style={{ gap: 10 }}>
      <div className="stack" style={{ gap: 8 }}>
        {ex.pairs.map(([l], i) => (
          <button key={i} className={`option ${left === i ? 'selected' : ''}`} disabled={matched.includes(i) || locked} onClick={() => setLeft(i)} style={matched.includes(i) ? { borderColor: colorOf(i), opacity: 0.75 } : undefined}>
            {matched.includes(i) && <Ic n="check" size={16} color="var(--green)" weight="bold" />}{tr(l)}
          </button>
        ))}
      </div>
      <div className="stack" style={{ gap: 8 }}>
        {right.map((i) => (
          <button key={i} className={`option ${bad === i ? 'wrong shake' : ''}`} disabled={matched.includes(i) || locked} onClick={() => pickRight(i)} style={matched.includes(i) ? { borderColor: colorOf(i), opacity: 0.75 } : undefined}>
            {matched.includes(i) && <Ic n="check" size={16} color="var(--green)" weight="bold" />}{tr(ex.pairs[i][1])}
          </button>
        ))}
      </div>
    </div>
  );
}

function Fill({ ex, locked, register }: BodyProps & { ex: Extract<Ex, { type: 'fill' }> }) {
  const { tx } = useLang();
  const chips = useMemo(() => shuffle([...ex.blanks, ...ex.distractors].map((c, i) => ({ c, i })), seedOf(ex.template)), [ex]);
  const [vals, setVals] = useState<(number | null)[]>(() => ex.blanks.map(() => null));
  useEffect(() => register(vals.every((v) => v !== null), () => vals.every((v, i) => v !== null && chips.find((c) => c.i === v)!.c === ex.blanks[i])), [vals]);
  const parts = ex.template.split('___');
  const place = (chipIdx: number) => {
    const slot = vals.findIndex((v) => v === null);
    if (slot === -1 || locked) return;
    setVals((v) => v.map((x, i) => (i === slot ? chipIdx : x)));
  };
  const lang = ex.lang ?? 'js';
  return (
    <div className="stack">
      <pre className="code" style={{ whiteSpace: 'pre-wrap' }}>
        {parts.map((part, i) => (
          <span key={i}>
            {highlight(part, lang)}
            {i < parts.length - 1 && (
              <span
                className={`blank ${vals[i] === null ? 'empty' : ''}`}
                onClick={() => !locked && setVals((v) => v.map((x, j) => (j === i ? null : x)))}
                style={locked ? { borderColor: chips.find((c) => c.i === vals[i])?.c === ex.blanks[i] ? 'var(--green)' : 'var(--red)' } : undefined}
              >
                {vals[i] === null ? '____' : chips.find((c) => c.i === vals[i])!.c}
              </span>
            )}
          </span>
        ))}
      </pre>
      <div className="row" style={{ gap: 8 }}>
        {chips.map((c) => (
          <button key={c.i} className="chip" disabled={locked || vals.includes(c.i)} onClick={() => place(c.i)}>
            {c.c}
          </button>
        ))}
      </div>
      {locked && <div className="small mono">{tx('Respuesta:', 'Answer:')} {ex.blanks.join('  ·  ')}</div>}
    </div>
  );
}

function TypeIn({ ex, locked, register }: BodyProps & { ex: Extract<Ex, { type: 'type' }> }) {
  const { tx } = useLang();
  const [v, setV] = useState('');
  useEffect(() => register(v.trim().length > 0, () => ex.accept.some((a) => normalize(a) === normalize(v))), [v]);
  return (
    <div className="stack">
      <input className="input mono" autoFocus value={v} disabled={locked} onChange={(e) => setV(e.target.value)} placeholder={ex.placeholder ?? tx('Escribe tu respuesta…', 'Type your answer…')} style={{ fontSize: '1.05rem' }} />
      {locked && <div className="small mono">{tx('Respuesta esperada:', 'Expected answer:')} {ex.accept[0]}</div>}
    </div>
  );
}

function SqlEx({ ex, locked, register }: BodyProps & { ex: Extract<Ex, { type: 'sql' }> }) {
  const { tr, tx } = useLang();
  const [sql, setSql] = useState('');
  const [preview, setPreview] = useState<QueryResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const evaluate = async (q: string) => {
    const db = await freshDb();
    try {
      const r = runQuery(db, q);
      const after = ex.check ? runQuery(db, ex.check) : r;
      return { r, after };
    } finally {
      db.close();
    }
  };

  const tryRun = async () => {
    setError(null);
    try {
      const { r } = await evaluate(sql);
      setPreview(r);
    } catch (e) {
      setPreview(null);
      setError((e as Error).message);
    }
  };

  useEffect(
    () =>
      register(sql.trim().length > 0, async () => {
        try {
          const mine = await evaluate(sql);
          const sol = await evaluate(ex.solution);
          const ordered = /order\s+by/i.test(ex.solution);
          return sameResult(mine.after[mine.after.length - 1], sol.after[sol.after.length - 1], ordered);
        } catch (e) {
          setError((e as Error).message);
          return false;
        }
      }),
    [sql],
  );

  return (
    <div className="stack">
      <textarea className="textarea" value={sql} onChange={(e) => setSql(e.target.value)} disabled={locked} placeholder="SELECT …" spellCheck={false} style={{ minHeight: 90 }} />
      <div className="row">
        <button className="btn btn-sm" onClick={tryRun} disabled={!sql.trim()}>▶ {tx('Probar (ver resultado)', 'Try (see result)')}</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowHint((h) => !h)}><Ic n="bulb" size={18} /> {tx('Pista', 'Hint')}</button>
        <span className="tiny faint">{tx('Tablas: users, orders, products, accounts', 'Tables: users, orders, products, accounts')}</span>
      </div>
      {showHint && <div className="tip small">{tr(ex.hint)}</div>}
      {error && <div className="feedback bad small mono">{error}</div>}
      {preview?.map((r, i) => <DataTable key={i} name={`${r.values.length} rows`} columns={r.columns} rows={r.values} />)}
      {locked && <CodeBlock snippet={{ lang: 'sql', src: ex.solution, caption: { es: 'Una solución posible', en: 'One possible solution' } }} copy={false} />}
    </div>
  );
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export type TestResult = { ok: boolean; got: string; label: Txt };

export async function runCodeTests(code: string, fn: string, tests: CodeTest[]): Promise<TestResult[] | string> {
  let f: (...a: unknown[]) => unknown;
  try {
    const js = await stripTypes(code);
    f = new Function(`${js}
;return typeof ${fn} === 'function' ? ${fn} : undefined;`)();
    if (typeof f !== 'function') return `No encuentro la función "${fn}"`;
  } catch (e) {
    return (e as Error).message;
  }
  const out: TestResult[] = [];
  for (const tc of tests) {
    let got: unknown;
    try {
      got = tc.call ? await new Function(fn, `return (${tc.call});`)(f) : await f(...structuredClone(tc.args ?? []));
    } catch (e) {
      got = `Error: ${(e as Error).message}`;
    }
    const label = tc.label ?? (tc.call ? `${tc.call} → ${JSON.stringify(tc.expect)}` : `${fn}(${(tc.args ?? []).map((a) => JSON.stringify(a)).join(', ')}) → ${JSON.stringify(tc.expect)}`);
    out.push({ ok: deepEqual(got, tc.expect), got: JSON.stringify(got) ?? String(got), label });
  }
  return out;
}

function CodeEx({ ex, locked, register }: BodyProps & { ex: Extract<Ex, { type: 'code' }> }) {
  const { tr, tx } = useLang();
  const { isDotnet } = useStack();
  const [code, setCode] = useState(ex.starter);
  const [res, setRes] = useState<TestResult[] | string | null>(null);
  useEffect(
    () =>
      register(code.trim().length > 0, async () => {
        const r = await runCodeTests(code, ex.fn, ex.tests);
        setRes(r);
        return Array.isArray(r) && r.length > 0 && r.every((x) => x.ok);
      }),
    [code],
  );
  return (
    <div className="stack">
      <div className="tiny faint">
        <Ic n="file" size={16} color="#3178c6" /> {tx('Escribe en TypeScript: se ejecuta de verdad en tu navegador.', 'Write in TypeScript: it really runs in your browser.')}
        {isDotnet && ex.csharp && ` ${tx('Al terminar verás la versión en C#.', 'When done you will see the C# version.')}`}
      </div>
      <textarea
        className="textarea"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        disabled={locked}
        spellCheck={false}
        style={{ minHeight: 170 }}
        onKeyDown={(e) => {
          if (e.key === 'Tab') {
            e.preventDefault();
            const el = e.currentTarget;
            const s = el.selectionStart;
            setCode(code.slice(0, s) + '  ' + code.slice(el.selectionEnd));
            requestAnimationFrame(() => (el.selectionStart = el.selectionEnd = s + 2));
          }
        }}
      />
      <div className="row">
        <button className="btn btn-sm" onClick={async () => setRes(await runCodeTests(code, ex.fn, ex.tests))}>▶ {tx('Correr pruebas', 'Run tests')}</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setCode(ex.starter)}><Ic n="reset" size={18} /> {tx('Reiniciar', 'Reset')}</button>
      </div>
      {typeof res === 'string' && <div className="feedback bad small mono">{res}</div>}
      {Array.isArray(res) && (
        <div className="stack" style={{ gap: 4 }}>
          {res.map((r, i) => (
            <div key={i} className="mono small" style={{ color: r.ok ? 'var(--green)' : 'var(--red)' }}>
              <Ic n={r.ok ? 'checkCircle' : 'xCircle'} size={18} /> {tr(r.label)} {!r.ok && <span className="faint">({tx('recibido', 'got')}: {r.got})</span>}
            </div>
          ))}
        </div>
      )}
      {locked && <CodeBlock snippet={{ lang: 'ts', src: ex.solution, caption: { es: 'Una solución posible en TypeScript', en: 'One possible solution in TypeScript' }, ...(ex.csharp ? { dotnet: { lang: 'csharp', src: ex.csharp, caption: { es: 'La misma idea en C#', en: 'The same idea in C#' } } } : {}) }} copy={false} />}
    </div>
  );
}
