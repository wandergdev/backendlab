import { lazy, Suspense, useEffect, type ComponentType } from 'react';
import type { SimId, Txt } from '../../types';
import { useLang } from '../../i18n/lang';
import { completeTask, useProgress } from '../../store/progress';
import { Ic } from '../ui/Icon';

export type SimProps = { labId?: string } & Record<string, unknown>;

const pick = <K extends string>(loader: () => Promise<Record<K, ComponentType<SimProps>>>, name: K) =>
  lazy(() => loader().then((m) => ({ default: m[name] })));

const net = () => import('./Net');
const http = () => import('./Http');
const server = () => import('./Server');
const data = () => import('./Data');
const sec = () => import('./Security');
const cache = () => import('./Cache');
const arch = () => import('./Arch');
const ops = () => import('./Ops');
const langs = () => import('./Lang');
const dotnet = () => import('./Dotnet');

const SIMS: Partial<Record<SimId, ComponentType<SimProps>>> = {
  dns: pick(net, 'DnsSim'),
  ports: pick(net, 'PortsSim'),
  osi: pick(net, 'OsiSim'),
  tcpUdp: pick(net, 'TcpUdpSim'),
  websocket: pick(net, 'WebSocketSim'),
  loadBalancer: pick(net, 'LoadBalancerSim'),
  httpsSniff: pick(net, 'HttpsSniffSim'),
  httpPlayground: pick(http, 'HttpPlayground'),
  statusSort: pick(http, 'StatusSort'),
  restDesigner: pick(http, 'RestDesigner'),
  jsonExplorer: pick(http, 'JsonExplorer'),
  graphqlVsRest: pick(http, 'GraphqlVsRest'),
  serverLoop: pick(server, 'ServerLoop'),
  threads: pick(server, 'ThreadsSim'),
  memory: pick(server, 'MemorySim'),
  layers: pick(server, 'LayersSim'),
  sqlPlayground: pick(data, 'SqlPlayground'),
  joinViz: pick(data, 'JoinViz'),
  transaction: pick(data, 'TransactionSim'),
  index: pick(data, 'IndexSim'),
  hashLab: pick(sec, 'HashLab'),
  jwtLab: pick(sec, 'JwtLab'),
  injectionLab: pick(sec, 'InjectionLab'),
  xssLab: pick(sec, 'XssLab'),
  rateLimit: pick(sec, 'RateLimitSim'),
  cacheSim: pick(cache, 'CacheSim'),
  cacheLayers: pick(cache, 'CacheLayers'),
  monoMicro: pick(arch, 'MonoMicro'),
  pubsub: pick(arch, 'PubSubSim'),
  terminal: lazy(() => import('./Terminal')),
  git: lazy(() => import('./Git')),
  testRunner: pick(ops, 'TestRunner'),
  pyramid: pick(ops, 'PyramidSim'),
  docker: pick(ops, 'DockerSim'),
  cicd: pick(ops, 'CicdSim'),
  roadmap: pick(() => import('./Roadmap'), 'RoadmapSim'),
  compileQuiz: pick(langs, 'CompileQuiz'),
  linqViz: pick(langs, 'LinqViz'),
  aspnetPipeline: pick(dotnet, 'AspnetPipeline'),
  diLifetimes: pick(dotnet, 'DiLifetimes'),
  efQuery: pick(dotnet, 'EfQuery'),
  efTracking: pick(dotnet, 'EfTracking'),
};

export function SimHost({ id, props, labId }: { id: SimId; props?: Record<string, unknown>; labId?: string }) {
  const { tx } = useLang();
  const Comp = SIMS[id];
  if (!Comp) return <div className="sim">{tx('Simulador no disponible', 'Simulator not available')}: {id}</div>;
  return (
    <Suspense fallback={<div className="sim pulse">{tx('Cargando simulador…', 'Loading simulator…')}</div>}>
      <Comp {...(props ?? {})} labId={labId} />
    </Suspense>
  );
}

export type TaskDef = { key: string; label: Txt; done: boolean };

/** Lista de objetivos de un laboratorio. Cuando un objetivo se cumple, se guarda y da XP. */
export function Tasks({ labId, items }: { labId?: string; items: TaskDef[] }) {
  const { tr, tx } = useLang();
  const saved = useProgress((s) => s.tasks);
  useEffect(() => {
    if (!labId) return;
    items.forEach((it) => {
      if (it.done) completeTask(`${labId}:${it.key}`);
    });
  }, [labId, items]);
  const count = items.filter((it) => it.done || (labId && saved[`${labId}:${it.key}`])).length;
  return (
    <div className="panel">
      <div className="row between" style={{ marginBottom: 6 }}>
        <div className="bold ic"><Ic n="target" size={20} color="var(--red)" /> {tx('Objetivos', 'Goals')}</div>
        <span className={`pill ${count === items.length ? 'green' : ''}`}>
          {count}/{items.length}
        </span>
      </div>
      <div className="stack" style={{ gap: 2 }}>
        {items.map((it) => {
          const done = it.done || (labId ? !!saved[`${labId}:${it.key}`] : false);
          return (
            <div key={it.key} className={`task ${done ? 'done' : ''}`}>
              <span className="check">{done && <Ic n="check" size={14} weight="bold" />}</span>
              <span className="small">{tr(it.label)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
