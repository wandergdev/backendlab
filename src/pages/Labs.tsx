import { Link, Navigate, useParams } from 'react-router-dom';
import { useLang } from '../i18n/lang';
import { MODULES } from '../content';
import { useProgress } from '../store/progress';
import { SimHost } from '../components/sims/SimHost';
import { t, type Lab, type Module } from '../types';
import { Ic, ModuleIcon } from '../components/ui/Icon';

/** Laboratorios extra que no pertenecen a un solo módulo. */
export const EXTRA_LABS: Lab[] = [
  { id: 'free-http', sim: 'httpPlayground', title: t('API libre (con login)', 'Free API (with login)'), desc: t('Prueba cualquier endpoint, inicia sesión y usa tokens.', 'Try any endpoint, log in and use tokens.'), props: { scenario: 'auth' } },
  { id: 'free-sql', sim: 'sqlPlayground', title: t('SQL libre', 'Free SQL'), desc: t('Escribe cualquier consulta contra la base de datos de práctica.', 'Write any query against the practice database.') },
  { id: 'free-terminal', sim: 'terminal', title: t('Terminal libre', 'Free terminal'), desc: t('Un servidor Linux simulado para practicar comandos.', 'A simulated Linux server to practice commands.') },
];

function allLabs(): { lab: Lab; module?: Module }[] {
  return [...MODULES.flatMap((m) => m.labs.map((lab) => ({ lab, module: m }))), ...EXTRA_LABS.map((lab) => ({ lab }))];
}

export function Labs() {
  const { tr, tx } = useLang();
  const tasks = useProgress((s) => s.tasks);
  const touched = (id: string) => Object.keys(tasks).filter((k) => k.startsWith(`${id}:`)).length;
  return (
    <div className="container mt-lg">
      <h1 className="h-icon"><Ic n="flask" size={36} /> {tx('Laboratorios', 'Labs')}</h1>
      <p className="muted">{tx('Simuladores donde practicas con las manos. Aquí no puedes romper nada de verdad: equivócate todo lo que quieras.', 'Simulators where you practice hands-on. You cannot really break anything here: make as many mistakes as you want.')}</p>
      <h3 className="mt h-icon"><Ic n="star" size={22} /> {tx('Zonas libres', 'Free zones')}</h3>
      <div className="grid grid-auto">
        {EXTRA_LABS.map((l) => (
          <Link key={l.id} to={`/labs/${l.id}`} className="card module-card" style={{ flexDirection: 'column', gap: 4 }}>
            <div className="bold">{tr(l.title)}</div>
            <div className="small muted">{tr(l.desc)}</div>
          </Link>
        ))}
      </div>
      {MODULES.filter((m) => m.labs.length).map((m) => (
        <div key={m.id} className="mt-lg">
          <h3 className="h-icon"><ModuleIcon id={m.id} color={m.color} size={36} /> {tr(m.title)}</h3>
          <div className="grid grid-auto">
            {m.labs.map((l) => (
              <Link key={l.id} to={`/labs/${l.id}`} className="card module-card" style={{ ['--mc' as string]: m.color, flexDirection: 'column', gap: 4 }}>
                <div className="row between" style={{ width: '100%' }}>
                  <span className="bold">{tr(l.title)}</span>
                  {touched(l.id) > 0 && <span className="pill green"><Ic n="check" size={14} weight="bold" /> {touched(l.id)}</span>}
                </div>
                <div className="small muted">{tr(l.desc)}</div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function LabDetail() {
  const { labId } = useParams();
  const { tr, tx } = useLang();
  const found = allLabs().find((x) => x.lab.id === labId);
  if (!found) return <Navigate to="/labs" replace />;
  const { lab, module } = found;
  return (
    <div className="container mt">
      <div className="row small">
        <Link to="/labs" className="ic"><Ic n="left" size={16} /> {tx('Laboratorios', 'Labs')}</Link>
        {module && (
          <Link to={`/m/${module.id}`} className="faint">
            · {tr(module.title)}
          </Link>
        )}
      </div>
      <h1 className="mt h-icon"><Ic n="flask" size={36} /> {tr(lab.title)}</h1>
      <p className="muted">{tr(lab.desc)}</p>
      <SimHost id={lab.sim} props={lab.props} labId={lab.id} />
    </div>
  );
}
