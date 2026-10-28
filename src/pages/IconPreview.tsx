import { useState } from 'react';
import type { Icon as PhIcon, IconWeight } from '@phosphor-icons/react';
import {
  HouseIcon, SquaresFourIcon, CardsIcon, FlaskIcon, BookOpenIcon, MapTrifoldIcon, ChartLineUpIcon, FireIcon, StarIcon,
  SunIcon, MoonIcon, TranslateIcon, PlayIcon, PauseIcon, SkipForwardIcon, ArrowCounterClockwiseIcon, ArrowRightIcon,
  CheckCircleIcon, XCircleIcon, LightbulbIcon, CopyIcon, QrCodeIcon, EyeIcon, RepeatIcon, BrainIcon, GlobeHemisphereWestIcon,
  ArrowsLeftRightIcon, HardDrivesIcon, StackIcon, CpuIcon, DatabaseIcon, BracketsCurlyIcon, LockKeyIcon, LightningIcon,
  ShieldCheckIcon, BuildingsIcon, WifiHighIcon, TerminalWindowIcon, GitBranchIcon, TestTubeIcon, CubeIcon, FileTsIcon,
  FileCSharpIcon, BrowsersIcon, TableIcon, CodeIcon, TrophyIcon, TargetIcon,
} from '@phosphor-icons/react';

// Página temporal para elegir la librería de iconos antes del rediseño.

const NAV: [string, string, PhIcon][] = [
  ['🏠', 'Inicio', HouseIcon], ['🧱', 'Módulos', SquaresFourIcon], ['🧠', 'Repaso', CardsIcon], ['🧪', 'Laboratorios', FlaskIcon],
  ['📚', 'Glosario', BookOpenIcon], ['🗺️', 'Ruta', MapTrifoldIcon], ['💾', 'Mi progreso', ChartLineUpIcon],
];
const MODULES: [string, string, PhIcon, string][] = [
  ['🌐', 'Internet', GlobeHemisphereWestIcon, '#4cc9f0'], ['📨', 'Request/Response', ArrowsLeftRightIcon, '#7c6cff'], ['🖥️', 'Servidor', HardDrivesIcon, '#00d29a'],
  ['🍰', 'Capas', StackIcon, '#ff9f43'], ['🧠', 'Memoria', CpuIcon, '#f78fb3'], ['🗄️', 'Bases de datos', DatabaseIcon, '#4cc9f0'],
  ['🔌', 'APIs', BracketsCurlyIcon, '#a29bfe'], ['🔐', 'Auth', LockKeyIcon, '#ffd166'], ['⚡', 'Caché', LightningIcon, '#ff6b81'],
  ['🛡️', 'Seguridad', ShieldCheckIcon, '#ff9f43'], ['🏗️', 'Arquitectura', BuildingsIcon, '#7c6cff'], ['📡', 'Redes', WifiHighIcon, '#00d29a'],
  ['🐧', 'Linux', TerminalWindowIcon, '#ffd166'], ['🌳', 'Git', GitBranchIcon, '#ff6b81'], ['🧪', 'Testing', TestTubeIcon, '#00d29a'],
  ['🐳', 'DevOps', CubeIcon, '#4cc9f0'], ['🗺️', 'Ruta', MapTrifoldIcon, '#a29bfe'], ['🟦', 'TypeScript', FileTsIcon, '#3178c6'],
  ['🟪', 'C#', FileCSharpIcon, '#9b4f96'], ['🌐', 'ASP.NET Core', BrowsersIcon, '#512bd4'], ['🗄️', 'EF Core', TableIcon, '#00a3e0'],
];
const METHOD: [string, string, PhIcon][] = [['👀', 'Ver', EyeIcon], ['🔁', 'Repetir', RepeatIcon], ['🧪', 'Hacer', FlaskIcon], ['🧠', 'Recordar', BrainIcon]];
const WEIGHTS: IconWeight[] = ['duotone', 'regular', 'bold', 'fill'];

export function IconPreview() {
  const [weight, setWeight] = useState<IconWeight>('duotone');
  return (
    <div className="container mt-lg stack" style={{ gap: 28 }}>
      <div>
        <h1>Vista previa: Phosphor Icons</h1>
        <p className="muted">Librería gratuita (MIT) instalada con npm: <code className="kbd">@phosphor-icons/react</code>. Es el proyecto original de la colección "Phosphor Duotone" de svgrepo.com. +1.500 iconos, 6 estilos, SVG puro y accesible.</p>
        <div className="row">
          {WEIGHTS.map((w) => (
            <button key={w} className={`btn btn-sm ${weight === w ? 'active' : ''}`} onClick={() => setWeight(w)}>{w}</button>
          ))}
        </div>
      </div>

      <section className="card">
        <h3>1. Navegación — antes (emoji) vs. después (SVG)</h3>
        <div className="grid grid-2">
          <div className="panel">
            <div className="tiny bold muted mb">ANTES</div>
            <div className="row">{NAV.map(([e, l]) => <span key={l} className="pill" style={{ padding: '6px 10px' }}>{e} {l}</span>)}</div>
          </div>
          <div className="panel">
            <div className="tiny bold muted mb">DESPUÉS</div>
            <div className="row">{NAV.map(([, l, I]) => <span key={l} className="pill" style={{ padding: '6px 10px' }}><I size={18} weight={weight} aria-hidden /> {l}</span>)}</div>
          </div>
        </div>
      </section>

      <section className="card">
        <h3>2. Los 21 módulos</h3>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {MODULES.map(([e, l, I, c]) => (
            <div key={l} className="panel row" style={{ gap: 10, flexWrap: 'nowrap' }}>
              <span style={{ fontSize: '1.3rem', width: 28, textAlign: 'center', opacity: 0.6 }}>{e}</span>
              <span style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', color: c, background: `color-mix(in srgb, ${c} 16%, transparent)`, border: `1.5px solid color-mix(in srgb, ${c} 45%, transparent)`, flex: 'none' }}>
                <I size={26} weight={weight} aria-hidden />
              </span>
              <span className="small bold">{l}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>3. Componentes de muestra</h3>
        <div className="grid grid-2">
          <div className="stack">
            <div className="row">
              <button className="btn btn-primary"><PlayIcon size={18} weight="fill" aria-hidden /> Reproducir</button>
              <button className="btn"><PauseIcon size={18} weight={weight} aria-hidden /> Pausa</button>
              <button className="btn"><SkipForwardIcon size={18} weight={weight} aria-hidden /> Paso</button>
              <button className="btn btn-ghost" aria-label="Repetir"><ArrowCounterClockwiseIcon size={18} weight={weight} aria-hidden /></button>
            </div>
            <div className="row">
              <span className="stat-chip"><FireIcon size={18} weight={weight} color="#ff9f43" aria-hidden /> 3 · <StarIcon size={18} weight={weight} color="#ffd166" aria-hidden /> Nv 4</span>
              <button className="btn btn-ghost btn-sm" aria-label="Tema"><SunIcon size={18} weight={weight} aria-hidden /> / <MoonIcon size={18} weight={weight} aria-hidden /></button>
              <button className="btn btn-ghost btn-sm"><TranslateIcon size={18} weight={weight} aria-hidden /> ES</button>
              <button className="btn btn-sm"><CopyIcon size={16} weight={weight} aria-hidden /> Copiar</button>
              <button className="btn btn-sm"><QrCodeIcon size={16} weight={weight} aria-hidden /> QR</button>
            </div>
            <div className="feedback ok row" style={{ gap: 8 }}><CheckCircleIcon size={22} weight={weight} color="var(--green)" aria-hidden /> ¡Correcto!</div>
            <div className="feedback bad row" style={{ gap: 8 }}><XCircleIcon size={22} weight={weight} color="var(--red)" aria-hidden /> Casi. Lo repetiremos más adelante.</div>
            <div className="tip row" style={{ gap: 8 }}><LightbulbIcon size={20} weight={weight} color="var(--yellow)" aria-hidden /> Tip con icono SVG en lugar de 💡</div>
          </div>
          <div className="grid grid-2">
            {METHOD.map(([e, l, I], i) => (
              <div key={l} className="card tight">
                <div className="row between">
                  <span style={{ width: 48, height: 48, borderRadius: 14, display: 'grid', placeItems: 'center', color: ['#4cc9f0', '#a29bfe', '#00d29a', '#f78fb3'][i], background: 'var(--surface-2)' }}><I size={30} weight={weight} aria-hidden /></span>
                  <span style={{ opacity: 0.5 }}>{e}</span>
                </div>
                <div className="bold mt">{i + 1}. {l}</div>
              </div>
            ))}
            <div className="card tight row" style={{ gap: 8 }}><TrophyIcon size={28} weight={weight} color="#ffd166" aria-hidden /><span className="small bold">Logros</span></div>
            <div className="card tight row" style={{ gap: 8 }}><TargetIcon size={28} weight={weight} color="#ff6b81" aria-hidden /><span className="small bold">Objetivos</span></div>
            <div className="card tight row" style={{ gap: 8 }}><CodeIcon size={28} weight={weight} color="#4cc9f0" aria-hidden /><span className="small bold">Código</span></div>
            <div className="card tight row" style={{ gap: 8 }}><ArrowRightIcon size={28} weight={weight} aria-hidden /><span className="small bold">Siguiente</span></div>
          </div>
        </div>
      </section>
    </div>
  );
}
