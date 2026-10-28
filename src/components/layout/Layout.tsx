import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLang } from '../../i18n/lang';
import { dueCardIds, level, setSetting, useProgress } from '../../store/progress';
import { STACKS, useStack } from '../../i18n/stack';

export function Layout({ children }: { children: ReactNode }) {
  const { lang, setLang, tx } = useLang();
  const { stack, setStack } = useStack();
  const theme = useProgress((s) => s.settings.theme);
  const xp = useProgress((s) => s.xp);
  const streak = useProgress((s) => s.streak);
  const due = useProgress((s) => dueCardIds(s).length);
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0 });
  }, [loc.pathname]);

  const lv = level(xp);
  const links = [
    { to: '/', label: tx('Inicio', 'Home'), end: true },
    { to: '/modules', label: tx('Módulos', 'Modules') },
    { to: '/review', label: `${tx('Repaso', 'Review')}${due ? ` (${due})` : ''}` },
    { to: '/labs', label: tx('Laboratorios', 'Labs') },
    { to: '/glossary', label: tx('Glosario', 'Glossary') },
    { to: '/roadmap', label: tx('Ruta', 'Roadmap') },
  ];

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <button className="btn btn-ghost btn-sm menu-btn" onClick={() => setOpen((o) => !o)} aria-label="menu">
            ☰
          </button>
          <Link to="/" className="logo">
            <span className="logo-mark">⚙️</span>
            <span>BackendLab</span>
          </Link>
          <nav className={`nav ${open ? 'open' : ''}`}>
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-stats">
            <span className="stat-chip" title={tx('Racha de días estudiando', 'Daily study streak')}>🔥 {streak.count}</span>
            <span className="stat-chip hide-mobile" title={`${lv.into}/${lv.need} XP`}>⭐ {tx('Nv', 'Lv')} {lv.lvl}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setStack(stack === 'node' ? 'dotnet' : 'node')} title={tx('Cambiar el stack de los ejemplos de código', 'Switch the stack of the code examples')}>
              {STACKS[stack].emoji} <span className="hide-mobile">{STACKS[stack].short}</span>
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setLang(lang === 'es' ? 'en' : 'es')} title={tx('Cambiar idioma', 'Change language')}>
              {lang === 'es' ? '🇪🇸 ES' : '🇬🇧 EN'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setSetting('theme', theme === 'dark' ? 'light' : 'dark')} aria-label={tx('Cambiar tema', 'Toggle theme')}>
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <div className="container row between">
          <span>
            BackendLab · {tx('Basado en', 'Based on')}{' '}
            <a href="https://dev.to/edriso/the-backend-developer-fundamentals-guide-3j55" target="_blank" rel="noreferrer">
              The Backend Developer Fundamentals Guide
            </a>
          </span>
          <span>{tx('Tu progreso se guarda solo en este navegador.', 'Your progress is stored only in this browser.')}</span>
        </div>
      </footer>
    </>
  );
}
