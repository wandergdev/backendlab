// Un Git simulado: suficiente para ver con tus ojos qué hacen add, commit, branch, checkout, merge y push.

export type Commit = { id: string; msg: string; parents: string[]; branch: string; files: Record<string, string>; n: number };
export type GitState = {
  initialized: boolean;
  working: Record<string, string>;
  index: Record<string, string>;
  commits: Commit[];
  branches: Record<string, string | null>;
  branchOrder: string[];
  head: string;
  remote: Record<string, string | null>;
};
export type GitLine = { text: string; cls?: 'err' | 'ok' | 'muted' | 'add' | 'mod' };

export function initialGit(): GitState {
  return {
    initialized: false,
    working: { 'server.js': "console.log('hola');" },
    index: {},
    commits: [],
    branches: {},
    branchOrder: [],
    head: 'main',
    remote: {},
  };
}

const rid = () => Math.random().toString(16).slice(2, 9);

export function headCommit(s: GitState): Commit | undefined {
  const id = s.branches[s.head];
  return s.commits.find((c) => c.id === id);
}

function snapshot(s: GitState): Record<string, string> {
  return headCommit(s)?.files ?? {};
}

function diffKeys(a: Record<string, string>, b: Record<string, string>) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: { file: string; kind: 'nuevo' | 'modificado' | 'borrado' }[] = [];
  keys.forEach((k) => {
    if (!(k in b)) out.push({ file: k, kind: 'nuevo' });
    else if (!(k in a)) out.push({ file: k, kind: 'borrado' });
    else if (a[k] !== b[k]) out.push({ file: k, kind: 'modificado' });
  });
  return out;
}

export function isDirty(s: GitState) {
  return diffKeys(s.working, snapshot(s)).length > 0;
}

function ancestors(s: GitState, id: string | null): Set<string> {
  const seen = new Set<string>();
  const stack = id ? [id] : [];
  while (stack.length) {
    const cur = stack.pop()!;
    if (seen.has(cur)) continue;
    seen.add(cur);
    const c = s.commits.find((x) => x.id === cur);
    c?.parents.forEach((p) => stack.push(p));
  }
  return seen;
}

function tokenize(cmd: string): string[] {
  const out: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cmd))) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

export function gitExec(prev: GitState, input: string): { state: GitState; out: GitLine[] } {
  const s: GitState = structuredClone(prev);
  const raw = input.trim();
  const args = tokenize(raw);
  const err = (text: string) => ({ state: prev, out: [{ text, cls: 'err' as const }] });
  const ok = (...lines: (string | GitLine)[]) => ({ state: s, out: lines.map((l) => (typeof l === 'string' ? { text: l } : l)) });
  if (!args.length) return { state: prev, out: [] };

  // ----- Comandos de archivos (para crear cambios) -----
  if (args[0] === 'ls') return ok(Object.keys(s.working).sort().join('   ') || '(vacío)');
  if (args[0] === 'cat') {
    const f = args[1];
    return f && f in s.working ? ok(s.working[f]) : err(`cat: ${f ?? ''}: no existe`);
  }
  if (args[0] === 'touch') {
    if (!args[1]) return err('touch: falta el nombre del archivo');
    if (!(args[1] in s.working)) s.working[args[1]] = '';
    return ok();
  }
  if (args[0] === 'echo') {
    const m = raw.match(/^echo\s+["']?(.*?)["']?\s*(>>?)\s*(\S+)$/);
    if (!m) return ok(args.slice(1).join(' '));
    const [, text, op, f] = m;
    s.working[f] = op === '>>' && s.working[f] ? `${s.working[f]}\n${text}` : text;
    return ok();
  }
  if (args[0] === 'rm') {
    if (!args[1] || !(args[1] in s.working)) return err(`rm: ${args[1] ?? ''}: no existe`);
    delete s.working[args[1]];
    return ok();
  }
  if (args[0] === 'clear') return { state: prev, out: [] };
  if (args[0] !== 'git') return err(`${args[0]}: comando no encontrado. Prueba: git status, touch archivo.js, echo "x" > archivo.js`);

  const sub = args[1];
  if (sub === 'init') {
    if (s.initialized) return ok({ text: 'Reinicializado el repositorio Git existente', cls: 'muted' });
    s.initialized = true;
    s.branches = { main: null };
    s.branchOrder = ['main'];
    s.head = 'main';
    return ok({ text: 'Repositorio Git vacío inicializado en /proyecto/.git/', cls: 'ok' });
  }
  if (!s.initialized) return err('fatal: no es un repositorio git. Primero ejecuta: git init');

  const headSnap = snapshot(s);
  switch (sub) {
    case 'status': {
      const staged = diffKeys(s.index, headSnap);
      const unstaged = diffKeys(s.working, s.index).filter((d) => d.kind !== 'nuevo' || d.file in headSnap || d.file in s.index);
      const untracked = Object.keys(s.working).filter((f) => !(f in s.index) && !(f in headSnap));
      const lines: GitLine[] = [{ text: `En la rama ${s.head}` }];
      if (!staged.length && !unstaged.length && !untracked.length) lines.push({ text: 'nada para hacer commit, el árbol de trabajo está limpio', cls: 'muted' });
      if (staged.length) {
        lines.push({ text: 'Cambios a ser confirmados (staged):' });
        staged.forEach((d) => lines.push({ text: `    ${d.kind}: ${d.file}`, cls: 'add' }));
      }
      if (unstaged.length) {
        lines.push({ text: 'Cambios no preparados (usa "git add"):' });
        unstaged.forEach((d) => lines.push({ text: `    ${d.kind}: ${d.file}`, cls: 'mod' }));
      }
      if (untracked.length) {
        lines.push({ text: 'Archivos sin seguimiento (usa "git add"):' });
        untracked.forEach((f) => lines.push({ text: `    ${f}`, cls: 'mod' }));
      }
      return { state: prev, out: lines };
    }
    case 'add': {
      const target = args[2];
      if (!target) return err('Nada especificado. ¿Quisiste decir "git add ."?');
      if (target === '.' || target === '-A' || target === '--all') s.index = { ...s.working };
      else {
        if (!(target in s.working) && !(target in s.index)) return err(`fatal: la ruta '${target}' no coincide con ningún archivo`);
        if (target in s.working) s.index[target] = s.working[target];
        else delete s.index[target];
      }
      return ok();
    }
    case 'commit': {
      const mi = args.indexOf('-m');
      const msg = mi >= 0 ? args[mi + 1] : undefined;
      if (!msg) return err('Falta el mensaje. Usa: git commit -m "Describe tu cambio"');
      if (!diffKeys(s.index, headSnap).length) return err('nada para hacer commit (¿olvidaste "git add"?)');
      const parent = s.branches[s.head];
      const c: Commit = { id: rid(), msg, parents: parent ? [parent] : [], branch: s.head, files: { ...s.index }, n: s.commits.length };
      s.commits.push(c);
      s.branches[s.head] = c.id;
      return ok({ text: `[${s.head} ${c.id}] ${msg}`, cls: 'ok' });
    }
    case 'log': {
      const ids = [...ancestors(s, s.branches[s.head])];
      const list = s.commits.filter((c) => ids.includes(c.id)).sort((a, b) => b.n - a.n);
      if (!list.length) return err(`fatal: tu rama actual '${s.head}' no tiene commits todavía`);
      return { state: prev, out: list.map((c) => ({ text: `${c.id} ${c.msg}${c.id === s.branches[s.head] ? `  (HEAD -> ${s.head})` : ''}` })) };
    }
    case 'branch': {
      const name = args[2];
      if (!name) return { state: prev, out: s.branchOrder.map((b) => ({ text: `${b === s.head ? '* ' : '  '}${b}`, cls: b === s.head ? ('ok' as const) : undefined })) };
      if (name in s.branches) return err(`fatal: ya existe una rama llamada '${name}'`);
      if (!s.branches[s.head]) return err('fatal: haz al menos un commit antes de crear ramas');
      s.branches[name] = s.branches[s.head];
      s.branchOrder.push(name);
      return ok({ text: `Rama '${name}' creada (aún estás en '${s.head}')`, cls: 'muted' });
    }
    case 'checkout':
    case 'switch': {
      const create = args[2] === '-b' || args[2] === '-c';
      const name = create ? args[3] : args[2];
      if (!name) return err(`Uso: git ${sub} <rama>`);
      if (create) {
        if (name in s.branches) return err(`fatal: ya existe una rama llamada '${name}'`);
        if (!s.branches[s.head]) return err('fatal: haz al menos un commit antes de crear ramas');
        s.branches[name] = s.branches[s.head];
        s.branchOrder.push(name);
      } else if (!(name in s.branches)) return err(`error: la rama '${name}' no existe (para crearla: git ${sub} ${sub === 'switch' ? '-c' : '-b'} ${name})`);
      if (!create && isDirty(prev)) return err('error: tienes cambios sin commit. Haz commit antes de cambiar de rama.');
      s.head = name;
      const snap = snapshot(s);
      if (!create) {
        s.working = { ...snap };
        s.index = { ...snap };
      }
      return ok({ text: create ? `Cambiado a nueva rama '${name}'` : `Cambiado a rama '${name}'`, cls: 'ok' });
    }
    case 'merge': {
      const other = args[2];
      if (!other || !(other in s.branches)) return err(`merge: ${other ?? ''} - no es algo que se pueda fusionar`);
      if (other === s.head) return err('No puedes fusionar una rama consigo misma');
      const mine = s.branches[s.head];
      const theirs = s.branches[other];
      if (!theirs) return err(`La rama '${other}' no tiene commits`);
      if (ancestors(s, mine).has(theirs)) return ok({ text: 'Ya está actualizado.', cls: 'muted' });
      if (isDirty(prev)) return err('error: tienes cambios sin commit. Haz commit antes de fusionar.');
      const theirC = s.commits.find((c) => c.id === theirs)!;
      if (!mine || ancestors(s, theirs).has(mine)) {
        s.branches[s.head] = theirs;
        s.working = { ...theirC.files };
        s.index = { ...theirC.files };
        return ok({ text: `Fast-forward: '${s.head}' ahora apunta a ${theirs}`, cls: 'ok' }, { text: '(No hizo falta un commit de merge: la rama solo avanzó)', cls: 'muted' });
      }
      const files = { ...snapshot(s), ...theirC.files };
      const c: Commit = { id: rid(), msg: `Merge branch '${other}' into ${s.head}`, parents: [mine, theirs], branch: s.head, files, n: s.commits.length };
      s.commits.push(c);
      s.branches[s.head] = c.id;
      s.working = { ...files };
      s.index = { ...files };
      return ok({ text: `Merge hecho con la estrategia 'ort'. Nuevo commit ${c.id}`, cls: 'ok' });
    }
    case 'push': {
      const remote = args[2];
      const branch = args[3] ?? s.head;
      if (remote !== 'origin') return err('Uso: git push origin <rama>');
      if (!(branch in s.branches) || !s.branches[branch]) return err(`error: la rama '${branch}' no tiene commits que subir`);
      s.remote[branch] = s.branches[branch];
      return ok(`Subiendo a github.com/tu-usuario/proyecto.git`, { text: `   ${branch} -> ${branch}  ✔`, cls: 'ok' });
    }
    case 'pull':
      return ok({ text: 'Ya está actualizado. (Simulado: nadie más ha subido cambios)', cls: 'muted' });
    case 'diff': {
      const d = diffKeys(s.working, s.index);
      return { state: prev, out: d.length ? d.map((x) => ({ text: `${x.kind}: ${x.file}`, cls: 'mod' as const })) : [{ text: '(sin diferencias sin preparar)', cls: 'muted' }] };
    }
    default:
      return err(`git: '${sub ?? ''}' no es un comando de git de este simulador. Usa: init, status, add, commit, log, branch, checkout, switch, merge, push, pull, diff`);
  }
}
