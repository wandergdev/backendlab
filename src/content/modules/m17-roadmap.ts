import { t, type Module } from '../../types';

export const roadmap: Module = {
  id: 'roadmap',
  num: 17,
  emoji: '🗺️',
  color: '#a29bfe',
  title: t('La ruta de aprendizaje', 'The learning roadmap'),
  tagline: t('5 fases en orden, y la gran lección', '5 phases in order, and the big takeaway'),
  formula: {
    pieces: [
      { label: t('Fundamentos', 'Fundamentals'), emoji: '🧱' },
      { label: t('Práctica', 'Practice'), emoji: '🔁' },
      { label: t('Proyectos', 'Projects'), emoji: '🛠️' },
    ],
    result: t('Backend developer', 'Backend developer'),
  },
  lesson: [
    {
      kind: 'concept',
      emoji: '🗺️',
      title: t('Un orden que tiene sentido', 'An order that makes sense'),
      body: t('Cada fase usa las piezas de la anterior, como las letras antes de las palabras. No te saltes fases: si sientes que "no sabes" algo, casi siempre es porque falta una pieza anterior.', 'Each phase uses the pieces of the previous one, like letters before words. Do not skip phases: if you feel you "do not know" something, it is almost always because an earlier piece is missing.'),
      visual: { type: 'blocks', pieces: [{ label: t('Fase 1', 'Phase 1'), emoji: '🧱' }, { label: t('Fase 2', 'Phase 2'), emoji: '🗄️' }, { label: t('Fase 3', 'Phase 3'), emoji: '🔐' }, { label: t('Fase 4', 'Phase 4'), emoji: '🚀' }, { label: t('Fase 5', 'Phase 5'), emoji: '📈' }], result: t('Tú, dentro de unos meses', 'You, in a few months'), resultEmoji: '🧑‍💻' },
    },
    {
      kind: 'concept',
      emoji: '🧱',
      title: t('Fases 1 y 2: cimientos, datos y APIs (semanas 1–12)', 'Phases 1 and 2: foundation, data and APIs (weeks 1–12)'),
      body: t('Elige UN lenguaje (JavaScript/Node.js o Python), aprende las bases, cómo funciona Internet, la terminal y Git. Luego SQL, tu primera API REST conectada a una base de datos y un CRUD completo (lista de tareas o blog).', 'Pick ONE language (JavaScript/Node.js or Python), learn the basics, how the internet works, the terminal and Git. Then SQL, your first REST API connected to a database and a full CRUD (todo list or blog).'),
      visual: { type: 'grid', items: [{ badge: '1–6', title: t('Fase 1: cimientos', 'Phase 1: foundation'), desc: t('Lenguaje · Internet · terminal · Git', 'Language · internet · terminal · Git'), color: '#00d29a' }, { badge: '7–12', title: t('Fase 2: datos y APIs', 'Phase 2: data & APIs'), desc: t('SQL · API REST · middleware · CRUD', 'SQL · REST API · middleware · CRUD'), color: '#4cc9f0' }] },
    },
    {
      kind: 'concept',
      emoji: '🔐',
      title: t('Fases 3, 4 y 5: mundo real, producción y subir de nivel', 'Phases 3, 4 and 5: real world, production and leveling up'),
      body: t('Autenticación, validación, caché, seguridad y pruebas con un proyecto grande. Luego Docker, la nube, CI/CD, logs y arquitectura. Y para siempre: un segundo framework, colas de mensajes, GraphQL, diseño de sistemas y open source.', 'Authentication, validation, caching, security and tests with a big project. Then Docker, the cloud, CI/CD, logging and architecture. And forever: a second framework, message queues, GraphQL, system design and open source.'),
      visual: { type: 'grid', items: [{ badge: '13–20', title: t('Fase 3: mundo real', 'Phase 3: real world'), desc: t('Auth · validación · Redis · seguridad · tests', 'Auth · validation · Redis · security · tests'), color: '#ffd166' }, { badge: '21–28', title: t('Fase 4: producción', 'Phase 4: production'), desc: t('Docker · nube · CI/CD · monitoreo', 'Docker · cloud · CI/CD · monitoring'), color: '#ff9f43' }, { badge: '∞', title: t('Fase 5: subir de nivel', 'Phase 5: level up'), desc: t('2º framework · colas · GraphQL · diseño de sistemas', '2nd framework · queues · GraphQL · system design'), color: '#ff6b81' }] },
    },
    { kind: 'check', exercise: { type: 'order', q: t('Ordena las fases', 'Order the phases'), items: [t('Cimientos: lenguaje, Internet, terminal, Git', 'Foundation: language, internet, terminal, Git'), t('Datos y APIs: SQL, REST, CRUD', 'Data & APIs: SQL, REST, CRUD'), t('Mundo real: auth, caché, seguridad, tests', 'Real world: auth, caching, security, tests'), t('Producción: Docker, nube, CI/CD', 'Production: Docker, cloud, CI/CD'), t('Subir de nivel: 2º framework, colas, diseño de sistemas', 'Level up: 2nd framework, queues, system design')], explain: t('Cada fase se apoya en la anterior.', 'Each phase builds on the previous one.') } },
    { kind: 'concept', emoji: '✅', title: t('Tu checklist personal', 'Your personal checklist'), body: t('Marca lo que ya dominas. Se guarda en tu navegador y lo verás en la página "Ruta".', 'Check off what you have mastered. It is saved in your browser and you will see it on the "Roadmap" page.'), visual: { type: 'sim', id: 'roadmap' } },
    {
      kind: 'concept',
      emoji: '🎯',
      title: t('La gran lección', 'The big takeaway'),
      body: t('Los frameworks nacen y mueren. HTTP no ha cambiado. Las bases de datos siguen usando SQL. Los servidores siguen haciendo request → proceso → response. Cuando miras Spring piensas "ah, esta es su forma de hacer rutas y middleware". No estás aprendiendo un framework: estás aprendiendo cómo se hablan las computadoras.', 'Frameworks are born and die. HTTP has not changed. Databases still use SQL. Servers still do request → process → response. When you look at Spring you think "oh, this is their way of doing routing and middleware". You are not learning a framework: you are learning how computers talk to each other.'),
      visual: { type: 'blocks', pieces: [{ label: t('Entender el PORQUÉ', 'Understanding WHY'), emoji: '🧠' }, { label: t('Practicar el CÓMO', 'Practicing HOW'), emoji: '🔁' }], result: t('Aprender cualquier framework en días', 'Learn any framework in days'), resultEmoji: '🚀' },
      tip: t('"Quien entiende el PORQUÉ siempre guiará a quien solo sabe el CÓMO."', '"The person who understands WHY will always lead the person who only knows HOW."'),
    },
    {
      kind: 'recap',
      points: [
        t('🧱 Fase 1: lenguaje, Internet, terminal, Git.', '🧱 Phase 1: language, internet, terminal, Git.'),
        t('🗄️ Fase 2: SQL, API REST, CRUD.', '🗄️ Phase 2: SQL, REST API, CRUD.'),
        t('🔐 Fase 3: auth, caché, seguridad, tests, un proyecto grande.', '🔐 Phase 3: auth, caching, security, tests, a big project.'),
        t('🚀 Fase 4: Docker, nube, CI/CD, arquitectura.', '🚀 Phase 4: Docker, cloud, CI/CD, architecture.'),
        t('📈 Fase 5: siempre aprendiendo. Los conceptos duran décadas.', '📈 Phase 5: always learning. Concepts last decades.'),
      ],
    },
  ],
  practice: [
    { type: 'mcq', q: t('¿Con cuántos lenguajes recomienda empezar el artículo?', 'How many languages does the article recommend starting with?'), options: [t('Uno (JavaScript/Node.js o Python)', 'One (JavaScript/Node.js or Python)'), t('Tres a la vez', 'Three at once'), t('Ninguno, solo frameworks', 'None, just frameworks'), t('Todos los que puedas', 'As many as you can')], answer: 0, explain: t('Uno bien aprendido > cinco a medias.', 'One learned well > five half-learned.') },
    { type: 'mcq', q: t('¿En qué fase se aprende Docker y CI/CD?', 'In which phase do you learn Docker and CI/CD?'), options: [t('Fase 4: producción y escala', 'Phase 4: production & scale'), t('Fase 1', 'Phase 1'), t('Fase 2', 'Phase 2'), t('Nunca', 'Never')], answer: 0, explain: t('Primero construir, luego desplegar.', 'Build first, then deploy.') },
    { type: 'tf', q: t('Si entiendes los fundamentos, aprender un framework nuevo toma días, no meses.', 'If you understand the fundamentals, picking up a new framework takes days, not months.'), answer: true, explain: t('Esa es la gran lección.', 'That is the big takeaway.') },
    { type: 'match', q: t('¿En qué fase va cada tema?', 'Which phase does each topic go in?'), pairs: [['Git', t('Fase 1', 'Phase 1')], ['SQL', t('Fase 2', 'Phase 2')], ['JWT', t('Fase 3', 'Phase 3')], ['Docker', t('Fase 4', 'Phase 4')], ['Kafka', t('Fase 5', 'Phase 5')]], explain: t('Cada pieza en su momento.', 'Each piece at its time.') },
    { type: 'mcq', q: t('¿Qué proyecto sugiere la fase 2?', 'Which project does phase 2 suggest?'), options: [t('Un CRUD: lista de tareas o blog', 'A CRUD: todo list or blog'), t('Un sistema operativo', 'An operating system'), t('Un videojuego 3D', 'A 3D video game'), t('Un navegador web', 'A web browser')], answer: 0, explain: t('Create, Read, Update, Delete: la base de todo backend.', 'Create, Read, Update, Delete: the basis of every backend.') },
  ],
  labs: [{ id: 'road-check', sim: 'roadmap', title: t('Tu checklist', 'Your checklist'), desc: t('Marca lo que dominas, fase por fase.', 'Check off what you master, phase by phase.') }],
  cards: [
    { id: 'road-1', emoji: '🧱', front: t('Fase 1 (semanas 1–6)', 'Phase 1 (weeks 1–6)'), back: t('Un lenguaje · bases de programación · cómo funciona Internet · terminal · Git', 'One language · programming basics · how the internet works · terminal · Git') },
    { id: 'road-2', emoji: '🗄️', front: t('Fase 2 (semanas 7–12)', 'Phase 2 (weeks 7–12)'), back: t('SQL · API REST · conectar a BD · rutas y middleware · CRUD', 'SQL · REST API · connect to DB · routing and middleware · CRUD') },
    { id: 'road-3', emoji: '🔐', front: t('Fase 3 (semanas 13–20)', 'Phase 3 (weeks 13–20)'), back: t('Auth (JWT, hashing) · validación · Redis · seguridad · tests · proyecto grande', 'Auth (JWT, hashing) · validation · Redis · security · tests · big project') },
    { id: 'road-4', emoji: '🚀', front: t('Fase 4 (semanas 21–28)', 'Phase 4 (weeks 21–28)'), back: t('Docker · nube · CI/CD · logs y monitoreo · arquitectura · diseño de sistemas', 'Docker · cloud · CI/CD · logging & monitoring · architecture · system design') },
    { id: 'road-5', emoji: '🎯', front: t('La gran lección', 'The big takeaway'), back: t('Los frameworks cambian; los fundamentos duran décadas. Entiende el PORQUÉ.', 'Frameworks change; fundamentals last decades. Understand the WHY.') },
  ],
};
