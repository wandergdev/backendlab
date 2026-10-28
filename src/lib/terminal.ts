import { createApi } from './fakeApi';

// Una terminal Linux simulada con su propio sistema de archivos en memoria.

export type FsNode = { type: 'dir'; children: Record<string, FsNode> } | { type: 'file'; content: string; mode?: string };
export type Line = { text: string; cls?: 'err' | 'ok' | 'muted' | 'cmd' };
export type Proc = { pid: number; user: string; cpu: number; mem: number; cmd: string };

export type TermState = { root: FsNode; cwd: string[]; procs: Proc[]; history: string[]; user: string; host: string };

const dir = (children: Record<string, FsNode> = {}): FsNode => ({ type: 'dir', children });
const file = (content: string, mode = '-rw-r--r--'): FsNode => ({ type: 'file', content, mode });

export function initialTerm(): TermState {
  return {
    user: 'dev',
    host: 'servidor',
    cwd: ['home', 'dev'],
    history: [],
    procs: [
      { pid: 1, user: 'root', cpu: 0.0, mem: 0.1, cmd: '/sbin/init' },
      { pid: 812, user: 'postgres', cpu: 1.2, mem: 4.3, cmd: 'postgres -D /var/lib/postgresql' },
      { pid: 977, user: 'root', cpu: 0.3, mem: 0.8, cmd: 'nginx: master process' },
      { pid: 1450, user: 'dev', cpu: 0.8, mem: 2.1, cmd: 'node server.js' },
      { pid: 4242, user: 'dev', cpu: 99.7, mem: 61.5, cmd: 'node script-colgado.js' },
    ],
    root: dir({
      home: dir({
        dev: dir({
          proyecto: dir({
            'server.js': file(`const express = require('express');\nconst app = express();\n\napp.get('/api/users', (req, res) => {\n  res.json([{ id: 1, name: 'Ahmed' }]);\n});\n\napp.listen(3000, () => console.log('Escuchando en el puerto 3000'));`),
            'package.json': file(`{\n  "name": "mi-api",\n  "version": "1.0.0",\n  "main": "server.js"\n}`),
            'README.md': file('# Mi API\nUn proyecto de práctica.'),
          }),
          'notas.txt': file('Recordar: nunca guardar contraseñas en texto plano.\nPuerto de Postgres: 5432\nPuerto HTTPS: 443'),
          'deploy.sh': file('#!/bin/bash\necho "Desplegando..."'),
        }),
      }),
      var: dir({
        log: dir({
          'app.log': file(
            [
              '2026-10-28 09:00:01 INFO  Servidor iniciado en el puerto 3000',
              '2026-10-28 09:02:13 INFO  GET /api/users 200 12ms',
              '2026-10-28 09:05:40 ERROR Conexión a la base de datos rechazada (puerto 5432)',
              '2026-10-28 09:05:41 INFO  Reintentando conexión...',
              '2026-10-28 09:05:42 INFO  Conectado a PostgreSQL',
              '2026-10-28 09:10:07 WARN  Respuesta lenta: GET /popular-products 1800ms',
              '2026-10-28 09:12:55 ERROR TypeError: Cannot read properties of undefined (reading "price")',
              '2026-10-28 09:13:00 INFO  POST /api/users 201 30ms',
            ].join('\n'),
          ),
          'nginx.log': file('127.0.0.1 - GET / 200\n10.0.0.7 - GET /admin 403'),
        }),
      }),
      etc: dir({
        hosts: file('127.0.0.1   localhost\n142.250.80.46   google.com'),
        'nginx.conf': file('server {\n  listen 80;\n  listen 443 ssl;\n}'),
      }),
      tmp: dir(),
    }),
  };
}

const api = createApi();

export function pathStr(cwd: string[]): string {
  return '/' + cwd.join('/');
}
export function promptPath(s: TermState): string {
  const p = pathStr(s.cwd);
  const home = `/home/${s.user}`;
  return p.startsWith(home) ? '~' + p.slice(home.length) : p;
}

function resolve(s: TermState, p: string): string[] {
  const parts = p.startsWith('/') ? [] : p.startsWith('~') ? ['home', s.user] : [...s.cwd];
  const rest = p.replace(/^~/, '');
  for (const seg of rest.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return parts;
}

function getNode(root: FsNode, parts: string[]): FsNode | undefined {
  let n: FsNode | undefined = root;
  for (const p of parts) {
    if (!n || n.type !== 'dir') return undefined;
    n = n.children[p];
  }
  return n;
}

/** Copia el árbol para poder mutarlo sin tocar el estado anterior (React necesita inmutabilidad). */
function clone(n: FsNode): FsNode {
  return n.type === 'dir' ? { type: 'dir', children: Object.fromEntries(Object.entries(n.children).map(([k, v]) => [k, clone(v)])) } : { ...n };
}

function tokenize(cmd: string): string[] {
  const out: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cmd))) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

function findAll(n: FsNode, base: string, pattern: RegExp, out: string[]) {
  if (n.type !== 'dir') return;
  for (const [name, child] of Object.entries(n.children)) {
    const p = `${base}/${name}`;
    if (pattern.test(name)) out.push(p);
    findAll(child, p, pattern, out);
  }
}

export const HELP = `Comandos disponibles / Available commands:
  pwd, ls [-la], cd <dir>, cat <file>, echo <txt> [> file], mkdir <dir>, touch <file>,
  rm [-r] <path>, cp <a> <b>, mv <a> <b>, grep <txt> <file>, find . -name "*.js",
  ps aux, top, kill <pid>, curl [-X METHOD] <url>, ping <host>, chmod <mode> <file>,
  whoami, history, clear, help`;

export function exec(prev: TermState, input: string, asRoot = false): { state: TermState; out: Line[]; clear?: boolean } {
  const s: TermState = { ...prev, root: clone(prev.root), cwd: [...prev.cwd], procs: [...prev.procs], history: [...prev.history, input] };
  const raw = input.trim();
  if (!raw) return { state: prev, out: [] };

  // Redirección simple: echo "hola" > archivo.txt
  let redirect: { file: string; append: boolean } | null = null;
  let cmdLine = raw;
  const rm = raw.match(/^(.*?)\s*(>>?)\s*(\S+)$/);
  if (rm && !raw.startsWith('curl')) {
    cmdLine = rm[1];
    redirect = { file: rm[3], append: rm[2] === '>>' };
  }

  const [cmd, ...args] = tokenize(cmdLine);
  const err = (text: string) => ({ state: s, out: [{ text, cls: 'err' as const }] });
  const ok = (lines: string[] | string) => {
    const arr = Array.isArray(lines) ? lines : [lines];
    if (redirect) {
      const parts = resolve(s, redirect.file);
      const parent = getNode(s.root, parts.slice(0, -1));
      if (!parent || parent.type !== 'dir') return err(`bash: ${redirect.file}: No such file or directory`);
      const existing = parent.children[parts[parts.length - 1]];
      const prevContent = redirect.append && existing?.type === 'file' ? existing.content + '\n' : '';
      parent.children[parts[parts.length - 1]] = file(prevContent + arr.join('\n'));
      return { state: s, out: [] };
    }
    return { state: s, out: arr.map((text) => ({ text })) };
  };

  switch (cmd) {
    case 'help':
      return ok(HELP.split('\n'));
    case 'clear':
      return { state: s, out: [], clear: true };
    case 'pwd':
      return ok(pathStr(s.cwd));
    case 'whoami':
      return ok(s.user);
    case 'history':
      return ok(s.history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`));
    case 'ls': {
      const long = args.some((a) => a.startsWith('-') && a.includes('l'));
      const target = args.find((a) => !a.startsWith('-'));
      const parts = target ? resolve(s, target) : s.cwd;
      const n = getNode(s.root, parts);
      if (!n) return err(`ls: no se puede acceder a '${target}': No existe el archivo o el directorio`);
      if (n.type === 'file') return ok(target ?? '');
      const names = Object.keys(n.children).sort();
      if (!long) return ok(names.length ? names.map((k) => (n.children[k].type === 'dir' ? k + '/' : k)).join('   ') : '');
      return ok(
        names.map((k) => {
          const c = n.children[k];
          const mode = c.type === 'dir' ? 'drwxr-xr-x' : c.mode ?? '-rw-r--r--';
          const size = c.type === 'file' ? c.content.length : 4096;
          return `${mode}  ${s.user}  ${String(size).padStart(5)}  ${k}${c.type === 'dir' ? '/' : ''}`;
        }),
      );
    }
    case 'cd': {
      const target = args[0] ?? '~';
      const parts = resolve(s, target);
      const n = getNode(s.root, parts);
      if (!n) return err(`cd: ${target}: No existe el archivo o el directorio`);
      if (n.type !== 'dir') return err(`cd: ${target}: No es un directorio`);
      s.cwd = parts;
      return { state: s, out: [] };
    }
    case 'cat': {
      if (!args[0]) return err('cat: falta el nombre del archivo');
      const n = getNode(s.root, resolve(s, args[0]));
      if (!n) return err(`cat: ${args[0]}: No existe el archivo o el directorio`);
      if (n.type === 'dir') return err(`cat: ${args[0]}: Es un directorio`);
      return ok(n.content.split('\n'));
    }
    case 'nano':
      return ok([`(nano no está disponible en el simulador. Usa: echo "texto" > ${args[0] ?? 'archivo.txt'})`]);
    case 'echo':
      return ok(args.join(' '));
    case 'mkdir':
    case 'touch': {
      const name = args.find((a) => !a.startsWith('-'));
      if (!name) return err(`${cmd}: falta un operando`);
      const parts = resolve(s, name);
      const parent = getNode(s.root, parts.slice(0, -1));
      if (!parent || parent.type !== 'dir') return err(`${cmd}: no se puede crear '${name}': No existe el directorio`);
      const leaf = parts[parts.length - 1];
      if (parent.children[leaf]) {
        if (cmd === 'mkdir') return err(`mkdir: no se puede crear el directorio «${name}»: El archivo ya existe`);
        return { state: s, out: [] };
      }
      parent.children[leaf] = cmd === 'mkdir' ? dir() : file('');
      return { state: s, out: [] };
    }
    case 'rm': {
      const recursive = args.some((a) => /^-\w*r/.test(a));
      const name = args.find((a) => !a.startsWith('-'));
      if (!name) return err('rm: falta un operando');
      const parts = resolve(s, name);
      const parent = getNode(s.root, parts.slice(0, -1));
      const n = getNode(s.root, parts);
      if (!n || !parent || parent.type !== 'dir') return err(`rm: no se puede borrar '${name}': No existe el archivo o el directorio`);
      if (n.type === 'dir' && !recursive) return err(`rm: no se puede borrar '${name}': Es un directorio (usa rm -r)`);
      delete parent.children[parts[parts.length - 1]];
      return { state: s, out: [] };
    }
    case 'cp':
    case 'mv': {
      const [a, b] = args.filter((x) => !x.startsWith('-'));
      if (!a || !b) return err(`${cmd}: falta el destino`);
      const src = getNode(s.root, resolve(s, a));
      if (!src) return err(`${cmd}: '${a}': No existe el archivo o el directorio`);
      let dest = resolve(s, b);
      const destNode = getNode(s.root, dest);
      if (destNode?.type === 'dir') dest = [...dest, resolve(s, a).pop()!];
      const parent = getNode(s.root, dest.slice(0, -1));
      if (!parent || parent.type !== 'dir') return err(`${cmd}: no se puede crear '${b}'`);
      parent.children[dest[dest.length - 1]] = clone(src);
      if (cmd === 'mv') {
        const sp = resolve(s, a);
        const sParent = getNode(s.root, sp.slice(0, -1));
        if (sParent?.type === 'dir') delete sParent.children[sp[sp.length - 1]];
      }
      return { state: s, out: [] };
    }
    case 'grep': {
      const flags = args.filter((a) => a.startsWith('-'));
      const [pattern, target] = args.filter((a) => !a.startsWith('-'));
      if (!pattern || !target) return err('Uso: grep "texto" archivo');
      const n = getNode(s.root, resolve(s, target));
      if (!n || n.type !== 'file') return err(`grep: ${target}: No existe el archivo`);
      const ci = flags.some((f) => f.includes('i'));
      const lines = n.content.split('\n').filter((l) => (ci ? l.toLowerCase().includes(pattern.toLowerCase()) : l.includes(pattern)));
      return { state: s, out: lines.map((text) => ({ text, cls: 'ok' as const })) };
    }
    case 'find': {
      const base = args[0] && !args[0].startsWith('-') ? args[0] : '.';
      const ni = args.indexOf('-name');
      const pat = ni >= 0 ? args[ni + 1] ?? '*' : '*';
      const re = new RegExp('^' + pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
      const start = getNode(s.root, resolve(s, base));
      if (!start) return err(`find: '${base}': No existe el archivo o el directorio`);
      const found: string[] = [];
      findAll(start, base === '/' ? '' : base.replace(/\/$/, ''), re, found);
      return ok(found);
    }
    case 'ps':
      return ok(['USER       PID  %CPU %MEM COMMAND', ...s.procs.map((p) => `${p.user.padEnd(9)} ${String(p.pid).padStart(5)}  ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)} ${p.cmd}`)]);
    case 'top': {
      const sorted = [...s.procs].sort((a, b) => b.cpu - a.cpu);
      return ok(['top - procesos ordenados por CPU (instantánea)', '  PID USER      %CPU %MEM COMMAND', ...sorted.map((p) => `${String(p.pid).padStart(5)} ${p.user.padEnd(9)} ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)} ${p.cmd}`)]);
    }
    case 'kill': {
      const pid = Number(args.find((a) => !a.startsWith('-')));
      const p = s.procs.find((x) => x.pid === pid);
      if (!p) return err(`kill: (${args[0] ?? ''}) - No existe el proceso`);
      if (p.user === 'root' && !asRoot) return err(`kill: (${pid}) - Operación no permitida (es de root)`);
      s.procs = s.procs.filter((x) => x.pid !== pid);
      return { state: s, out: [{ text: `Proceso ${pid} (${p.cmd}) terminado`, cls: 'ok' }] };
    }
    case 'chmod': {
      const [mode, target] = args;
      const n = target ? getNode(s.root, resolve(s, target)) : undefined;
      if (!n || n.type !== 'file') return err(`chmod: no se puede acceder a '${target ?? ''}'`);
      const map: Record<string, string> = { '7': 'rwx', '6': 'rw-', '5': 'r-x', '4': 'r--', '0': '---' };
      if (/^[0-7]{3}$/.test(mode)) n.mode = '-' + mode.split('').map((d) => map[d] ?? '---').join('');
      else if (mode === '+x') n.mode = '-rwxr-xr-x';
      return { state: s, out: [] };
    }
    case 'ping': {
      const host = args.find((a) => !a.startsWith('-')) ?? 'localhost';
      const ip = host === 'google.com' ? '142.250.80.46' : host === 'localhost' ? '127.0.0.1' : '93.184.216.34';
      return ok([`PING ${host} (${ip}): 56 bytes`, ...[1, 2, 3].map((i) => `64 bytes from ${ip}: icmp_seq=${i} time=${(10 + Math.random() * 20).toFixed(1)} ms`), '--- 3 paquetes enviados, 3 recibidos, 0% perdidos ---']);
    }
    case 'curl': {
      let method = 'GET';
      let data: string | undefined;
      const headers: Record<string, string> = {};
      let url = '';
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '-X') method = args[++i];
        else if (args[i] === '-d' || args[i] === '--data') data = args[++i];
        else if (args[i] === '-H') {
          const [k, ...v] = (args[++i] ?? '').split(':');
          headers[k.trim()] = v.join(':').trim();
        } else if (!args[i].startsWith('-')) url = args[i];
      }
      if (!url) return err('curl: falta la URL. Ej: curl http://localhost:3000/api/users');
      if (data && method === 'GET') method = 'POST';
      const m = url.match(/^(?:https?:\/\/)?([^/]+)(\/.*)?$/);
      const host = m?.[1] ?? '';
      if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) {
        if (host === 'example.com') return ok(['<!doctype html>', '<html><body><h1>Example Domain</h1></body></html>']);
        return err(`curl: (6) No se pudo resolver el host: ${host} (en el simulador usa localhost:3000)`);
      }
      const res = api.handle({ method, path: m?.[2] ?? '/', headers: { 'Content-Type': 'application/json', ...headers }, body: data });
      return { state: s, out: [{ text: `HTTP/1.1 ${res.status} ${res.statusText}`, cls: res.status < 400 ? 'ok' : 'err' }, ...JSON.stringify(res.body, null, 2).split('\n').map((text) => ({ text }))] };
    }
    case 'sudo': {
      const r = exec(prev, args.join(' '), true);
      return { ...r, state: { ...r.state, history: [...prev.history, input] } };
    }
    case 'ssh':
      return ok([`Conectando a ${args[0] ?? 'servidor'}...`, '(Simulado) Ya estás dentro de un servidor Linux: esta terminal ES el servidor.']);
    case 'apt':
    case 'brew':
      return ok([`(Simulado) Instalando ${args.slice(1).join(' ') || 'paquete'}...`, '✔ Listo']);
    default:
      return err(`${cmd}: comando no encontrado. Escribe "help" para ver los comandos.`);
  }
}
