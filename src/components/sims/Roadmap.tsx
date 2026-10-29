import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { t, type L } from '../../types';
import { useLang } from '../../i18n/lang';
import { completeTask, toggleRoadmap, useProgress } from '../../store/progress';
import type { SimProps } from './SimHost';

// =====================================================================
// Hoja de ruta personal (se guarda en tu navegador)
// =====================================================================
export const ROADMAP: { id: string; title: L; weeks: string; items: { id: string; text: L; module?: string }[] }[] = [
  {
    id: 'p1', title: t('Fase 1 · Los cimientos', 'Phase 1 · The foundation'), weeks: '1–6',
    items: [
      { id: 'p1a', text: t('Elegir UN lenguaje (JavaScript/Node.js o Python)', 'Pick ONE language (JavaScript/Node.js or Python)') },
      { id: 'p1b', text: t('Bases de programación: variables, funciones, bucles, arrays, objetos, clases', 'Programming basics: variables, functions, loops, arrays, objects, classes') },
      { id: 'p1c', text: t('Cómo funciona Internet: HTTP, DNS, TCP/IP', 'How the internet works: HTTP, DNS, TCP/IP'), module: 'internet' },
      { id: 'p1d', text: t('Lo básico de la terminal', 'Command line basics'), module: 'linux' },
      { id: 'p1e', text: t('Lo básico de Git', 'Git basics'), module: 'git' },
    ],
  },
  {
    id: 'p2', title: t('Fase 2 · Bases de datos y APIs', 'Phase 2 · Databases & APIs'), weeks: '7–12',
    items: [
      { id: 'p2a', text: t('Aprender SQL (PostgreSQL)', 'Learn SQL (PostgreSQL)'), module: 'databases' },
      { id: 'p2b', text: t('Construir una API REST simple (Express o FastAPI)', 'Build a simple REST API (Express or FastAPI)'), module: 'apis' },
      { id: 'p2c', text: t('Conectar la API a una base de datos', 'Connect the API to a database'), module: 'data-flow' },
      { id: 'p2d', text: t('Request/response, rutas y middleware', 'Request/response, routing and middleware'), module: 'server' },
      { id: 'p2e', text: t('Construir un CRUD (lista de tareas o blog)', 'Build a CRUD app (todo list or blog)') },
    ],
  },
  {
    id: 'p3', title: t('Fase 3 · Habilidades del mundo real', 'Phase 3 · Real-world skills'), weeks: '13–20',
    items: [
      { id: 'p3a', text: t('Autenticación (JWT, hash de contraseñas)', 'Authentication (JWT, password hashing)'), module: 'auth' },
      { id: 'p3b', text: t('Validación y manejo de errores', 'Validation and error handling') },
      { id: 'p3c', text: t('Caché con Redis', 'Caching with Redis'), module: 'caching' },
      { id: 'p3d', text: t('Seguridad básica: SQL injection, XSS, CSRF', 'Basic security: SQL injection, XSS, CSRF'), module: 'security' },
      { id: 'p3e', text: t('Escribir pruebas unitarias', 'Write unit tests'), module: 'testing' },
      { id: 'p3f', text: t('Un proyecto grande (API de e-commerce o red social)', 'A bigger project (e-commerce or social media API)') },
    ],
  },
  {
    id: 'p4', title: t('Fase 4 · Producción y escala', 'Phase 4 · Production & scale'), weeks: '21–28',
    items: [
      { id: 'p4a', text: t('Aprender Docker', 'Learn Docker'), module: 'devops' },
      { id: 'p4b', text: t('Desplegar tu app en la nube', 'Deploy your app to the cloud'), module: 'devops' },
      { id: 'p4c', text: t('CI/CD con GitHub Actions', 'CI/CD with GitHub Actions'), module: 'devops' },
      { id: 'p4d', text: t('Logs y monitoreo', 'Logging and monitoring') },
      { id: 'p4e', text: t('Patrones de arquitectura (MVC, microservicios)', 'Architecture patterns (MVC, microservices)'), module: 'architecture' },
      { id: 'p4f', text: t('Bases de diseño de sistemas', 'System design basics'), module: 'networking' },
    ],
  },
  {
    id: 'p5', title: t('Fase 5 · Subir de nivel', 'Phase 5 · Level up'), weeks: '∞',
    items: [
      { id: 'p5a', text: t('Aprender un segundo framework (para probar que los conceptos se transfieren)', 'Learn a second framework (to prove concepts transfer)') },
      { id: 'p5b', text: t('Colas de mensajes (RabbitMQ/Kafka)', 'Message queues (RabbitMQ/Kafka)'), module: 'architecture' },
      { id: 'p5c', text: t('GraphQL', 'GraphQL'), module: 'apis' },
      { id: 'p5d', text: t('Más diseño de sistemas', 'Deeper system design') },
      { id: 'p5e', text: t('Contribuir a open source y leer código de otros', 'Contribute to open source and read other people\'s code') },
    ],
  },
];

export function RoadmapSim({ labId = 'road-check' }: SimProps) {
  const { tr, tx } = useLang();
  const done = useProgress((s) => s.roadmap);
  return (
    <div className="stack">
      {ROADMAP.map((p, pi) => {
        const n = p.items.filter((i) => done[i.id]).length;
        return (
          <motion.div key={p.id} className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pi * 0.08 }}>
            <div className="row between">
              <h3 style={{ margin: 0 }}>{tr(p.title)}</h3>
              <span className="pill">{tx('Semanas', 'Weeks')} {p.weeks}</span>
            </div>
            <div className="progress mt mb"><div style={{ width: `${(n / p.items.length) * 100}%` }} /></div>
            {p.items.map((it) => (
              <label key={it.id} className={`task ${done[it.id] ? 'done' : ''}`} style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={!!done[it.id]} onChange={() => { toggleRoadmap(it.id); completeTask(`${labId}:check`, 5); }} style={{ marginTop: 5 }} />
                <span className="small grow">{tr(it.text)}</span>
                {it.module && <Link className="tiny" to={`/m/${it.module}`}>{tx('Ir al módulo', 'Go to module')}</Link>}
              </label>
            ))}
          </motion.div>
        );
      })}
    </div>
  );
}
