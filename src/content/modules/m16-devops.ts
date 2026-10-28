import { t, type Module } from '../../types';

export const devops: Module = {
  id: 'devops',
  num: 16,
  emoji: '🐳',
  color: '#4cc9f0',
  title: t('DevOps básico', 'DevOps basics'),
  tagline: t('Docker, CI/CD y la nube', 'Docker, CI/CD and the cloud'),
  formula: {
    pieces: [
      { label: 'Docker', emoji: '🐳' },
      { label: 'CI/CD', emoji: '🏭' },
      { label: t('Nube', 'Cloud'), emoji: '☁️' },
    ],
    result: t('Código en producción', 'Code in production'),
  },
  lesson: [
    {
      kind: 'concept',
      emoji: '🌉',
      title: t('El puente entre escribir código y correrlo', 'The bridge between writing code and running it'),
      body: t('Tu código funciona en tu laptop. ¿Cómo llega a un servidor, de forma confiable, una y otra vez, sin pasos manuales? Eso es DevOps.', 'Your code works on your laptop. How does it reach a server, reliably, again and again, with no manual steps? That is DevOps.'),
      visual: { type: 'blocks', pieces: [{ label: t('Tu código', 'Your code'), emoji: '💻' }, { label: 'Docker', emoji: '🐳' }, { label: 'CI/CD', emoji: '🏭' }, { label: t('Nube', 'Cloud'), emoji: '☁️' }], result: t('Usuarios felices', 'Happy users'), resultEmoji: '🎉' },
    },
    {
      kind: 'concept',
      emoji: '📦',
      title: t('Docker: una caja con todo dentro', 'Docker: a box with everything inside'),
      body: t('Docker empaqueta tu app + todas sus dependencias en un CONTENEDOR. "Funciona en mi máquina" se convierte en "funciona en todas partes".', 'Docker packages your app + all its dependencies into a CONTAINER. "Works on my machine" becomes "works everywhere".'),
      analogy: { real: t('Un contenedor de barco: no importa qué barco, puerto o grúa lo mueva, el contenido llega igual porque la caja es estándar.', 'A shipping container: no matter which ship, port or crane moves it, the contents arrive the same because the box is standard.'), code: t('La misma imagen de Docker corre igual en tu Windows, en la Mac de tu compañero y en el servidor Linux de producción.', 'The same Docker image runs the same on your Windows, your teammate’s Mac and the production Linux server.') },
      code: { lang: 'docker', src: 'FROM node:20\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nCMD ["node", "server.js"]', caption: t('Un Dockerfile es la RECETA para construir el contenedor', 'A Dockerfile is the RECIPE to build the container') },
    },
    { kind: 'concept', emoji: '🧑‍🍳', title: t('Escribe la receta tú', 'Write the recipe yourself'), body: t('Ordena las líneas del Dockerfile (cada una explica qué hace), construye la imagen y córrela en 4 máquinas.', 'Order the Dockerfile lines (each one explains what it does), build the image and run it on 4 machines.'), visual: { type: 'sim', id: 'docker' } },
    { kind: 'check', exercise: { type: 'mcq', q: t('¿Por qué se copia package.json y se hace npm install ANTES de copiar el resto del código?', 'Why copy package.json and run npm install BEFORE copying the rest of the code?'), options: [t('Para reutilizar la capa de dependencias si solo cambia tu código (builds más rápidos)', 'To reuse the dependency layer if only your code changes (faster builds)'), t('Porque Docker lo exige siempre', 'Because Docker always requires it'), t('Para ocupar más espacio', 'To use more space'), t('No tiene ninguna razón', 'There is no reason')], answer: 0, explain: t('Docker cachea cada capa. Las dependencias cambian poco; tu código, mucho.', 'Docker caches each layer. Dependencies change rarely; your code, often.') } },
    {
      kind: 'concept',
      emoji: '🏭',
      title: t('CI/CD: la fábrica automática', 'CI/CD: the automatic factory'),
      body: t('CI (Integración Continua): cada vez que haces push, se corren las pruebas automáticamente. CD (Despliegue Continuo): si todo pasa, se despliega a producción solo. Si algo falla, el bug nunca llega a los usuarios.', 'CI (Continuous Integration): every time you push, tests run automatically. CD (Continuous Deployment): if everything passes, it deploys to production by itself. If something fails, the bug never reaches users.'),
      visual: { type: 'sim', id: 'cicd' },
      tip: t('Herramientas: GitHub Actions (la más fácil para empezar), GitLab CI, Jenkins.', 'Tools: GitHub Actions (easiest to start), GitLab CI, Jenkins.'),
    },
    {
      kind: 'concept',
      emoji: '☁️',
      title: t('La nube: dónde vive tu servidor', 'The cloud: where your server lives'),
      body: t('Tu servidor tiene que estar en algún lugar encendido 24/7. Los grandes son AWS (Amazon), GCP (Google) y Azure (Microsoft). Para empezar, Railway, Render o Fly.io te dejan desplegar sin la complejidad de la nube.', 'Your server has to live somewhere, on 24/7. The big ones are AWS (Amazon), GCP (Google) and Azure (Microsoft). To start, Railway, Render or Fly.io let you deploy without cloud complexity.'),
      visual: { type: 'compare', left: { emoji: '🏢', title: t('Los 3 grandes', 'The big 3'), color: 'var(--orange)', points: ['AWS (Amazon)', 'GCP (Google)', 'Azure (Microsoft)', t('Potentes, pero complejos', 'Powerful, but complex')] }, right: { emoji: '🚀', title: t('Para empezar', 'To start'), color: 'var(--green)', points: ['Railway', 'Render', 'Fly.io', t('Conectas GitHub y listo', 'Connect GitHub and done')] } },
    },
    {
      kind: 'recap',
      points: [
        t('🐳 Docker = tu app + dependencias en una caja estándar.', '🐳 Docker = your app + dependencies in a standard box.'),
        t('📜 Dockerfile = la receta (FROM, WORKDIR, COPY, RUN, CMD).', '📜 Dockerfile = the recipe (FROM, WORKDIR, COPY, RUN, CMD).'),
        t('🏭 CI = pruebas en cada push · CD = deploy automático si pasan.', '🏭 CI = tests on every push · CD = auto deploy if they pass.'),
        t('☁️ AWS/GCP/Azure, o Railway/Render/Fly.io para empezar.', '☁️ AWS/GCP/Azure, or Railway/Render/Fly.io to start.'),
      ],
    },
  ],
  practice: [
    { type: 'order', q: t('Ordena el Dockerfile', 'Order the Dockerfile'), items: ['FROM node:20', 'WORKDIR /app', 'COPY package*.json ./', 'RUN npm install', 'COPY . .', 'CMD ["node", "server.js"]'], explain: t('Base → carpeta → dependencias → instalar → código → arrancar.', 'Base → folder → dependencies → install → code → start.') , dotnet: { type: 'order', q: t('Ordena el Dockerfile de una API .NET', 'Order the Dockerfile of a .NET API'), items: ['FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build', 'COPY *.csproj ./', 'RUN dotnet restore', 'COPY . .', 'RUN dotnet publish -c Release -o /app', 'FROM mcr.microsoft.com/dotnet/aspnet:10.0', 'COPY --from=build /app .', 'ENTRYPOINT ["dotnet", "MiApi.dll"]'], explain: t('Etapa 1 (SDK): restaurar y compilar. Etapa 2 (solo runtime): una imagen final mucho más pequeña.', 'Stage 1 (SDK): restore and build. Stage 2 (runtime only): a much smaller final image.') } },
    { type: 'match', q: t('Une cada instrucción de Dockerfile', 'Match each Dockerfile instruction'), pairs: [['FROM', t('Imagen base', 'Base image')], ['WORKDIR', t('Carpeta de trabajo', 'Working folder')], ['RUN', t('Ejecutar al construir', 'Run while building')], ['CMD', t('Comando al arrancar', 'Command on start')]], explain: t('Las 4 palabras clave de casi todo Dockerfile.', 'The 4 keywords of almost every Dockerfile.') },
    { type: 'mcq', q: t('¿Qué hace CI (Integración Continua)?', 'What does CI (Continuous Integration) do?'), options: [t('Corre las pruebas automáticamente en cada push', 'Runs tests automatically on every push'), t('Escribe el código por ti', 'Writes the code for you'), t('Compra servidores', 'Buys servers'), t('Diseña la base de datos', 'Designs the database')], answer: 0, explain: t('Detecta problemas antes de producción.', 'Catches problems before production.') },
    { type: 'tf', q: t('Con CI/CD, si las pruebas fallan el código se despliega igual.', 'With CI/CD, if tests fail the code deploys anyway.'), answer: false, explain: t('El deploy se bloquea: esa es la gracia.', 'The deploy is blocked: that is the point.') },
    { type: 'type', q: t('Escribe el comando para construir una imagen llamada myapp desde la carpeta actual', 'Write the command to build an image named myapp from the current folder'), accept: ['docker build -t myapp .'], explain: 'docker build -t myapp .' },
    { type: 'mcq', q: t('Estás empezando y quieres desplegar tu primera API sin complicarte. ¿Qué sugiere el artículo?', 'You are starting and want to deploy your first API without hassle. What does the article suggest?'), options: ['Railway / Render / Fly.io', t('Montar tu propio datacenter', 'Build your own datacenter'), t('Kubernetes con 50 nodos', 'Kubernetes with 50 nodes'), t('Un USB', 'A USB stick')], answer: 0, explain: t('Plataformas simples primero.', 'Simple platforms first.') },
  ],
  labs: [
    { id: 'ops-docker', sim: 'docker', title: t('Construye un contenedor', 'Build a container'), desc: t('Ordena, construye y corre en todas partes.', 'Order, build and run everywhere.') },
    { id: 'ops-cicd', sim: 'cicd', title: t('Pipeline de CI/CD', 'CI/CD pipeline'), desc: t('Un bug bloqueado y un deploy exitoso.', 'A blocked bug and a successful deploy.') },
  ],
  cards: [
    { id: 'ops-1', emoji: '🐳', front: 'Docker', back: t('Empaqueta tu app y sus dependencias en un contenedor que corre igual en cualquier máquina.', 'Packages your app and its dependencies into a container that runs the same on any machine.') },
    { id: 'ops-2', emoji: '📜', front: 'Dockerfile', back: t('La receta para construir la imagen: FROM, WORKDIR, COPY, RUN, CMD.', 'The recipe to build the image: FROM, WORKDIR, COPY, RUN, CMD.') },
    { id: 'ops-3', emoji: '▶️', front: 'docker build  /  docker run', back: t('build: construir la imagen desde el Dockerfile.\nrun: arrancar un contenedor de esa imagen.', 'build: build the image from the Dockerfile.\nrun: start a container from that image.') },
    { id: 'ops-4', emoji: '🏭', front: 'CI vs CD', back: t('CI: pruebas automáticas en cada push.\nCD: despliegue automático si las pruebas pasan.', 'CI: automatic tests on every push.\nCD: automatic deployment if tests pass.') },
    { id: 'ops-5', emoji: '⚙️', front: t('Herramientas de CI/CD', 'CI/CD tools'), back: 'GitHub Actions · GitLab CI · Jenkins' },
    { id: 'ops-6', emoji: '☁️', front: t('¿Dónde desplegar?', 'Where to deploy?'), back: t('Grandes: AWS, GCP, Azure.\nPara empezar: Railway, Render, Fly.io.', 'Big ones: AWS, GCP, Azure.\nTo start: Railway, Render, Fly.io.') },
  ],
};
