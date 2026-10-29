import { useLang } from '../i18n/lang';
import { RoadmapSim } from '../components/sims/Roadmap';
import { resetProgress } from '../store/progress';
import { Ic, IcTile } from '../components/ui/Icon';

export function Roadmap() {
  const { tx } = useLang();
  return (
    <div className="container narrow mt-lg">
      <h1 className="h-icon"><Ic n="map" size={36} /> {tx('Tu hoja de ruta', 'Your roadmap')}</h1>
      <p className="muted">{tx('El orden que tiene sentido. No te saltes fases. Marca lo que vayas dominando: se guarda en este navegador.', 'The order that makes sense. Do not skip phases. Check off what you master: it is saved in this browser.')}</p>
      <RoadmapSim />
      <div className="card mt-lg center" style={{ borderColor: 'var(--primary)', borderWidth: 2 }}>
        <IcTile n="target" color="var(--red)" />
        <h2>{tx('La gran lección', 'The big takeaway')}</h2>
        <p className="muted">
          {tx(
            'Los frameworks cambian cada pocos años. Los conceptos de esta web llevan décadas iguales: HTTP, SQL, request → proceso → response, tokens o sesiones, caché. Cuando entiendes los fundamentos, aprender un framework nuevo toma días, no meses.',
            'Frameworks change every few years. The concepts on this site have stayed the same for decades: HTTP, SQL, request → process → response, tokens or sessions, caching. When you understand the fundamentals, picking up a new framework takes days, not months.',
          )}
        </p>
        <p className="bold" style={{ fontSize: '1.15rem' }}>
          “{tx('Quien entiende el PORQUÉ siempre guiará a quien solo sabe el CÓMO.', 'The person who understands WHY will always lead the person who only knows HOW.')}”
        </p>
      </div>
      <div className="center mt-lg">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            if (window.confirm(tx('¿Borrar todo tu progreso? No se puede deshacer.', 'Delete all your progress? This cannot be undone.'))) resetProgress();
          }}
        >
          <Ic n="trash" size={18} /> {tx('Reiniciar todo mi progreso', 'Reset all my progress')}
        </button>
      </div>
    </div>
  );
}
