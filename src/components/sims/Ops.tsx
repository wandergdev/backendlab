import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { t, type L } from '../../types';
import { useLang } from '../../i18n/lang';
import { CodeBlock } from '../visuals/CodeBlock';
import { Tasks, type SimProps } from './SimHost';
import { useStack } from '../../i18n/stack';
import { stripTypes } from '../../lib/ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// =====================================================================
// Test runner: escribe código, corre pruebas, mira rojo → verde
// =====================================================================
const TAX_TESTS: { label: string; args: number[]; expect: number }[] = [
  { label: 'calculateTax(100) → 15', args: [100], expect: 15 },
  { label: 'calculateTax(0) → 0', args: [0], expect: 0 },
  { label: 'calculateTax(-50) → 0', args: [-50], expect: 0 },
  { label: 'calculateTax(19.99) → 3', args: [19.99], expect: 3 },
];

export function TestRunner({ labId }: SimProps) {
  const { tx } = useLang();
  const [code, setCode] = useState('// Regla: el impuesto es el 15%.\n// Montos negativos o cero no pagan impuesto.\n// Redondea a 2 decimales.\nfunction calculateTax(amount: number): number {\n  return amount * 0.15;\n}');
  const [results, setResults] = useState<(null | { ok: boolean; got: string })[]>(TAX_TESTS.map(() => null));
  const [busy, setBusy] = useState(false);
  const [sawRed, setSawRed] = useState(false);
  const [allGreen, setAllGreen] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setErr(null);
    setResults(TAX_TESTS.map(() => null));
    let fn: ((n: number) => number) | null = null;
    try {
      fn = new Function(`${await stripTypes(code)}\nreturn calculateTax;`)();
    } catch (e) {
      setErr(String((e as Error).message));
      setBusy(false);
      return;
    }
    const out: { ok: boolean; got: string }[] = [];
    for (let i = 0; i < TAX_TESTS.length; i++) {
      await sleep(350);
      let got: unknown;
      try {
        got = fn!(TAX_TESTS[i].args[0]);
      } catch (e) {
        got = `Error: ${(e as Error).message}`;
      }
      const ok = typeof got === 'number' && Math.abs(got - TAX_TESTS[i].expect) < 1e-9;
      out.push({ ok, got: String(got) });
      setResults((r) => r.map((x, j) => (j === i ? { ok, got: String(got) } : x)));
    }
    if (out.some((r) => !r.ok)) setSawRed(true);
    if (out.every((r) => r.ok)) setAllGreen(true);
    setBusy(false);
  };

  return (
    <div className="sim stack">
      <div className="sim-title">🧪 {tx('Corre las pruebas, mira lo que falla, arréglalo', 'Run the tests, see what fails, fix it')}</div>
      <div className="grid grid-2">
        <textarea className="textarea" value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} style={{ minHeight: 200 }} />
        <div className="stack" style={{ gap: 6 }}>
          {TAX_TESTS.map((tc, i) => {
            const r = results[i];
            return (
              <motion.div key={i} animate={{ scale: r ? [1.04, 1] : 1 }} className="mono small" style={{ padding: '8px 10px', borderRadius: 10, border: `2px solid ${r ? (r.ok ? 'var(--green)' : 'var(--red)') : 'var(--border)'}`, background: 'var(--surface)' }}>
                {r ? (r.ok ? '✅' : '❌') : '⚪'} {tc.label}
                {r && !r.ok && <div className="tiny" style={{ color: 'var(--red)' }}>{tx('recibido:', 'received:')} {r.got}</div>}
              </motion.div>
            );
          })}
          <button className="btn btn-primary" onClick={run} disabled={busy}>▶ {tx('Correr pruebas', 'Run tests')}</button>
          {err && <div className="feedback bad small mono">{err}</div>}
        </div>
      </div>
      <details className="small">
        <summary className="bold" style={{ cursor: 'pointer' }}>💡 {tx('Ver una pista', 'Show a hint')}</summary>
        <CodeBlock snippet={{ lang: 'js', src: 'if (amount <= 0) return 0;\nreturn Math.round(amount * 0.15 * 100) / 100;' }} />
      </details>
      <Tasks
        labId={labId}
        items={[
          { key: 'red', label: t('Corre las pruebas con el código original y mira las que fallan (rojo)', 'Run the tests on the original code and see the failing ones (red)'), done: sawRed },
          { key: 'green', label: t('Arregla la función hasta que las 4 pruebas pasen (verde)', 'Fix the function until all 4 tests pass (green)'), done: allGreen },
        ]}
      />
    </div>
  );
}

// =====================================================================
// La pirámide de pruebas
// =====================================================================
type Level = 'unit' | 'integration' | 'e2e';
const TEST_CASES: { text: L; level: Level }[] = [
  { text: t('calculateTax(100) devuelve 15', 'calculateTax(100) returns 15'), level: 'unit' },
  { text: t('isValidEmail("hola") devuelve false', 'isValidEmail("hola") returns false'), level: 'unit' },
  { text: t('formatPrice(5) devuelve "$5.00"', 'formatPrice(5) returns "$5.00"'), level: 'unit' },
  { text: t('POST /api/users guarda el usuario en la base de datos y responde 201', 'POST /api/users saves the user in the database and returns 201'), level: 'integration' },
  { text: t('El repositorio de pedidos lee bien desde PostgreSQL', 'The orders repository reads correctly from PostgreSQL'), level: 'integration' },
  { text: t('Un usuario abre el navegador, se registra, inicia sesión y compra', 'A user opens the browser, signs up, logs in and buys'), level: 'e2e' },
];

export function PyramidSim({ labId }: SimProps) {
  const { tr, tx } = useLang();
  const order = useMemo(() => TEST_CASES.map((_, i) => i).sort(() => Math.random() - 0.5), []);
  const [placed, setPlaced] = useState<Record<number, Level>>({});
  const [wrong, setWrong] = useState<number | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const levels: { id: Level; label: string; width: string; color: string; desc: string }[] = [
    { id: 'e2e', label: 'E2E', width: '40%', color: 'var(--red)', desc: tx('pocas · lentas · caras', 'few · slow · expensive') },
    { id: 'integration', label: tx('Integración', 'Integration'), width: '70%', color: 'var(--yellow)', desc: tx('algunas · medias', 'some · medium') },
    { id: 'unit', label: tx('Unitarias', 'Unit'), width: '100%', color: 'var(--green)', desc: tx('muchas · rápidas · baratas', 'many · fast · cheap') },
  ];
  const drop = (lvl: Level) => {
    if (sel === null) return;
    if (TEST_CASES[sel].level === lvl) {
      setPlaced((p) => ({ ...p, [sel]: lvl }));
      setSel(null);
      setWrong(null);
    } else setWrong(sel);
  };
  const remaining = order.filter((i) => !(i in placed));
  return (
    <div className="sim stack">
      <div className="sim-title">🔺 {tx('Elige una prueba y colócala en su piso de la pirámide', 'Pick a test and place it on its pyramid floor')}</div>
      <div className="stack" style={{ gap: 6 }}>
        {remaining.map((i) => (
          <button key={i} className={`option ${sel === i ? 'selected' : ''} ${wrong === i ? 'wrong shake' : ''}`} onClick={() => { setSel(i); setWrong(null); }} style={{ padding: '8px 12px' }}>
            🧪 {tr(TEST_CASES[i].text)}
          </button>
        ))}
        {!remaining.length && <div className="feedback ok">🎉 {tx('¡Pirámide completa! Muchas unitarias abajo, pocas E2E arriba.', 'Pyramid complete! Many unit tests at the bottom, few E2E at the top.')}</div>}
      </div>
      <div className="stack" style={{ alignItems: 'center', gap: 6 }}>
        {levels.map((l) => (
          <button key={l.id} onClick={() => drop(l.id)} style={{ width: l.width, minHeight: 56, borderRadius: 12, border: `3px solid ${l.color}`, background: `color-mix(in srgb, ${l.color} 14%, var(--surface))`, cursor: sel !== null ? 'pointer' : 'default', padding: 8 }}>
            <div className="bold">{l.label} <span className="tiny muted">({l.desc})</span></div>
            <div className="tiny">{Object.entries(placed).filter(([, v]) => v === l.id).map(([k]) => tr(TEST_CASES[Number(k)].text)).join(' · ')}</div>
          </button>
        ))}
      </div>
      <Tasks labId={labId} items={[{ key: 'all', label: t('Clasifica las 6 pruebas correctamente', 'Classify all 6 tests correctly'), done: !remaining.length }]} />
    </div>
  );
}

// =====================================================================
// Docker: la receta y la caja
// =====================================================================
const DOCKER_NODE = [
  { line: 'FROM node:20', why: t('Empieza desde una imagen que ya trae Node.js 20', 'Start from an image that already has Node.js 20') },
  { line: 'WORKDIR /app', why: t('Crea y entra a la carpeta /app dentro del contenedor', 'Create and enter the /app folder inside the container') },
  { line: 'COPY package*.json ./', why: t('Copia primero solo la lista de dependencias', 'Copy only the dependency list first') },
  { line: 'RUN npm install', why: t('Instala las dependencias (esta capa se reutiliza si no cambian)', 'Install dependencies (this layer is reused if they do not change)') },
  { line: 'COPY . .', why: t('Copia el resto de tu código', 'Copy the rest of your code') },
  { line: 'CMD ["node", "server.js"]', why: t('El comando que corre al arrancar el contenedor', 'The command that runs when the container starts') },
];

const DOCKER_DOTNET = [
  { line: 'FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build', why: t('Etapa 1: una imagen con el SDK de .NET para compilar', 'Stage 1: an image with the .NET SDK to compile') },
  { line: 'WORKDIR /src', why: t('Carpeta de trabajo para el código fuente', 'Working folder for the source code') },
  { line: 'COPY *.csproj ./', why: t('Copia primero solo el proyecto (la lista de paquetes NuGet)', 'Copy only the project first (the NuGet package list)') },
  { line: 'RUN dotnet restore', why: t('Descarga los paquetes NuGet (capa reutilizable)', 'Downloads NuGet packages (reusable layer)') },
  { line: 'COPY . .', why: t('Copia el resto del código', 'Copy the rest of the code') },
  { line: 'RUN dotnet publish -c Release -o /app', why: t('Compila en modo Release hacia /app', 'Compiles in Release mode into /app') },
  { line: 'FROM mcr.microsoft.com/dotnet/aspnet:10.0', why: t('Etapa 2: imagen pequeña, solo el runtime de ASP.NET Core', 'Stage 2: small image, only the ASP.NET Core runtime') },
  { line: 'COPY --from=build /app .', why: t('Trae solo lo compilado de la etapa 1', 'Brings only the compiled output from stage 1') },
  { line: 'ENTRYPOINT ["dotnet", "MiApi.dll"]', why: t('El comando que arranca tu API', 'The command that starts your API') },
];

export function DockerSim(props: SimProps) {
  const { stack } = useStack();
  return <DockerInner key={stack} {...props} lines={stack === 'dotnet' ? DOCKER_DOTNET : DOCKER_NODE} />;
}

function DockerInner({ labId, lines: DOCKER_LINES }: SimProps & { lines: typeof DOCKER_NODE }) {
  const { tr, tx } = useLang();
  const shuffled = useMemo(() => DOCKER_LINES.map((_, i) => i).sort(() => Math.random() - 0.5), []);
  const [chosen, setChosen] = useState<number[]>([]);
  const [wrongAt, setWrongAt] = useState<number | null>(null);
  const [built, setBuilt] = useState(0);
  const [running, setRunning] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const complete = chosen.length === DOCKER_LINES.length;

  const pick = (i: number) => {
    if (i === chosen.length) {
      setChosen((c) => [...c, i]);
      setWrongAt(null);
    } else setWrongAt(i);
  };
  const build = async () => {
    setBusy(true);
    setBuilt(0);
    for (let i = 1; i <= DOCKER_LINES.length; i++) {
      await sleep(450);
      setBuilt(i);
    }
    setBusy(false);
  };
  const runEverywhere = async () => {
    setRunning([]);
    for (const m of ['💻 Windows', '🍎 Mac', '🐧 Linux', '☁️ Cloud']) {
      await sleep(400);
      setRunning((r) => [...r, m]);
    }
  };

  return (
    <div className="sim stack">
      <div className="sim-title">🐳 {tx('Escribe la receta (Dockerfile) en el orden correcto', 'Write the recipe (Dockerfile) in the right order')}</div>
      <div className="grid grid-2">
        <div className="stack" style={{ gap: 6 }}>
          {shuffled.filter((i) => !chosen.includes(i)).map((i) => (
            <button key={i} className={`chip ${wrongAt === i ? 'shake' : ''}`} style={{ borderColor: wrongAt === i ? 'var(--red)' : undefined, justifyContent: 'flex-start' }} onClick={() => pick(i)}>
              {DOCKER_LINES[i].line}
            </button>
          ))}
          {wrongAt !== null && <div className="small" style={{ color: 'var(--red)' }}>{tx('Esa línea no va todavía. ¿Qué necesita existir antes?', 'That line does not go yet. What needs to exist first?')}</div>}
          {complete && <div className="feedback ok small">✅ {tx('¡Receta correcta!', 'Correct recipe!')}</div>}
        </div>
        <div className="panel">
          <div className="tiny bold muted mb">Dockerfile</div>
          {chosen.map((i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mono small bold">{DOCKER_LINES[i].line}</div>
              <div className="tiny muted" style={{ marginBottom: 6 }}>↳ {tr(DOCKER_LINES[i].why)}</div>
            </motion.div>
          ))}
        </div>
      </div>
      {complete && (
        <>
          <div className="row">
            <button className="btn btn-primary btn-sm" onClick={build} disabled={busy}>🔨 docker build -t myapp .</button>
            <button className="btn btn-green btn-sm" onClick={runEverywhere} disabled={built < DOCKER_LINES.length}>▶ docker run myapp</button>
          </div>
          <div className="row" style={{ alignItems: 'flex-end', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 3, width: 260 }}>
              {DOCKER_LINES.slice(0, built).map((d, i) => (
                <motion.div key={i} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mono tiny" style={{ padding: '4px 8px', borderRadius: 6, background: `hsl(${200 + i * 18} 70% 50% / .3)`, border: `1px solid hsl(${200 + i * 18} 70% 60%)` }}>
                  {tx('capa', 'layer')} {i + 1}: {d.line}
                </motion.div>
              ))}
            </div>
            <div className="stack" style={{ gap: 4 }}>
              {running.map((m) => (
                <motion.div key={m} initial={{ scale: 0 }} animate={{ scale: 1 }} className="pill green">{m}: {tx('Escuchando en el puerto 3000 ✅', 'Listening on port 3000 ✅')}</motion.div>
              ))}
            </div>
          </div>
          {running.length === 4 && <div className="small bold">🎉 {tx('"Funciona en mi máquina" ahora es "funciona en TODAS las máquinas".', '"Works on my machine" is now "works on EVERY machine".')}</div>}
        </>
      )}
      <Tasks
        labId={labId}
        items={[
          { key: 'order', label: t('Ordena las 6 líneas del Dockerfile', 'Order the 6 Dockerfile lines'), done: complete },
          { key: 'build', label: t('Construye la imagen (capa por capa)', 'Build the image (layer by layer)'), done: built === DOCKER_LINES.length },
          { key: 'run', label: t('Corre el contenedor en 4 máquinas distintas', 'Run the container on 4 different machines'), done: running.length === 4 },
        ]}
      />
    </div>
  );
}

// =====================================================================
// CI/CD
// =====================================================================
export function CicdSim({ labId }: SimProps) {
  const { tx } = useLang();
  const { isDotnet } = useStack();
  const stages = [
    { emoji: '📥', label: 'git push' },
    { emoji: '📦', label: isDotnet ? 'dotnet restore' : 'npm install' },
    { emoji: '🧹', label: isDotnet ? 'dotnet build' : 'lint' },
    { emoji: '🧪', label: isDotnet ? 'dotnet test' : 'npm test' },
    { emoji: '🐳', label: 'docker build' },
    { emoji: '🚀', label: tx('deploy a producción', 'deploy to production') },
  ];
  const [bug, setBug] = useState(true);
  const [pos, setPos] = useState(-1);
  const [failed, setFailed] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [outcomes, setOutcomes] = useState({ blocked: false, deployed: false });

  const push = async () => {
    setBusy(true);
    setFailed(null);
    for (let i = 0; i < stages.length; i++) {
      setPos(i);
      await sleep(650);
      if (bug && i === 3) {
        setFailed(3);
        setOutcomes((o) => ({ ...o, blocked: true }));
        setBusy(false);
        return;
      }
    }
    setPos(stages.length);
    setOutcomes((o) => ({ ...o, deployed: true }));
    setBusy(false);
  };

  return (
    <div className="sim stack">
      <div className="sim-title">🏭 {tx('Pipeline de CI/CD (como GitHub Actions)', 'CI/CD pipeline (like GitHub Actions)')}</div>
      <div className="row">
        <label className="small row" style={{ gap: 6 }}><input type="checkbox" checked={bug} onChange={() => setBug((b) => !b)} /> 🐛 {tx('Mi commit tiene un bug', 'My commit has a bug')}</label>
        <button className="btn btn-primary btn-sm" onClick={push} disabled={busy}>📥 git push</button>
      </div>
      <div className="row" style={{ gap: 6 }}>
        {stages.map((s, i) => {
          const state = failed === i ? 'fail' : pos > i ? 'ok' : pos === i ? 'run' : failed !== null && i > failed ? 'skip' : 'idle';
          const color = { fail: 'var(--red)', ok: 'var(--green)', run: 'var(--yellow)', skip: 'var(--border)', idle: 'var(--border)' }[state];
          return (
            <motion.div key={i} animate={{ scale: state === 'run' ? 1.08 : 1 }} style={{ flex: '1 1 100px', textAlign: 'center', padding: 10, borderRadius: 12, border: `2px solid ${color}`, background: 'var(--surface)', opacity: state === 'skip' ? 0.35 : 1 }}>
              <div style={{ fontSize: '1.5rem' }}>{state === 'fail' ? '❌' : state === 'ok' ? '✅' : s.emoji}</div>
              <div className="tiny bold mono">{s.label}</div>
            </motion.div>
          );
        })}
      </div>
      {failed !== null && <div className="feedback bad small">❌ {tx('Las pruebas fallaron. El deploy se BLOQUEÓ automáticamente: el bug nunca llegó a los usuarios. Recibes un email con el error.', 'Tests failed. Deployment was BLOCKED automatically: the bug never reached users. You get an email with the error.')}</div>}
      {pos === stages.length && <div className="feedback ok small">🚀 {tx('¡Todo verde! Tu código está en producción sin que tocaras nada a mano.', 'All green! Your code is in production without you touching anything by hand.')}</div>}
      <CodeBlock snippet={{ dotnet: { lang: 'yaml', src: '# .github/workflows/ci.yml\non: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-dotnet@v4\n        with:\n          dotnet-version: 10.0.x\n      - run: dotnet restore\n      - run: dotnet test' }, lang: 'yaml', src: '# .github/workflows/ci.yml\non: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm install\n      - run: npm test' }} />
      <Tasks
        labId={labId}
        items={[
          { key: 'blocked', label: t('Sube un commit con bug y mira cómo CI lo detiene', 'Push a buggy commit and watch CI stop it'), done: outcomes.blocked },
          { key: 'deployed', label: t('Quita el bug, sube de nuevo y despliega a producción', 'Remove the bug, push again and deploy to production'), done: outcomes.deployed },
        ]}
      />
    </div>
  );
}

