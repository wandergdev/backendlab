import { t, type Module } from '../../types';

export const internet: Module = {
  id: 'internet',
  num: 1,
  emoji: '🌐',
  color: '#4cc9f0',
  title: t('Cómo funciona Internet', 'How the Internet works'),
  tagline: t('DNS, IP, TCP, puertos y HTTP: el viaje de un clic', 'DNS, IP, TCP, ports and HTTP: the journey of a click'),
  formula: {
    pieces: [
      { label: t('Nombre', 'Name'), emoji: '🔤' },
      { label: 'DNS', emoji: '📞' },
      { label: 'IP + ' + 'Puerto', emoji: '🏠' },
      { label: 'HTTP', emoji: '💬' },
    ],
    result: t('Página web', 'Web page'),
  },
  lesson: [
    {
      kind: 'concept',
      emoji: '🤔',
      title: t('¿Qué pasa cuando escribes google.com?', 'What happens when you type google.com?'),
      body: t(
        'Parece magia: escribes un nombre y aparece una página. Pero detrás hay 4 piezas muy simples trabajando en equipo. Vamos a verlas una por una, como cuando aprendemos letras antes de leer palabras.',
        'It looks like magic: you type a name and a page appears. But behind it there are 4 very simple pieces working as a team. Let us see them one by one, like learning letters before reading words.',
      ),
      visual: {
        type: 'blocks',
        pieces: [
          { label: t('Nombre', 'Name'), emoji: '🔤' },
          { label: 'DNS', emoji: '📞' },
          { label: 'IP', emoji: '🏠' },
          { label: 'TCP', emoji: '📮' },
          { label: 'HTTP', emoji: '💬' },
        ],
        result: t('google.com cargada', 'google.com loaded'),
        resultEmoji: '✅',
      },
    },
    {
      kind: 'concept',
      emoji: '🔢',
      title: t('Las computadoras solo entienden números', 'Computers only understand numbers'),
      body: t(
        'Cada computadora conectada a Internet tiene una dirección numérica llamada IP, por ejemplo 142.250.80.46. Es como la dirección de una casa: sin ella, nadie sabe a dónde llevar el paquete.',
        'Every computer connected to the internet has a numeric address called an IP, for example 142.250.80.46. It is like a house address: without it, nobody knows where to deliver the package.',
      ),
      visual: {
        type: 'blocks',
        pieces: [
          { label: 'google.com', emoji: '🔤', color: '#ff9f43' },
          { label: t('se traduce a', 'translates to'), emoji: '➡️', color: '#a29bfe' },
        ],
        result: '142.250.80.46',
        resultEmoji: '🏠',
      },
      analogy: {
        real: t('Tú recuerdas el nombre de tu amigo, pero para llamarlo necesitas su número de teléfono.', 'You remember your friend’s name, but to call them you need their phone number.'),
        code: t('Tú recuerdas "google.com", pero tu computadora necesita la IP 142.250.80.46 para conectarse.', 'You remember "google.com", but your computer needs the IP 142.250.80.46 to connect.'),
      },
    },
    {
      kind: 'concept',
      emoji: '📞',
      title: t('DNS: la agenda de contactos de Internet', 'DNS: the contact list of the internet'),
      body: t(
        'DNS (Domain Name System) es el servicio que traduce nombres a IPs. Tu computadora pregunta: "¿cuál es la IP de google.com?" y DNS responde "142.250.80.46". Luego tu computadora la guarda un rato (caché) para no volver a preguntar.',
        'DNS (Domain Name System) is the service that translates names into IPs. Your computer asks: "what is the IP of google.com?" and DNS answers "142.250.80.46". Then your computer keeps it for a while (cache) so it does not ask again.',
      ),
      visual: {
        type: 'sequence',
        actors: [
          { id: 'pc', label: t('Tu computadora', 'Your computer'), emoji: '💻' },
          { id: 'dns', label: 'DNS', emoji: '📞' },
          { id: 'g', label: 'google.com', emoji: '🖥️' },
        ],
        messages: [
          { from: 'pc', to: 'dns', label: t('¿IP de google.com?', 'IP of google.com?') },
          { from: 'dns', to: 'pc', label: '142.250.80.46' },
          { from: 'pc', to: 'pc', label: t('Guardo la IP en caché', 'Cache the IP') },
          { from: 'pc', to: 'g', label: t('Conectar a 142.250.80.46', 'Connect to 142.250.80.46') },
        ],
      },
    },
    { kind: 'check', exercise: { type: 'mcq', q: t('¿Qué hace el DNS?', 'What does DNS do?'), options: [t('Traduce nombres (google.com) a direcciones IP', 'Translates names (google.com) into IP addresses'), t('Cifra las contraseñas', 'Encrypts passwords'), t('Guarda las páginas web', 'Stores web pages'), t('Acelera tu Wi-Fi', 'Speeds up your Wi-Fi')], answer: 0, explain: t('DNS = agenda de contactos. Nombre → número (IP).', 'DNS = contact list. Name → number (IP).') } },
    {
      kind: 'concept',
      emoji: '🧪',
      title: t('Pruébalo tú: el viaje de una pregunta DNS', 'Try it: the journey of a DNS question'),
      body: t('Escribe un dominio y mira por cuántos servidores pasa la pregunta. Luego búscalo otra vez: ¡la caché lo responde al instante!', 'Type a domain and watch how many servers the question goes through. Then look it up again: the cache answers instantly!'),
      visual: { type: 'sim', id: 'dns' },
    },
    {
      kind: 'concept',
      emoji: '📮',
      title: t('IP + TCP: dirección y entrega garantizada', 'IP + TCP: address and guaranteed delivery'),
      body: t(
        'IP es la dirección escrita en el paquete: dice A DÓNDE va. TCP es el servicio de mensajería que te hace firmar al recibir: se asegura de que TODO llegue, completo y en orden. Si un pedazo se pierde, TCP lo vuelve a enviar.',
        'IP is the address written on the package: it says WHERE it goes. TCP is the courier that makes you sign on delivery: it makes sure EVERYTHING arrives, complete and in order. If a piece is lost, TCP sends it again.',
      ),
      visual: {
        type: 'blocks',
        pieces: [
          { label: t('IP = a dónde', 'IP = where'), emoji: '🏠' },
          { label: t('TCP = llega completo', 'TCP = arrives complete'), emoji: '✍️' },
        ],
        result: t('Paquete entregado', 'Package delivered'),
        resultEmoji: '📦',
      },
      analogy: {
        real: t('Envías un libro por correo en 10 sobres numerados. El cartero confirma cada sobre y, si uno se pierde, lo reenvía.', 'You mail a book in 10 numbered envelopes. The courier confirms each envelope and, if one is lost, resends it.'),
        code: t('Tu página web viaja partida en muchos paquetes. TCP los numera, confirma cada uno y el navegador los vuelve a unir en orden.', 'Your web page travels split into many packets. TCP numbers them, confirms each one and the browser puts them back together in order.'),
      },
    },
    {
      kind: 'concept',
      emoji: '🤝',
      title: t('El saludo de TCP (three-way handshake)', 'The TCP greeting (three-way handshake)'),
      body: t('Antes de enviar datos, cliente y servidor se saludan en 3 pasos para confirmar que ambos están listos. Cada vez que un usuario abre tu app, pasa esto.', 'Before sending data, client and server greet each other in 3 steps to confirm both are ready. Every time a user opens your app, this happens.'),
      visual: {
        type: 'sequence',
        actors: [
          { id: 'c', label: t('Cliente', 'Client'), emoji: '📱' },
          { id: 's', label: t('Servidor', 'Server'), emoji: '🖥️' },
        ],
        messages: [
          { from: 'c', to: 's', label: t('SYN: "¿Hola, me escuchas?"', 'SYN: "Hi, can you hear me?"') },
          { from: 's', to: 'c', label: t('SYN-ACK: "Sí, ¿y tú a mí?"', 'SYN-ACK: "Yes, can you hear me?"') },
          { from: 'c', to: 's', label: t('ACK: "¡Sí! Empecemos"', 'ACK: "Yes! Let us start"') },
          { from: 'c', to: 's', label: t('Ahora sí: los datos (HTTP)', 'Now: the data (HTTP)'), color: 'var(--yellow)' },
        ],
      },
    },
    {
      kind: 'concept',
      emoji: '🚪',
      title: t('Puertos: las puertas del edificio', 'Ports: the doors of the building'),
      body: t(
        'Un servidor es como un edificio y cada servicio vive detrás de una puerta numerada. La IP te lleva al edificio; el puerto te lleva a la puerta correcta.',
        'A server is like a building and each service lives behind a numbered door. The IP takes you to the building; the port takes you to the right door.',
      ),
      visual: {
        type: 'grid',
        items: [
          { badge: '80', title: 'HTTP', desc: t('Tráfico web normal', 'Normal web traffic'), color: '#ff9f43' },
          { badge: '443', title: 'HTTPS', desc: t('Tráfico web seguro 🔒', 'Secure web traffic 🔒'), color: '#00d29a' },
          { badge: '5432', title: 'PostgreSQL', desc: t('Base de datos', 'Database'), color: '#4cc9f0' },
          { badge: '3306', title: 'MySQL', desc: t('Base de datos', 'Database'), color: '#f78fb3' },
          { badge: '27017', title: 'MongoDB', desc: t('Base de datos NoSQL', 'NoSQL database'), color: '#7c6cff' },
          { badge: '22', title: 'SSH', desc: t('Control remoto del servidor', 'Remote server control'), color: '#ffd166' },
        ],
      },
    },
    {
      kind: 'concept',
      emoji: '🧩',
      title: t('IP + Puerto = la puerta exacta', 'IP + Port = the exact door'),
      body: t('Cuando ves algo como 142.250.80.46:443 estás leyendo "edificio : puerta". Así se escribe una dirección completa de un servicio.', 'When you see something like 142.250.80.46:443 you are reading "building : door". That is how a full service address is written.'),
      visual: {
        type: 'blocks',
        pieces: [
          { label: '142.250.80.46', emoji: '🏢' },
          { label: ':443', emoji: '🚪' },
        ],
        result: t('Web segura de Google', 'Google secure web'),
        resultEmoji: '🔒',
      },
      code: { lang: 'bash', src: '# Tu servidor de desarrollo suele vivir en tu propia máquina:\nhttp://localhost:3000\n#      └ edificio ┘└puerta┘', caption: t('localhost = "esta misma computadora" (127.0.0.1)', 'localhost = "this same computer" (127.0.0.1)') },
    },
    { kind: 'check', exercise: { type: 'match', q: t('Une cada puerto con su servicio', 'Match each port with its service'), pairs: [['80', 'HTTP'], ['443', 'HTTPS'], ['5432', 'PostgreSQL'], ['27017', 'MongoDB']], explain: t('80 web, 443 web segura, 5432 Postgres, 27017 Mongo. ¡Repítelos en voz alta!', '80 web, 443 secure web, 5432 Postgres, 27017 Mongo. Say them out loud!') } },
    {
      kind: 'concept',
      emoji: '💬',
      title: t('HTTP: el idioma de la web', 'HTTP: the language of the web'),
      body: t(
        'Una vez conectados, navegador y servidor hablan HTTP. El navegador envía un REQUEST (petición) y el servidor contesta con un RESPONSE (respuesta). HTTPS es exactamente lo mismo, pero cifrado: nadie en el camino puede leerlo.',
        'Once connected, browser and server speak HTTP. The browser sends a REQUEST and the server answers with a RESPONSE. HTTPS is exactly the same, but encrypted: nobody on the way can read it.',
      ),
      visual: {
        type: 'sequence',
        actors: [
          { id: 'b', label: t('Navegador', 'Browser'), emoji: '🧑‍💻' },
          { id: 's', label: t('Servidor', 'Server'), emoji: '🖥️' },
        ],
        messages: [
          { from: 'b', to: 's', label: 'GET /  (request)', note: t('"Dame la página principal"', '"Give me the home page"') },
          { from: 's', to: 'b', label: '200 OK + HTML  (response)', note: t('"Aquí la tienes"', '"Here it is"') },
        ],
      },
      tip: t('Todo el desarrollo web, en su núcleo, es esto: requests y responses. Lo verás en TODOS los módulos.', 'All of web development, at its core, is this: requests and responses. You will see it in EVERY module.'),
    },
    {
      kind: 'concept',
      emoji: '🎬',
      title: t('La película completa de un clic', 'The full movie of a click'),
      body: t('Ahora junta todas las letras para leer la palabra completa. Dale a reproducir y nombra cada paso en voz alta antes de que aparezca.', 'Now put all the letters together to read the whole word. Press play and name each step out loud before it appears.'),
      visual: {
        type: 'sequence',
        actors: [
          { id: 'u', label: t('Tú', 'You'), emoji: '🧑' },
          { id: 'b', label: t('Navegador', 'Browser'), emoji: '🌐' },
          { id: 'd', label: 'DNS', emoji: '📞' },
          { id: 's', label: t('Servidor', 'Server'), emoji: '🖥️' },
        ],
        messages: [
          { from: 'u', to: 'b', label: t('escribe google.com', 'types google.com') },
          { from: 'b', to: 'd', label: t('¿IP?', 'IP?') },
          { from: 'd', to: 'b', label: '142.250.80.46' },
          { from: 'b', to: 's', label: t('TCP: SYN / ACK', 'TCP: SYN / ACK'), note: t('puerto 443', 'port 443') },
          { from: 'b', to: 's', label: 'HTTPS GET /' },
          { from: 's', to: 'b', label: '200 OK + HTML' },
          { from: 'b', to: 'u', label: t('muestra la página 🎉', 'shows the page 🎉') },
        ],
      },
    },
    { kind: 'check', exercise: { type: 'order', q: t('Ordena lo que pasa al escribir una dirección web', 'Order what happens when you type a web address'), items: [t('Escribes el nombre del sitio', 'You type the site name'), t('DNS traduce el nombre a una IP', 'DNS translates the name to an IP'), t('Se abre una conexión TCP con la IP y el puerto', 'A TCP connection opens to the IP and port'), t('El navegador envía un request HTTP', 'The browser sends an HTTP request'), t('El servidor responde y ves la página', 'The server responds and you see the page')], explain: t('Nombre → DNS → TCP → HTTP → página. ¡Esa es la película completa!', 'Name → DNS → TCP → HTTP → page. That is the whole movie!') } },
    {
      kind: 'recap',
      points: [
        t('🔤 Las computadoras usan números (IP), no nombres.', '🔤 Computers use numbers (IPs), not names.'),
        t('📞 DNS traduce nombre → IP (y lo guarda en caché).', '📞 DNS translates name → IP (and caches it).'),
        t('📮 IP dice A DÓNDE; TCP garantiza que TODO llegue en orden.', '📮 IP says WHERE; TCP guarantees EVERYTHING arrives in order.'),
        t('🚪 El puerto es la puerta: 80 HTTP, 443 HTTPS, 5432 Postgres.', '🚪 The port is the door: 80 HTTP, 443 HTTPS, 5432 Postgres.'),
        t('💬 HTTP = request y response. HTTPS = lo mismo, cifrado.', '💬 HTTP = request and response. HTTPS = the same, encrypted.'),
      ],
    },
  ],
  practice: [
    { type: 'mcq', q: t('Tu computadora quiere conectarse a "github.com". ¿Qué necesita primero?', 'Your computer wants to connect to "github.com". What does it need first?'), options: [t('Su dirección IP, preguntándole al DNS', 'Its IP address, by asking DNS'), t('Su contraseña', 'Its password'), t('Una base de datos', 'A database'), t('Un puerto 5432', 'Port 5432')], answer: 0, explain: t('Sin IP no hay a dónde ir. DNS te la da.', 'Without an IP there is nowhere to go. DNS gives it to you.') },
    { type: 'tf', q: t('HTTPS es un lenguaje distinto a HTTP.', 'HTTPS is a different language from HTTP.'), answer: false, explain: t('Es el mismo HTTP, pero viajando cifrado (la S = Secure).', 'It is the same HTTP, but travelling encrypted (the S = Secure).') },
    { type: 'mcq', q: t('¿Qué protocolo se asegura de que los datos lleguen completos y en orden?', 'Which protocol makes sure data arrives complete and in order?'), options: ['TCP', 'DNS', 'HTML', 'JSON'], answer: 0, explain: t('TCP = el cartero que te hace firmar y reenvía lo perdido.', 'TCP = the courier who makes you sign and resends what was lost.') },
    { type: 'type', q: t('¿Qué puerto usa el tráfico web SEGURO (HTTPS)?', 'Which port does SECURE web traffic (HTTPS) use?'), accept: ['443'], placeholder: '___', explain: t('443 = HTTPS. 80 = HTTP normal.', '443 = HTTPS. 80 = plain HTTP.') },
    { type: 'match', q: t('Une cada concepto con su analogía', 'Match each concept with its analogy'), pairs: [['DNS', t('Agenda de contactos', 'Contact list')], ['IP', t('Dirección de la casa', 'House address')], ['TCP', t('Cartero que te hace firmar', 'Courier who makes you sign')], [t('Puerto', 'Port'), t('Puerta del edificio', 'Door of the building')]], explain: t('Cuatro piezas, cuatro analogías. Cuando dudes, vuelve a la analogía.', 'Four pieces, four analogies. When in doubt, go back to the analogy.') },
    { type: 'mcq', q: t('En "http://localhost:3000", ¿qué es 3000?', 'In "http://localhost:3000", what is 3000?'), options: [t('El puerto', 'The port'), t('La IP', 'The IP'), t('El número de usuarios', 'The number of users'), t('La versión de HTTP', 'The HTTP version')], answer: 0, explain: t('localhost es el edificio (tu propia máquina) y 3000 la puerta.', 'localhost is the building (your own machine) and 3000 is the door.') },
    { type: 'order', q: t('Ordena el saludo TCP', 'Order the TCP handshake'), items: ['SYN', 'SYN-ACK', 'ACK', t('Datos HTTP', 'HTTP data')], explain: t('"¿Me escuchas?" → "Sí, ¿y tú?" → "¡Sí!" → ahora hablamos.', '"Can you hear me?" → "Yes, and you?" → "Yes!" → now we talk.') },
    { type: 'tf', q: t('Después de la primera consulta DNS, la IP se suele guardar en caché para ir más rápido.', 'After the first DNS lookup, the IP is usually cached to go faster.'), answer: true, explain: t('Por eso la segunda visita a un sitio es más rápida.', 'That is why the second visit to a site is faster.') },
    { type: 'mcq', q: t('Un usuario abre tu app móvil. ¿Qué se crea entre su teléfono y tu servidor?', 'A user opens your mobile app. What is created between their phone and your server?'), options: [t('Una conexión TCP', 'A TCP connection'), t('Un archivo CSV', 'A CSV file'), t('Una tabla SQL', 'A SQL table'), t('Un contenedor Docker', 'A Docker container')], answer: 0, explain: t('Todo lo que hace tu servidor pasa por conexiones TCP/IP.', 'Everything your server does goes through TCP/IP connections.') },
    { type: 'fill', q: t('Completa la frase clave del módulo', 'Complete the key sentence of the module'), lang: 'text', template: 'El navegador envía un ___ y el servidor contesta con un ___.', blanks: ['request', 'response'], distractors: ['commit', 'puerto'], explain: t('Request → Response. El corazón de toda la web.', 'Request → Response. The heart of the whole web.') },
  ],
  labs: [
    { id: 'internet-dns', sim: 'dns', title: t('Laboratorio DNS', 'DNS lab'), desc: t('Mira el viaje de una pregunta DNS y el efecto de la caché.', 'Watch a DNS question travel and the effect of the cache.') },
    { id: 'internet-ports', sim: 'ports', title: t('Juego de puertas (puertos)', 'Door game (ports)'), desc: t('Repite hasta memorizar qué puerto usa cada servicio.', 'Repeat until you memorize which port each service uses.') },
    { id: 'internet-tcpudp', sim: 'tcpUdp', title: t('TCP vs UDP', 'TCP vs UDP'), desc: t('Envía paquetes por una red con fallos y compara.', 'Send packets over a lossy network and compare.') },
  ],
  cards: [
    { id: 'int-1', emoji: '📞', front: t('¿Qué es DNS?', 'What is DNS?'), back: t('La "agenda de contactos" de Internet: traduce nombres (google.com) a direcciones IP (142.250.80.46).', 'The internet’s "contact list": translates names (google.com) into IP addresses (142.250.80.46).') },
    { id: 'int-2', emoji: '🏠', front: t('¿Qué es una dirección IP?', 'What is an IP address?'), back: t('El número que identifica a una computadora en la red. Como la dirección de una casa.', 'The number that identifies a computer on the network. Like a house address.') },
    { id: 'int-3', emoji: '📮', front: t('¿Qué garantiza TCP?', 'What does TCP guarantee?'), back: t('Que los datos lleguen completos y en orden (confirma y reenvía lo perdido).', 'That data arrives complete and in order (confirms and resends what was lost).') },
    { id: 'int-4', emoji: '🚪', front: t('¿Qué es un puerto?', 'What is a port?'), back: t('Una "puerta" numerada del servidor. Cada servicio escucha en la suya.', 'A numbered "door" on the server. Each service listens on its own.') },
    { id: 'int-5', emoji: '🔒', front: t('Puerto de HTTP y de HTTPS', 'Port for HTTP and HTTPS'), back: 'HTTP → 80\nHTTPS → 443' },
    { id: 'int-6', emoji: '🗄️', front: t('Puertos de PostgreSQL, MySQL y MongoDB', 'Ports for PostgreSQL, MySQL and MongoDB'), back: 'PostgreSQL → 5432\nMySQL → 3306\nMongoDB → 27017' },
    { id: 'int-7', emoji: '💬', front: t('¿Qué es HTTP?', 'What is HTTP?'), back: t('El idioma de la web: el cliente envía un request y el servidor contesta un response.', 'The language of the web: the client sends a request and the server answers with a response.') },
    { id: 'int-8', emoji: '🔐', front: t('¿Diferencia entre HTTP y HTTPS?', 'Difference between HTTP and HTTPS?'), back: t('HTTPS es el mismo HTTP pero cifrado: nadie en el camino puede leer los datos.', 'HTTPS is the same HTTP but encrypted: nobody on the way can read the data.') },
    { id: 'int-9', emoji: '🤝', front: t('Los 3 pasos del saludo TCP', 'The 3 steps of the TCP handshake'), back: 'SYN → SYN-ACK → ACK' },
    { id: 'int-10', emoji: '🏡', front: t('¿Qué es localhost?', 'What is localhost?'), back: t('"Esta misma computadora" (IP 127.0.0.1). Ej: http://localhost:3000', '"This same computer" (IP 127.0.0.1). E.g. http://localhost:3000') },
  ],
};
