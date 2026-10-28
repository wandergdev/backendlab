import { t, type Module } from '../../types';

export const caching: Module = {
  id: 'caching',
  num: 9,
  emoji: '⚡',
  color: '#ff6b81',
  title: t('Caché: hacer las cosas rápidas', 'Caching: making things fast'),
  tagline: t('Navegador, CDN, Redis, TTL e invalidación', 'Browser, CDN, Redis, TTL and invalidation'),
  formula: {
    pieces: [
      { label: t('Pregunta repetida', 'Repeated question'), emoji: '🔁' },
      { label: t('Respuesta guardada', 'Stored answer'), emoji: '🧠' },
    ],
    result: t('Respuesta instantánea', 'Instant answer'),
  },
  lesson: [
    {
      kind: 'concept',
      emoji: '⚡',
      title: t('Guardar la respuesta para no repetir el trabajo', 'Store the answer so you do not repeat the work'),
      body: t('Cachear es guardar datos que se piden mucho en un lugar rápido. La primera vez cuesta; las siguientes son casi gratis.', 'Caching is storing frequently requested data in a fast place. The first time costs; the next ones are almost free.'),
      analogy: { real: t('Te preguntan 50 veces al día "¿qué hora es en Tokio?". La calculas una vez, la escribes en un post-it y miras el post-it las demás veces.', 'You get asked 50 times a day "what time is it in Tokyo?". You calculate it once, write it on a sticky note and check the note the other times.'), code: t('La consulta pesada de "productos populares" se guarda en Redis 5 minutos. Los siguientes 999 usuarios la leen de Redis en 1 ms.', 'The heavy "popular products" query is stored in Redis for 5 minutes. The next 999 users read it from Redis in 1 ms.') },
    },
    {
      kind: 'concept',
      emoji: '💀',
      title: t('Sin caché vs con caché', 'Without cache vs with cache'),
      body: t('Con 1000 usuarios por segundo, la diferencia es enorme:', 'With 1000 users per second, the difference is huge:'),
      visual: {
        type: 'compare',
        left: { emoji: '🐢', title: t('Sin caché', 'Without cache'), color: 'var(--red)', points: [t('Cada request → consulta de 200 ms', 'Every request → 200 ms query'), t('1000 usuarios/s = 1000 consultas/s', '1000 users/s = 1000 queries/s'), t('La base de datos se ahoga 💀', 'The database drowns 💀')] },
        right: { emoji: '⚡', title: t('Con caché (Redis)', 'With cache (Redis)'), color: 'var(--green)', points: [t('1er request → consulta y guarda 5 min', '1st request → query and store for 5 min'), t('Los siguientes 999 → Redis en 1 ms', 'The next 999 → Redis in 1 ms'), t('La base de datos descansa 😌', 'The database rests 😌')] },
      },
    },
    {
      kind: 'concept',
      emoji: '🎯',
      title: t('HIT y MISS', 'HIT and MISS'),
      body: t('HIT = el dato estaba en caché (rápido). MISS = no estaba: hay que ir a la base de datos y guardarlo para la próxima.', 'HIT = the data was in the cache (fast). MISS = it was not: go to the database and store it for next time.'),
      visual: { type: 'sequence', actors: [{ id: 'u', label: t('Usuario', 'User'), emoji: '🧑' }, { id: 's', label: t('Servidor', 'Server'), emoji: '🖥️' }, { id: 'r', label: 'Redis', emoji: '🧠' }, { id: 'd', label: t('BD', 'DB'), emoji: '🗄️' }], messages: [{ from: 'u', to: 's', label: 'GET /popular-products' }, { from: 's', to: 'r', label: t('¿lo tienes?', 'got it?') }, { from: 'r', to: 's', label: t('no (MISS)', 'no (MISS)'), color: 'var(--yellow)' }, { from: 's', to: 'd', label: t('consulta pesada 200 ms', 'heavy query 200 ms') }, { from: 'd', to: 's', label: t('resultado', 'result') }, { from: 's', to: 'r', label: t('guárdalo 5 min (TTL)', 'store it 5 min (TTL)') }, { from: 's', to: 'u', label: '200 [ … ]' }, { from: 'u', to: 's', label: t('otro usuario: GET /popular-products', 'another user: GET /popular-products') }, { from: 's', to: 'r', label: t('¿lo tienes?', 'got it?') }, { from: 'r', to: 's', label: t('¡sí! (HIT) 1 ms', 'yes! (HIT) 1 ms'), color: 'var(--green)' }] },
    },
    { kind: 'concept', emoji: '🧪', title: t('Simulador de caché', 'Cache simulator'), body: t('Envía 1 usuario, luego 100. Cambia el precio con la caché llena para ver datos viejos. Arréglalo.', 'Send 1 user, then 100. Change the price while the cache is full to see stale data. Fix it.'), visual: { type: 'sim', id: 'cacheSim' } },
    { kind: 'check', exercise: { type: 'mcq', q: t('El dato no estaba en Redis y hubo que ir a la base de datos. Eso es un…', 'The data was not in Redis and we had to go to the database. That is a…'), options: ['MISS', 'HIT', '404', 'COMMIT'], answer: 0, explain: t('MISS → luego se guarda para que el siguiente sea HIT.', 'MISS → then it is stored so the next one is a HIT.') } },
    {
      kind: 'concept',
      emoji: '🧅',
      title: t('La caché vive en muchas capas', 'Caching lives in many layers'),
      body: t('Del más cercano al más lejano: navegador → CDN → caché de tu app (Redis) → la propia base de datos. Pide cada recurso dos veces y mira dónde lo encuentra.', 'From closest to farthest: browser → CDN → your app cache (Redis) → the database itself. Request each resource twice and see where it is found.'),
      visual: { type: 'sim', id: 'cacheLayers' },
    },
    {
      kind: 'concept',
      emoji: '🧹',
      title: t('El problema más difícil: invalidar', 'The hardest problem: invalidation'),
      body: t('Si cambias un precio, la caché puede seguir mostrando el viejo. Hay 3 estrategias:', 'If you change a price, the cache may keep showing the old one. There are 3 strategies:'),
      visual: {
        type: 'grid',
        items: [
          { badge: '⏳', title: t('Por tiempo (TTL)', 'Time-based (TTL)'), desc: t('"Guárdalo 5 minutos y luego bórralo". Simple; puede haber datos viejos un rato.', '"Keep it 5 minutes then delete it". Simple; may serve stale data for a while.'), color: '#ffd166' },
          { badge: '📣', title: t('Por evento', 'Event-based'), desc: t('"Cuando el precio cambie, borra la caché". Siempre fresco, más código.', '"When the price changes, clear the cache". Always fresh, more code.'), color: '#00d29a' },
          { badge: '🔍', title: 'Cache-aside', desc: t('Mira la caché primero; si no está, ve a la BD y guárdalo.', 'Check the cache first; if missing, go to the DB and store it.'), color: '#4cc9f0' },
        ],
      },
      code: { lang: 'ts', src: "async function getPopularProducts(): Promise<Product[]> {\n  const cached = await redis.get('popular-products');\n  if (cached) return JSON.parse(cached);            // HIT ⚡\n\n  const products = await db.query(HEAVY_QUERY);     // MISS 🐢\n  await redis.set('popular-products', JSON.stringify(products), { EX: 300 }); // TTL 5 min\n  return products;\n}\n\nasync function updatePrice(id: number, price: number) {\n  await db.query('UPDATE products SET price = $1 WHERE id = $2', [price, id]);\n  await redis.del('popular-products');              // invalidación por evento 🧹\n}", dotnet: { lang: 'csharp', src: "// _cache es IDistributedCache (con Redis: builder.Services.AddStackExchangeRedisCache)\npublic async Task<List<Product>> GetPopularProductsAsync()\n{\n    var cached = await _cache.GetStringAsync(\"popular-products\");\n    if (cached is not null) return JsonSerializer.Deserialize<List<Product>>(cached)!; // HIT ⚡\n\n    var products = await _db.Products.OrderByDescending(p => p.Sales).Take(20).ToListAsync(); // MISS 🐢\n    await _cache.SetStringAsync(\"popular-products\", JsonSerializer.Serialize(products),\n        new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) }); // TTL\n    return products;\n}\n\npublic async Task UpdatePriceAsync(int id, decimal price)\n{\n    var product = await _db.Products.FindAsync(id);\n    product!.Price = price;\n    await _db.SaveChangesAsync();\n    await _cache.RemoveAsync(\"popular-products\");   // invalidación por evento 🧹\n}" } },
    },
    { kind: 'check', exercise: { type: 'tf', q: t('Con caché, un usuario podría ver un precio viejo si no se invalida.', 'With caching, a user could see an old price if it is not invalidated.'), answer: true, explain: t('Por eso "invalidar la caché" es uno de los problemas más difíciles.', 'That is why "cache invalidation" is one of the hardest problems.') } },
    {
      kind: 'recap',
      points: [
        t('⚡ Caché = guardar respuestas frecuentes en un lugar rápido.', '⚡ Cache = storing frequent answers in a fast place.'),
        t('🎯 HIT rápido · MISS va a la BD y guarda.', '🎯 HIT fast · MISS goes to the DB and stores.'),
        t('🧅 Navegador → CDN → Redis → BD.', '🧅 Browser → CDN → Redis → DB.'),
        t('⏳ TTL = cuánto vive el dato en caché.', '⏳ TTL = how long data lives in the cache.'),
        t('🧹 Invalidar: por tiempo, por evento o cache-aside.', '🧹 Invalidate: by time, by event, or cache-aside.'),
      ],
    },
  ],
  practice: [
    { type: 'mcq', q: t('¿Qué herramienta se usa típicamente como caché de aplicación?', 'Which tool is typically used as an application cache?'), options: ['Redis', 'Git', 'Docker', 'DNS'], answer: 0, explain: t('Redis: clave-valor en memoria, rapidísimo.', 'Redis: in-memory key-value, super fast.') },
    { type: 'mcq', q: t('¿Qué significa TTL?', 'What does TTL mean?'), options: [t('Cuánto tiempo vive un dato en caché', 'How long data lives in the cache'), t('Un tipo de base de datos', 'A type of database'), t('Un código de estado', 'A status code'), t('Un protocolo de red', 'A network protocol')], answer: 0, explain: 'Time To Live.' },
    { type: 'order', q: t('Ordena las capas de caché, de la más cercana al usuario a la más lejana', 'Order the cache layers, from closest to the user to farthest'), items: [t('Caché del navegador', 'Browser cache'), 'CDN', t('Caché de la app (Redis)', 'App cache (Redis)'), t('Base de datos', 'Database')], explain: t('Cuanto más cerca, más rápido.', 'The closer, the faster.') },
    { type: 'tf', q: t('Un CDN sirve tus archivos desde servidores cercanos al usuario.', 'A CDN serves your files from servers near the user.'), answer: true, explain: t('Un usuario en Egipto recibe el logo desde un servidor cercano, no desde EE.UU.', 'A user in Egypt gets the logo from a nearby server, not from the US.') },
    { type: 'match', q: t('Une cada estrategia de invalidación', 'Match each invalidation strategy'), pairs: [[t('Por tiempo', 'Time-based'), t('Expira en 5 minutos', 'Expires in 5 minutes')], [t('Por evento', 'Event-based'), t('Borrar al cambiar el dato', 'Clear when the data changes')], ['Cache-aside', t('Mirar caché, si no, BD y guardar', 'Check cache, else DB and store')]], explain: t('Tres formas de mantener la caché fresca.', 'Three ways to keep the cache fresh.') },
    {
      type: 'code',
      q: t('Implementa cache-aside: "getWithCache(cache, key, fetchFn)". Si cache (un Map) tiene la clave, devuelve el valor. Si no, llama fetchFn(), guárdalo en cache y devuélvelo.', 'Implement cache-aside: "getWithCache(cache, key, fetchFn)". If cache (a Map) has the key, return the value. Otherwise call fetchFn(), store it in cache and return it.'),
      fn: 'getWithCache',
      starter: "function getWithCache<T>(cache: Map<string, T>, key: string, fetchFn: () => T): T {\n\n}",
      solution: "function getWithCache<T>(cache: Map<string, T>, key: string, fetchFn: () => T): T {\n  if (cache.has(key)) return cache.get(key)!;\n  const value = fetchFn();\n  cache.set(key, value);\n  return value;\n}",
      csharp: "// IMemoryCache ya trae el patrón cache-aside:\nvar products = await _cache.GetOrCreateAsync(\"popular-products\", entry =>\n{\n    entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);\n    return _db.Products.Take(20).ToListAsync();   // solo se ejecuta en un MISS\n});",
      tests: [
        { call: '(() => { const c = new Map(); let calls = 0; const f = () => { calls++; return 42; }; getWithCache(c, "a", f); getWithCache(c, "a", f); return [getWithCache(c, "a", f), calls]; })()', expect: [42, 1], label: t('3 llamadas, la BD (fetchFn) solo se usa 1 vez', '3 calls, the DB (fetchFn) is used only once') },
        { call: '(() => { const c = new Map([["x", "cached"]]); return getWithCache(c, "x", () => "fresh"); })()', expect: 'cached', label: t('si ya está en caché, NO llama a fetchFn', 'if already cached, does NOT call fetchFn') },
      ],
      explain: t('Esta es la base de casi toda caché real (con Redis en lugar de un Map).', 'This is the basis of almost every real cache (with Redis instead of a Map).'),
    },
    { type: 'mcq', q: t('Tus usuarios ven precios viejos tras cambiarlos. ¿Mejor solución?', 'Your users see old prices after changing them. Best fix?'), options: [t('Borrar (invalidar) esa clave de la caché al actualizar el precio', 'Delete (invalidate) that cache key when updating the price'), t('Apagar el servidor', 'Turn off the server'), t('Quitar la base de datos', 'Remove the database'), t('Usar HTTP en vez de HTTPS', 'Use HTTP instead of HTTPS')], answer: 0, explain: t('Invalidación por evento.', 'Event-based invalidation.') },
  ],
  labs: [
    { id: 'cache-sim', sim: 'cacheSim', title: t('Simulador de caché', 'Cache simulator'), desc: t('HIT, MISS, TTL, datos viejos e invalidación.', 'HIT, MISS, TTL, stale data and invalidation.') },
    { id: 'cache-layers', sim: 'cacheLayers', title: t('Capas de caché', 'Cache layers'), desc: t('Navegador, CDN, Redis y BD.', 'Browser, CDN, Redis and DB.') },
  ],
  cards: [
    { id: 'cache-1', emoji: '⚡', front: t('¿Qué es cachear?', 'What is caching?'), back: t('Guardar datos que se piden mucho en un lugar rápido para no recalcularlos.', 'Storing frequently requested data in a fast place so you do not recompute it.') },
    { id: 'cache-2', emoji: '🎯', front: 'HIT vs MISS', back: t('HIT: estaba en caché (rápido).\nMISS: no estaba; se busca en la BD y se guarda.', 'HIT: it was cached (fast).\nMISS: it was not; fetched from the DB and stored.') },
    { id: 'cache-3', emoji: '⏳', front: 'TTL', back: t('Time To Live: cuánto tiempo vive un dato en caché antes de expirar.', 'Time To Live: how long data lives in the cache before expiring.') },
    { id: 'cache-4', emoji: '🧅', front: t('Las 4 capas de caché', 'The 4 cache layers'), back: t('Navegador → CDN → App (Redis) → Base de datos', 'Browser → CDN → App (Redis) → Database') },
    { id: 'cache-5', emoji: '🌍', front: 'CDN', back: t('Red de servidores por el mundo que guardan copias de tus archivos cerca de cada usuario.', 'Network of servers around the world keeping copies of your files near each user.') },
    { id: 'cache-6', emoji: '🧹', front: t('Invalidación de caché', 'Cache invalidation'), back: t('Decidir cuándo borrar/actualizar la caché para no servir datos viejos. Por tiempo, por evento o cache-aside.', 'Deciding when to clear/update the cache to avoid stale data. By time, by event or cache-aside.') },
    { id: 'cache-7', emoji: '🔍', front: 'Cache-aside', back: t('1) Mira la caché. 2) Si no está, ve a la BD. 3) Guárdalo en caché. 4) Devuélvelo.', '1) Check the cache. 2) If missing, go to the DB. 3) Store it in the cache. 4) Return it.') },
  ],
};
