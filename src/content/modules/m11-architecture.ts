import { t, type Module } from '../../types';

export const architecture: Module = {
  id: 'architecture',
  num: 11,
  emoji: '🏗️',
  color: '#7c6cff',
  title: t('Patrones de arquitectura', 'Architecture patterns'),
  tagline: t('Monolito, microservicios, MVC y eventos', 'Monolith, microservices, MVC and events'),
  formula: {
    pieces: [
      { label: 'Model', emoji: '📦' },
      { label: 'View', emoji: '🖼️' },
      { label: 'Controller', emoji: '🎮' },
    ],
    result: 'MVC',
  },
  lesson: [
    {
      kind: 'concept',
      emoji: '🏗️',
      title: t('Cómo organizas el código importa (cada vez más)', 'How you organize code matters (more and more)'),
      body: t('Con 3 archivos da igual. Con 300 archivos y 10 personas, la organización decide si el proyecto avanza o se convierte en un laberinto. Veamos los 4 patrones del artículo.', 'With 3 files it does not matter. With 300 files and 10 people, organization decides whether the project moves forward or becomes a maze. Let us see the article’s 4 patterns.'),
    },
    {
      kind: 'concept',
      emoji: '🏠',
      title: t('Monolito: una casa grande', 'Monolith: one big house'),
      body: t('Todo en UNA aplicación: un código, un despliegue, una base de datos. Empieza aquí. Es más simple de crear, depurar y desplegar. Perfecto para aprender y para apps pequeñas y medianas.', 'Everything in ONE application: one codebase, one deployment, one database. Start here. It is simpler to build, debug and deploy. Perfect for learning and for small-to-medium apps.'),
      visual: { type: 'blocks', pieces: [{ label: t('Usuarios', 'Users'), emoji: '👤' }, { label: t('Pedidos', 'Orders'), emoji: '🧾' }, { label: t('Pagos', 'Payments'), emoji: '💳' }], result: t('1 app', '1 app'), resultEmoji: '🏠' },
    },
    {
      kind: 'concept',
      emoji: '🏘️',
      title: t('Microservicios: un barrio de casitas', 'Microservices: a neighborhood of small houses'),
      body: t('La app se parte en servicios pequeños e independientes que se hablan por la red: Usuarios, Pedidos, Pagos… cada uno con su código, su despliegue y a veces su BD. NO lo hagas hasta tener una razón: añade muchísima complejidad. Netflix y Amazon lo usan porque tienen miles de desarrolladores.', 'The app is split into small independent services that talk over the network: Users, Orders, Payments… each with its own code, deployment and sometimes its own DB. Do NOT do this until you have a reason: it adds massive complexity. Netflix and Amazon use it because they have thousands of developers.'),
      visual: { type: 'sim', id: 'monoMicro' },
    },
    { kind: 'check', exercise: { type: 'mcq', q: t('Empiezas un proyecto nuevo tú solo. ¿Qué arquitectura recomienda el artículo?', 'You are starting a new project alone. Which architecture does the article recommend?'), options: [t('Monolito', 'Monolith'), t('Microservicios', 'Microservices'), t('20 servicios con Kafka', '20 services with Kafka'), t('Ninguna', 'None')], answer: 0, explain: t('Monolito primero; microservicios solo cuando haya una razón real.', 'Monolith first; microservices only when there is a real reason.') } },
    {
      kind: 'concept',
      emoji: '🧩',
      title: t('MVC: el patrón dentro de casi todo backend', 'MVC: the pattern inside almost every backend'),
      body: t('Model = tus datos (la clase User, Order). View = lo que se muestra (HTML, o JSON en una API). Controller = recibe requests, usa los modelos y devuelve la vista. Rails, Laravel, Django y Spring MVC son variaciones de esto.', 'Model = your data (the User, Order class). View = what is shown (HTML, or JSON in an API). Controller = receives requests, uses the models and returns the view. Rails, Laravel, Django and Spring MVC are variations of this.'),
      visual: { type: 'sequence', actors: [{ id: 'u', label: t('Usuario', 'User'), emoji: '🧑' }, { id: 'c', label: 'Controller', emoji: '🎮' }, { id: 'm', label: 'Model', emoji: '📦' }, { id: 'v', label: 'View', emoji: '🖼️' }], messages: [{ from: 'u', to: 'c', label: 'GET /users/42' }, { from: 'c', to: 'm', label: 'User.find(42)' }, { from: 'm', to: 'c', label: '{ id: 42, name: "Ahmed" }' }, { from: 'c', to: 'v', label: t('render(user)', 'render(user)') }, { from: 'v', to: 'u', label: t('HTML o JSON', 'HTML or JSON') }] },
      tip: t('Django lo llama MTV (Model-Template-View). Mismo concepto, otro nombre: cuando entiendes la idea, cualquier framework se lee fácil.', 'Django calls it MTV (Model-Template-View). Same concept, different name: once you get the idea, any framework is easy to read.'),
    },
    { kind: 'check', exercise: { type: 'match', q: t('Une cada parte de MVC', 'Match each part of MVC'), pairs: [['Model', t('Los datos (clase User)', 'The data (User class)')], ['View', t('Lo que se muestra (HTML/JSON)', 'What is shown (HTML/JSON)')], ['Controller', t('Recibe el request y coordina', 'Receives the request and coordinates')]], explain: t('M datos · V presentación · C coordinación.', 'M data · V presentation · C coordination.') } },
    {
      kind: 'concept',
      emoji: '📣',
      title: t('Arquitectura orientada a eventos', 'Event-driven architecture'),
      body: t('En vez de llamarse entre sí, los servicios publican EVENTOS en una cola (RabbitMQ, Kafka). "¡Se hizo un pedido!". Email envía la confirmación, Inventario descuenta stock… sin conocerse. Si uno se cae, los eventos esperan en la cola.', 'Instead of calling each other, services publish EVENTS to a queue (RabbitMQ, Kafka). "An order was placed!". Email sends the confirmation, Inventory updates stock… without knowing each other. If one is down, the events wait in the queue.'),
      visual: { type: 'sim', id: 'pubsub' },
      analogy: { real: t('Un megáfono en la plaza: "¡Llegó el pan!". El que necesite pan va; el panadero no tiene que llamar a cada vecino.', 'A megaphone in the square: "The bread is here!". Whoever needs bread comes; the baker does not have to call each neighbor.'), code: t('orderService.publish("OrderPlaced", order). Email e Inventario están suscritos y reaccionan.', 'orderService.publish("OrderPlaced", order). Email and Inventory are subscribed and react.') },
      tip: t('Patrón avanzado: entiéndelo ahora; impleméntalo cuando lo necesites.', 'Advanced pattern: understand it now; implement it when you need it.'),
    },
    {
      kind: 'recap',
      points: [
        t('🏠 Monolito: una app. Empieza aquí.', '🏠 Monolith: one app. Start here.'),
        t('🏘️ Microservicios: muchas apps pequeñas. Solo con una razón real.', '🏘️ Microservices: many small apps. Only with a real reason.'),
        t('🧩 MVC: Model (datos) + View (salida) + Controller (coordina).', '🧩 MVC: Model (data) + View (output) + Controller (coordinates).'),
        t('📣 Eventos: publicar en una cola; quien quiera, reacciona.', '📣 Events: publish to a queue; whoever cares reacts.'),
      ],
    },
  ],
  practice: [
    { type: 'tf', q: t('Los microservicios siempre son mejores que un monolito.', 'Microservices are always better than a monolith.'), answer: false, explain: t('Añaden complejidad enorme. Se usan cuando hay muchos equipos o necesidades de escala.', 'They add huge complexity. They are used when there are many teams or scaling needs.') },
    { type: 'mcq', q: t('En un monolito, un bug en Pagos tumba la app. ¿Qué pasaría con microservicios?', 'In a monolith, a bug in Payments takes down the app. What would happen with microservices?'), options: [t('Solo caería el servicio de Pagos', 'Only the Payments service would go down'), t('Caería todo igual', 'Everything would go down anyway'), t('No existen los bugs', 'Bugs do not exist'), t('Se borra la BD', 'The DB is deleted')], answer: 0, explain: t('Aislamiento de fallos: una ventaja real de los microservicios.', 'Fault isolation: a real advantage of microservices.') },
    { type: 'mcq', q: t('En una API REST con MVC, ¿qué es la "View"?', 'In a REST API with MVC, what is the "View"?'), options: [t('El JSON que se devuelve', 'The JSON that is returned'), t('La base de datos', 'The database'), t('El router', 'The router'), t('El navegador', 'The browser')], answer: 0, explain: t('En APIs, la vista es la respuesta JSON.', 'In APIs, the view is the JSON response.') },
    { type: 'match', q: t('Une cada herramienta/concepto', 'Match each tool/concept'), pairs: [['RabbitMQ / Kafka', t('Cola de mensajes', 'Message queue')], ['Rails / Laravel', 'MVC'], ['Netflix / Amazon', t('Microservicios', 'Microservices')], [t('Proyecto nuevo y pequeño', 'New small project'), t('Monolito', 'Monolith')]], explain: t('Cada pieza en su lugar.', 'Each piece in its place.') },
    { type: 'mcq', q: t('Con una cola de eventos, el servicio de Email está caído y se hace un pedido. ¿Qué pasa?', 'With an event queue, the Email service is down and an order is placed. What happens?'), options: [t('El pedido se crea; el evento espera en la cola hasta que Email vuelva', 'The order is created; the event waits in the queue until Email is back'), t('El pedido falla con 500', 'The order fails with 500'), t('Se pierde el email para siempre', 'The email is lost forever'), t('Se cae toda la app', 'The whole app goes down')], answer: 0, explain: t('Desacoplamiento: los servicios no dependen unos de otros en tiempo real.', 'Decoupling: services do not depend on each other in real time.') },
    { type: 'order', q: t('Ordena el flujo MVC', 'Order the MVC flow'), items: [t('Llega el request al Controller', 'The request reaches the Controller'), t('El Controller pide datos al Model', 'The Controller asks the Model for data'), t('El Model devuelve los datos', 'The Model returns the data'), t('El Controller pasa los datos a la View', 'The Controller passes the data to the View'), t('La View genera HTML/JSON para el usuario', 'The View generates HTML/JSON for the user')], explain: t('C → M → C → V → usuario.', 'C → M → C → V → user.') },
  ],
  labs: [
    { id: 'arch-mono', sim: 'monoMicro', title: t('Monolito vs microservicios', 'Monolith vs microservices'), desc: t('Despliega y rompe en ambos modelos.', 'Deploy and break things in both models.') },
    { id: 'arch-events', sim: 'pubsub', title: t('Eventos y colas', 'Events and queues'), desc: t('Publica pedidos y apaga servicios.', 'Publish orders and turn off services.') },
  ],
  cards: [
    { id: 'arch-1', emoji: '🏠', front: t('Monolito', 'Monolith'), back: t('Toda la app en un código y un despliegue. Simple. Empieza aquí.', 'The whole app in one codebase and deployment. Simple. Start here.') },
    { id: 'arch-2', emoji: '🏘️', front: t('Microservicios', 'Microservices'), back: t('App dividida en servicios independientes que se hablan por red. Mucha complejidad: solo con una razón.', 'App split into independent services talking over the network. Lots of complexity: only with a reason.') },
    { id: 'arch-3', emoji: '🧩', front: 'MVC', back: t('Model (datos) · View (HTML/JSON) · Controller (recibe y coordina)', 'Model (data) · View (HTML/JSON) · Controller (receives and coordinates)') },
    { id: 'arch-4', emoji: '📣', front: t('Arquitectura orientada a eventos', 'Event-driven architecture'), back: t('Los servicios publican eventos en una cola (RabbitMQ/Kafka); otros reaccionan sin conocerse.', 'Services publish events to a queue (RabbitMQ/Kafka); others react without knowing each other.') },
    { id: 'arch-5', emoji: '🛡️', front: t('Ventaja de una cola de mensajes', 'Advantage of a message queue'), back: t('Si un servicio se cae, los eventos esperan; nada se pierde y el resto sigue funcionando.', 'If a service goes down, events wait; nothing is lost and the rest keeps working.') },
  ],
};
