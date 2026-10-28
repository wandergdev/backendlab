// Valida todo el contenido educativo: corre las soluciones de código y SQL contra sus pruebas
// y revisa que cada ejercicio esté bien formado. Uso: npm run validate
import initSqlJs from 'sql.js';
import { transform } from 'sucrase';
import { MODULES } from '../src/content';
import { GLOSSARY } from '../src/content/glossary';
import { SEED_SQL, sameResult, type QueryResult } from '../src/lib/sql';
import type { Exercise, ExerciseBase, SimId, Txt } from '../src/types';

const toJs = (ts: string) => transform(ts, { transforms: ['typescript'], disableESTransforms: true }).code;

const IMPLEMENTED: SimId[] = [
  'dns', 'ports', 'osi', 'tcpUdp', 'websocket', 'loadBalancer', 'httpsSniff', 'httpPlayground', 'statusSort', 'restDesigner',
  'jsonExplorer', 'graphqlVsRest', 'serverLoop', 'threads', 'memory', 'layers', 'sqlPlayground', 'joinViz', 'transaction', 'index',
  'hashLab', 'jwtLab', 'injectionLab', 'xssLab', 'rateLimit', 'cacheSim', 'cacheLayers', 'monoMicro', 'pubsub', 'terminal', 'git',
  'testRunner', 'pyramid', 'docker', 'cicd', 'roadmap',
  'compileQuiz', 'linqViz', 'aspnetPipeline', 'diLifetimes', 'efQuery', 'efTracking',
];

const errors: string[] = [];
const fail = (where: string, msg: string) => errors.push(`✗ ${where}: ${msg}`);
const bothLangs = (x: Txt, where: string) => {
  if (typeof x === 'object' && (!x.es?.trim() || !x.en?.trim())) fail(where, 'falta traducción es/en');
};

async function main() {
  const SQL = await initSqlJs();
  const run = (q: string, check?: string): QueryResult | undefined => {
    const db = new SQL.Database();
    db.run(SEED_SQL);
    const r = db.exec(q);
    const after = check ? db.exec(check) : r;
    db.close();
    const last = after[after.length - 1];
    return last ? { columns: last.columns, values: last.values as QueryResult['values'] } : undefined;
  };

  const ids = new Set<string>();
  let exercises = 0;
  let codeTests = 0;

  const checkExercise = async (ex: Exercise | ExerciseBase, where: string): Promise<void> => {
    exercises++;
    if ('dotnet' in ex && ex.dotnet) await checkExercise(ex.dotnet, `${where} (.NET)`);
    bothLangs(ex.q, `${where} q`);
    bothLangs(ex.explain, `${where} explain`);
    switch (ex.type) {
      case 'mcq':
        if (ex.answer < 0 || ex.answer >= ex.options.length) fail(where, 'answer fuera de rango');
        if (ex.options.length < 2) fail(where, 'menos de 2 opciones');
        break;
      case 'order':
        if (ex.items.length < 2) fail(where, 'order con menos de 2 items');
        break;
      case 'match':
        if (ex.pairs.length < 2) fail(where, 'match con menos de 2 pares');
        break;
      case 'fill': {
        const n = ex.template.split('___').length - 1;
        if (n !== ex.blanks.length) fail(where, `fill: ${n} huecos pero ${ex.blanks.length} respuestas`);
        const dup = ex.distractors.filter((d) => ex.blanks.includes(d));
        if (dup.length) fail(where, `fill: distractor igual a una respuesta: ${dup.join(', ')}`);
        break;
      }
      case 'type':
        if (!ex.accept.length) fail(where, 'type sin respuestas aceptadas');
        break;
      case 'sql':
        try {
          const r = run(ex.solution, ex.check);
          if (!r && !ex.check) fail(where, 'la solución SQL no devuelve filas');
          if (!sameResult(r, run(ex.solution, ex.check), /order\s+by/i.test(ex.solution))) fail(where, 'solución SQL no determinista');
        } catch (e) {
          fail(where, `SQL de la solución falla: ${(e as Error).message}`);
        }
        break;
      case 'code': {
        if (!ex.tests.length) fail(where, 'ejercicio de código sin pruebas');
        let f: (...a: unknown[]) => unknown;
        try {
          f = new Function(`${toJs(ex.solution)}\n;return ${ex.fn};`)();
        } catch (e) {
          fail(where, `la solución no compila: ${(e as Error).message}`);
          break;
        }
        for (const tc of ex.tests) {
          codeTests++;
          try {
            const got = tc.call ? await new Function(ex.fn, `return (${tc.call});`)(f) : await f(...structuredClone(tc.args ?? []));
            if (JSON.stringify(got) !== JSON.stringify(tc.expect)) fail(where, `prueba falla con la solución: esperado ${JSON.stringify(tc.expect)}, obtenido ${JSON.stringify(got)}`);
          } catch (e) {
            fail(where, `prueba lanza error con la solución: ${(e as Error).message}`);
          }
        }
        // El código inicial NO debería pasar todas las pruebas.
        try {
          const g = new Function(`${toJs(ex.starter)}\n;return ${ex.fn};`)();
          let allPass = true;
          for (const tc of ex.tests) {
            const got = tc.call ? await new Function(ex.fn, `return (${tc.call});`)(g) : await g(...structuredClone(tc.args ?? []));
            if (JSON.stringify(got) !== JSON.stringify(tc.expect)) allPass = false;
          }
          if (allPass) fail(where, 'el código inicial ya pasa todas las pruebas');
        } catch {
          /* que el inicial falle es lo esperado */
        }
        break;
      }
    }
  };

  for (const m of MODULES) {
    const w = `[${m.num} ${m.id}]`;
    bothLangs(m.title, `${w} title`);
    bothLangs(m.tagline, `${w} tagline`);
    if (!m.labs.length) fail(w, 'sin laboratorios');
    if (m.cards.length < 4) fail(w, 'menos de 4 tarjetas');
    if (m.practice.length < 5) fail(w, 'menos de 5 ejercicios de práctica');
    if (m.lesson[m.lesson.length - 1]?.kind !== 'recap') fail(w, 'la lección no termina con un resumen');
    for (const [i, s] of m.lesson.entries()) {
      const sw = `${w} lección paso ${i + 1}`;
      if (s.kind === 'check') await checkExercise(s.exercise, sw);
      if (s.kind === 'concept') {
        bothLangs(s.title, `${sw} title`);
        bothLangs(s.body, `${sw} body`);
        if (s.visual?.type === 'sim' && !IMPLEMENTED.includes(s.visual.id)) fail(sw, `simulador no implementado: ${s.visual.id}`);
      }
    }
    for (const [i, ex] of m.practice.entries()) await checkExercise(ex, `${w} práctica ${i + 1}`);
    for (const l of m.labs) {
      if (!IMPLEMENTED.includes(l.sim)) fail(`${w} lab ${l.id}`, `simulador no implementado: ${l.sim}`);
      if (ids.has(l.id)) fail(w, `id de lab duplicado: ${l.id}`);
      ids.add(l.id);
    }
    for (const c of m.cards) {
      if (ids.has(c.id)) fail(w, `id de tarjeta duplicado: ${c.id}`);
      ids.add(c.id);
      bothLangs(c.front, `${w} tarjeta ${c.id}`);
      bothLangs(c.back, `${w} tarjeta ${c.id}`);
    }
  }
  for (const g of GLOSSARY) {
    if (!MODULES.some((m) => m.id === g.module)) fail(`glosario ${g.term}`, `módulo inexistente: ${g.module}`);
    bothLangs(g.def, `glosario ${g.term}`);
  }

  const lessons = MODULES.reduce((a, m) => a + m.lesson.length, 0);
  const cards = MODULES.reduce((a, m) => a + m.cards.length, 0);
  const labs = MODULES.reduce((a, m) => a + m.labs.length, 0);
  console.log(`Módulos: ${MODULES.length} · pasos de lección: ${lessons} · ejercicios: ${exercises} (${codeTests} pruebas de código) · laboratorios: ${labs} · tarjetas: ${cards} · glosario: ${GLOSSARY.length}`);
  if (errors.length) {
    console.log(errors.join('\n'));
    console.log(`\n${errors.length} problema(s)`);
    process.exit(1);
  }
  console.log('✓ Todo el contenido es válido');
}

main();
