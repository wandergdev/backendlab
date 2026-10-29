import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import type { Icon as PhIcon } from '@phosphor-icons/react';
import {
  BookOpenIcon, BracketsAngleIcon, CardsIcon, ChartLineUpIcon, FireIcon, FlaskIcon, HouseIcon, ListIcon, MapTrifoldIcon,
  MoonIcon, SquaresFourIcon, StarIcon, SunIcon, TranslateIcon, XIcon,
} from '@phosphor-icons/react';
import { useLang } from '../../i18n/lang';
import { dueCardIds, level, setSetting, useProgress } from '../../store/progress';
import { StackOnboarding, StackSwitch } from './StackSwitch';

type NavItem = { to: string; label: string; icon: PhIcon; end?: boolean; badge?: number; bottom?: boolean };

export function Layout({ children }: { children: ReactNode }) {
  const { lang, setLang, tx } = useLang();
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
  const links: NavItem[] = [
    { to: '/', label: tx('Inicio', 'Home'), icon: HouseIcon, end: true, bottom: true },
    { to: '/modules', label: tx('Módulos', 'Modules'), icon: SquaresFourIcon, bottom: true },
    { to: '/review', label: tx('Repaso', 'Review'), icon: CardsIcon, badge: due, bottom: true },
    { to: '/labs', label: tx('Laboratorios', 'Labs'), icon: FlaskIcon, bottom: true },
    { to: '/glossary', label: tx('Glosario', 'Glossary'), icon: BookOpenIcon },
    { to: '/roadmap', label: tx('Ruta', 'Roadmap'), icon: MapTrifoldIcon },
    { to: '/progress', label: tx('Mi progreso', 'My progress'), icon: ChartLineUpIcon, bottom: true },
  ];
  const inLesson = /^\/m\/[^/]+\/lesson/.test(loc.pathname);

  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        {tx('Saltar al contenido', 'Skip to content')}
      </a>
      <header className="header">
        <div className="container header-inner" style={{ maxWidth: 1340 }}>
          <button className="btn btn-ghost icon-btn menu-btn" onClick={() => setOpen((o) => !o)} aria-label={tx('Menú', 'Menu')} aria-expanded={open}>
            {open ? <XIcon size={22} aria-hidden /> : <ListIcon size={22} aria-hidden />}
          </button>
          <Link to="/" className="logo" aria-label="BackendLab">
            <span className="logo-mark" aria-hidden><BracketsAngleIcon size={20} weight="bold" color="#fff" /></span>
            <span>BackendLab</span>
          </Link>
          <nav className={`nav ${open ? 'open' : ''}`} aria-label={tx('Principal', 'Main')}>
            {links.map(({ to, label, icon: I, end, badge }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
                <I size={18} weight="duotone" aria-hidden />
                <span>{label}</span>
                {!!badge && <span className="nav-badge" aria-label={tx(`${badge} pendientes`, `${badge} due`)}>{badge}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="header-stats">
            <Link to="/progress" className="stat-chip" style={{ color: 'var(--text)' }} title={`${tx('Racha', 'Streak')}: ${streak.count} · ${lv.into}/${lv.need} XP`} aria-label={tx(`Racha de ${streak.count} días, nivel ${lv.lvl}`, `${streak.count}-day streak, level ${lv.lvl}`)}>
              <FireIcon size={18} weight="duotone" color="var(--orange)" aria-hidden /> {streak.count}
              <span className="hide-mobile row" style={{ gap: 4 }}>
                <span className="faint">·</span> <StarIcon size={18} weight="duotone" color="var(--yellow)" aria-hidden /> {tx('Nv', 'Lv')} {lv.lvl}
              </span>
            </Link>
            <StackSwitch />
            <button className="btn btn-ghost btn-sm" onClick={() => setLang(lang === 'es' ? 'en' : 'es')} aria-label={tx('Cambiar idioma a inglés', 'Switch language to Spanish')}>
              <TranslateIcon size={18} weight="duotone" aria-hidden /> {lang.toUpperCase()}
            </button>
            <button className="btn btn-ghost icon-btn" onClick={() => setSetting('theme', theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? tx('Cambiar a tema claro', 'Switch to light theme') : tx('Cambiar a tema oscuro', 'Switch to dark theme')}>
              {theme === 'dark' ? <MoonIcon size={20} weight="duotone" aria-hidden /> : <SunIcon size={20} weight="duotone" aria-hidden />}
            </button>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className={inLesson ? '' : 'has-bottom-nav'}>{children}</main>
      <StackOnboarding />
      {!inLesson && (
        <nav className="bottom-nav" aria-label={tx('Navegación rápida', 'Quick navigation')}>
          {links.filter((l) => l.bottom).map(({ to, label, icon: I, end, badge }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {({ isActive }) => (
                <>
                  <span className="bn-icon">
                    <I size={24} weight={isActive ? 'fill' : 'duotone'} aria-hidden />
                    {!!badge && <span className="nav-badge">{badge}</span>}
                  </span>
                  <span className="bn-label">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}
      <footer className="footer">
        <div className="container row between">
          <span>
            BackendLab · {tx('Basado en', 'Based on')}{' '}
            <a href="https://dev.to/edriso/the-backend-developer-fundamentals-guide-3j55" target="_blank" rel="noreferrer">
              The Backend Developer Fundamentals Guide
            </a>{' '}
            · {tx('Iconos', 'Icons')}: <a href="https://phosphoricons.com" target="_blank" rel="noreferrer">Phosphor</a>
          </span>
          <span>
            {tx('Tu progreso se guarda en este navegador.', 'Your progress is stored in this browser.')}{' '}
            <Link to="/progress">{tx('Llevarlo a otro dispositivo →', 'Take it to another device →')}</Link>
          </span>
        </div>
      </footer>
    </>
  );
}
