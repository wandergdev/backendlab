import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { t, type L } from '../../types';
import { useLang } from '../../i18n/lang';
import { CodeBlock } from '../visuals/CodeBlock';
import { DataTable } from '../visuals/Visual';
import { Tasks, type SimProps } from './SimHost';

// =====================================================================
// ¿Compila? Entrena el ojo para ver lo que el compilador ve
// =====================================================================
type Case = { code: string; ok: boolean; error?: string; why: L };

const TS_CASES: Case[] = [
  { code: 'let age: number = "25";', ok: false, error: "Type 'string' is not assignable to type 'number'.", why: t('"25" entre comillas es texto, no número.', '"25" in quotes is text, not a number.') },
  { code: 'const names: string[] = ["Ana", "Luis"];\nnames.push("Sara");', ok: true, why: t('Un array de strings acepta otro string.', 'An array of strings accepts another string.') },
  { code: 'interface User { id: number; name: string }\nconst u: User = { id: 1 };', ok: false, error: "Property 'name' is missing in type '{ id: number; }' but required in type 'User'.", why: t('La interfaz exige name y no lo pusimos.', 'The interface requires name and we left it out.') },
  { code: 'function add(a: number, b: number): number {\n  return a + b;\n}\nadd(2, 3);', ok: true, why: t('Tipos correctos en los argumentos y en el retorno.', 'Correct types in the arguments and the return.') },
  { code: 'function greet(name?: string) {\n  return name.toUpperCase();\n}', ok: false, error: "'name' is possibly 'undefined'.", why: t('name es opcional: puede no venir. Usa name?.toUpperCase() o un valor por defecto.', 'name is optional: it may be missing. Use name?.toUpperCase() or a default value.') },
  { code: "type Status = 'ok' | 'error';\nconst s: Status = 'pending';", ok: false, error: "Type '\"pending\"' is not assignable to type 'Status'.", why: t('Un tipo unión solo acepta los valores listados.', 'A union type only accepts the listed values.') },
  { code: 'async function load(): Promise<number> {\n  return 42;\n}', ok: true, why: t('Una función async envuelve el valor en una Promise automáticamente.', 'An async function wraps the value in a Promise automatically.') },
  { code: 'const user = { name: "Ana" };\nuser.email = "ana@mail.com";', ok: false, error: "Property 'email' does not exist on type '{ name: string; }'.", why: t('TS infiere la forma del objeto: no puedes inventarle propiedades después.', 'TS infers the object shape: you cannot invent properties later.') },
];

const CS_CASES: Case[] = [
  { code: 'int age = "25";', ok: false, error: "CS0029: Cannot implicitly convert type 'string' to 'int'", why: t('"25" es string; un int necesita un número (o int.Parse).', '"25" is a string; an int needs a number (or int.Parse).') },
  { code: 'var names = new List<string> { "Ana", "Luis" };\nnames.Add("Sara");', ok: true, why: t('var infiere List<string>; Add acepta un string.', 'var infers List<string>; Add accepts a string.') },
  { code: 'public record User(int Id, string Name);\nvar u = new User(1);', ok: false, error: "CS7036: There is no argument given that corresponds to the required parameter 'Name'", why: t('El record exige Id y Name en el constructor.', 'The record requires Id and Name in the constructor.') },
  { code: 'string? name = null;\nint length = name.Length;', ok: false, error: "CS8602: Dereference of a possibly null reference. (advertencia)", why: t('Con nullables activados, el compilador avisa: name puede ser null. Usa name?.Length ?? 0.', 'With nullables on, the compiler warns: name may be null. Use name?.Length ?? 0.') },
  { code: 'var adults = users.Where(u => u.Age >= 18).ToList();', ok: true, why: t('LINQ: filtra con una lambda y materializa en una lista.', 'LINQ: filters with a lambda and materializes into a list.') },
  { code: 'public async Task<int> LoadAsync()\n{\n    return 42;\n}', ok: true, why: t('Compila (con una advertencia CS1998: no hay await). async envuelve el 42 en un Task<int>.', 'Compiles (with a CS1998 warning: no await). async wraps 42 in a Task<int>.') },
  { code: 'var x = 5;\nx = "hola";', ok: false, error: "CS0029: Cannot implicitly convert type 'string' to 'int'", why: t('var NO es dinámico: x quedó como int para siempre.', 'var is NOT dynamic: x became an int forever.') },
  { code: 'public class Product\n{\n    public required string Name { get; init; }\n}\nvar p = new Product();', ok: false, error: "CS9035: Required member 'Product.Name' must be set in the object initializer", why: t('required obliga a dar Name al crear el objeto.', 'required forces you to set Name when creating the object.') },
];

export function CompileQuiz({ labId, lang = 'ts' }: SimProps & { lang?: 'ts' | 'csharp' }) {
  const { tr, tx } = useLang();
  const cases = useMemo(() => [...(lang === 'ts' ? TS_CASES : CS_CASES)].sort(() => Math.random() - 0.5), [lang]);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<boolean | null>(null);
  const [right, setRight] = useState(0);
  const [seen, setSeen] = useState(0);
  const c = cases[i % cases.length];
  const choose = (v: boolean) => {
    if (pick !== null) return;
    setPick(v);
    setSeen((s) => s + 1);
    if (v === c.ok) setRight((r) => r + 1);
  };
  return (
    <div className="sim stack">
      <div className="sim-title">🧐 {tx('¿Compila o no compila?', 'Does it compile or not?')} <span className="pill purple">{lang === 'ts' ? 'TypeScript' : 'C#'}</span></div>
      <div className="small muted">{tx('Mira el código como lo mira el compilador. Decide y luego lee el mensaje de error real.', 'Look at the code the way the compiler does. Decide, then read the real error message.')}</div>
      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <CodeBlock snippet={{ lang, src: c.code }} copy={false} />
      </motion.div>
      <div className="grid grid-2">
        <button className={`option ${pick !== null && c.ok ? 'correct' : pick === true ? 'wrong' : ''}`} disabled={pick !== null} onClick={() => choose(true)} style={{ justifyContent: 'center' }}>✅ {tx('Compila', 'Compiles')}</button>
        <button className={`option ${pick !== null && !c.ok ? 'correct' : pick === false ? 'wrong' : ''}`} disabled={pick !== null} onClick={() => choose(false)} style={{ justifyContent: 'center' }}>❌ {tx('Error de compilación', 'Compile error')}</button>
      </div>
      {pick !== null && (
        <div className={`feedback ${pick === c.ok ? 'ok' : 'bad'}`}>
          {c.error && <div className="mono small" style={{ color: 'var(--red)', marginBottom: 6 }}>⚠ {c.error}</div>}
          <div>{tr(c.why)}</div>
          <button className="btn btn-primary btn-sm mt" onClick={() => { setPick(null); setI((x) => x + 1); }}>{tx('Siguiente', 'Next')} ▶</button>
        </div>
      )}
      <div className="small">✅ {right} / {seen}</div>
      <Tasks labId={labId} items={[{ key: 'six', label: t('Acierta 6 casos', 'Get 6 cases right'), done: right >= 6 }, { key: 'all', label: t('Revisa los 8 casos (repetir es aprender)', 'Review all 8 cases (repeating is learning)'), done: seen >= 8 }]} />
    </div>
  );
}

// =====================================================================
// LINQ visual (y su equivalente en TypeScript)
// =====================================================================
type U = { name: string; age: number; city: string };
const PEOPLE: U[] = [
  { name: 'Ahmed', age: 28, city: 'Alexandria' },
  { name: 'Sara', age: 24, city: 'Madrid' },
  { name: 'Lucía', age: 31, city: 'Santo Domingo' },
  { name: 'Carlos', age: 17, city: 'Bogotá' },
  { name: 'Ali', age: 35, city: 'Cairo' },
  { name: 'Ana', age: 22, city: 'Madrid' },
];
type Op = { id: string; cs: string; ts: string; label: L; apply: (x: unknown[]) => unknown[] | number; kind: 'filter' | 'sort' | 'map' | 'take' | 'agg' };
const OPS: Op[] = [
  { id: 'adults', kind: 'filter', cs: '.Where(u => u.Age >= 18)', ts: '.filter(u => u.age >= 18)', label: t('Solo mayores de edad', 'Adults only'), apply: (x) => (x as U[]).filter((u) => u.age >= 18) },
  { id: 'madrid', kind: 'filter', cs: '.Where(u => u.City == "Madrid")', ts: '.filter(u => u.city === "Madrid")', label: t('Solo de Madrid', 'Only from Madrid'), apply: (x) => (x as U[]).filter((u) => u.city === 'Madrid') },
  { id: 'byName', kind: 'sort', cs: '.OrderBy(u => u.Name)', ts: '.sort((a, b) => a.name.localeCompare(b.name))', label: t('Ordenar por nombre', 'Sort by name'), apply: (x) => [...(x as U[])].sort((a, b) => a.name.localeCompare(b.name)) },
  { id: 'byAge', kind: 'sort', cs: '.OrderByDescending(u => u.Age)', ts: '.sort((a, b) => b.age - a.age)', label: t('Mayor edad primero', 'Oldest first'), apply: (x) => [...(x as U[])].sort((a, b) => b.age - a.age) },
  { id: 'take2', kind: 'take', cs: '.Take(2)', ts: '.slice(0, 2)', label: t('Tomar 2', 'Take 2'), apply: (x) => x.slice(0, 2) },
  { id: 'names', kind: 'map', cs: '.Select(u => u.Name)', ts: '.map(u => u.name)', label: t('Solo el nombre', 'Name only'), apply: (x) => (x as U[]).map((u) => (typeof u === 'object' ? u.name : u)) },
  { id: 'count', kind: 'agg', cs: '.Count()', ts: '.length', label: t('Contar', 'Count'), apply: (x) => x.length },
];

export function LinqViz({ labId }: SimProps) {
  const { tr, tx } = useLang();
  const [chain, setChain] = useState<string[]>([]);
  const [used, setUsed] = useState<Set<string>>(new Set());
  const steps = useMemo(() => {
    const out: { op?: Op; data: unknown[] | number }[] = [{ data: PEOPLE }];
    let cur: unknown[] | number = PEOPLE;
    for (const id of chain) {
      const op = OPS.find((o) => o.id === id)!;
      if (typeof cur === 'number') break;
      cur = op.apply(cur);
      out.push({ op, data: cur });
    }
    return out;
  }, [chain]);
  const ended = typeof steps[steps.length - 1].data === 'number';
  const mapped = chain.includes('names');
  const add = (id: string) => {
    if (ended) return;
    const op = OPS.find((o) => o.id === id)!;
    if (mapped && (op.kind === 'filter' || op.kind === 'sort')) return;
    setChain((c) => [...c, id]);
    setUsed((u) => new Set(u).add(id));
  };
  const render = (d: unknown[] | number) => {
    if (typeof d === 'number') return <div className="bold" style={{ fontSize: '1.6rem', color: 'var(--green)' }}>{d}</div>;
    if (d.length && typeof d[0] === 'string') return <div className="row" style={{ gap: 4 }}>{(d as string[]).map((n) => <span key={n} className="pill blue">"{n}"</span>)}</div>;
    return <DataTable name="" columns={['Name', 'Age', 'City']} rows={(d as U[]).map((u) => [u.name, u.age, u.city])} />;
  };
  return (
    <div className="sim stack">
      <div className="sim-title">🔗 LINQ ↔ {tx('métodos de array en TypeScript', 'TypeScript array methods')}</div>
      <div className="small muted">{tx('Construye una cadena de operaciones y mira los datos transformarse paso a paso. Es la misma idea en C# y en TS.', 'Build a chain of operations and watch the data transform step by step. Same idea in C# and TS.')}</div>
      <div className="row" style={{ gap: 6 }}>
        {OPS.map((o) => (
          <button key={o.id} className="btn btn-sm" disabled={ended || (mapped && (o.kind === 'filter' || o.kind === 'sort'))} onClick={() => add(o.id)}>
            ➕ {tr(o.label)}
          </button>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={() => setChain([])}>↺</button>
      </div>
      <div className="grid grid-2">
        <CodeBlock copy={false} snippet={{ lang: 'csharp', src: 'var result = users\n' + chain.map((id) => '    ' + OPS.find((o) => o.id === id)!.cs).join('\n') + (chain.length && !ended ? '\n    .ToList();' : ';') }} />
        <CodeBlock copy={false} snippet={{ lang: 'ts', src: 'const result = users\n' + chain.map((id) => '  ' + OPS.find((o) => o.id === id)!.ts).join('\n') + ';' }} />
      </div>
      <div className="stack" style={{ gap: 8 }}>
        <AnimatePresence initial={false}>
          {steps.map((s, i) => (
            <motion.div key={i + (s.op?.id ?? 'src')} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="panel">
              <div className="tiny bold mono" style={{ color: 'var(--primary-2)', marginBottom: 4 }}>{s.op ? `↓ ${s.op.cs}` : 'users'}</div>
              {render(s.data)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <Tasks
        labId={labId}
        items={[
          { key: 'where', label: t('Filtra con Where (filter)', 'Filter with Where (filter)'), done: used.has('adults') || used.has('madrid') },
          { key: 'order', label: t('Ordena con OrderBy (sort)', 'Sort with OrderBy (sort)'), done: used.has('byName') || used.has('byAge') },
          { key: 'select', label: t('Proyecta con Select (map)', 'Project with Select (map)'), done: used.has('names') },
          { key: 'chain4', label: t('Encadena 4 operaciones', 'Chain 4 operations'), done: chain.length >= 4 },
        ]}
      />
    </div>
  );
}
