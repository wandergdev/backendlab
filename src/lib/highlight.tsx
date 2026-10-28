import type { ReactNode } from 'react';
import type { CodeLang } from '../types';

// Resaltador de sintaxis mínimo: suficiente para que el código "se vea" como en un editor.

const KEYWORDS: Record<string, string[]> = {
  js: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'await', 'async', 'new', 'class', 'import', 'from', 'export', 'default', 'try', 'catch', 'throw', 'true', 'false', 'null', 'undefined', 'of', 'in', 'typeof', 'this', 'require', 'module'],
  ts: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'await', 'async', 'new', 'class', 'import', 'from', 'export', 'default', 'try', 'catch', 'throw', 'true', 'false', 'null', 'undefined', 'of', 'in', 'typeof', 'this', 'interface', 'type', 'enum', 'implements', 'extends', 'readonly', 'as', 'number', 'string', 'boolean', 'void', 'unknown', 'any', 'never', 'private', 'public', 'keyof'],
  csharp: ['public', 'private', 'protected', 'internal', 'class', 'record', 'struct', 'interface', 'enum', 'var', 'new', 'return', 'async', 'await', 'using', 'namespace', 'static', 'void', 'int', 'long', 'decimal', 'double', 'string', 'bool', 'object', 'if', 'else', 'foreach', 'for', 'in', 'get', 'set', 'init', 'required', 'this', 'null', 'true', 'false', 'override', 'virtual', 'readonly', 'const', 'throw', 'try', 'catch', 'finally', 'where', 'select', 'from', 'orderby', 'is', 'not', 'out', 'ref', 'params', 'base', 'sealed', 'abstract', 'nameof', 'default'],
  yaml: ['true', 'false', 'on'],
  sql: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'JOIN', 'ON', 'LEFT', 'INNER', 'AS', 'AND', 'OR', 'NOT', 'ORDER', 'BY', 'GROUP', 'LIMIT', 'CREATE', 'TABLE', 'INDEX', 'PRIMARY', 'KEY', 'REFERENCES', 'BEGIN', 'COMMIT', 'ROLLBACK', 'COUNT', 'SUM', 'AVG', 'DESC', 'ASC', 'NULL', 'INTEGER', 'TEXT', 'ALTER', 'ADD', 'COLUMN', 'DISTINCT', 'HAVING', 'LIKE', 'IN'],
  bash: ['sudo', 'cd', 'ls', 'pwd', 'cat', 'git', 'docker', 'npm', 'node', 'ssh', 'curl', 'grep', 'find', 'echo', 'mkdir', 'rm', 'cp', 'mv', 'chmod', 'kill', 'ps', 'top', 'apt', 'brew', 'ping', 'nano', 'touch'],
  docker: ['FROM', 'WORKDIR', 'COPY', 'RUN', 'CMD', 'EXPOSE', 'ENV', 'ENTRYPOINT', 'ARG'],
  http: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HTTP/1.1', 'HTTP/2'],
  graphql: ['query', 'mutation', 'subscription', 'fragment'],
  json: ['true', 'false', 'null'],
  text: [],
};

type Rule = [RegExp, string];

function rulesFor(lang: CodeLang): Rule[] {
  const comment: Rule = lang === 'sql' ? [/--.*$/m, 'com'] : lang === 'bash' || lang === 'docker' || lang === 'yaml' ? [/#.*$/m, 'com'] : [/\/\/.*$|\/\*[\s\S]*?\*\//m, 'com'];
  const rules: Rule[] = [comment, [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/, 'str'], [/\b\d+(?:\.\d+)?\b/, 'num']];
  if (lang === 'csharp') rules.push([/\[[A-Z]\w*(?:\([^\]\n]*\))?\]/, 'key']);
  if (lang === 'js' || lang === 'ts' || lang === 'csharp' || lang === 'graphql') rules.push([/\b[a-zA-Z_$][\w$]*(?=[(<])/, 'fn']);
  if (lang === 'yaml') rules.push([/^\s*[\w-]+(?=:)/m, 'key']);
  if (lang === 'http') rules.push([/^[A-Za-z-]+(?=:)/m, 'key']);
  rules.push([/\b[A-Za-z_][\w/.]*\b/, 'word']);
  rules.push([/=>|===|!==|[=+\-*/<>!&|]+/, 'op']);
  return rules;
}

export function highlight(src: string, lang: CodeLang): ReactNode[] {
  if (lang === 'text') return [src];
  const kws = new Set(KEYWORDS[lang] ?? []);
  const upper = lang === 'sql' || lang === 'docker';
  const rules = rulesFor(lang);
  const out: ReactNode[] = [];
  let rest = src;
  let key = 0;
  while (rest.length) {
    let best: { idx: number; len: number; cls: string; text: string } | null = null;
    for (const [re, cls] of rules) {
      const m = re.exec(rest);
      if (m && (best === null || m.index < best.idx)) best = { idx: m.index, len: m[0].length, cls, text: m[0] };
      if (best?.idx === 0) break;
    }
    if (!best || best.len === 0) {
      out.push(rest);
      break;
    }
    if (best.idx > 0) out.push(rest.slice(0, best.idx));
    let cls = best.cls;
    if (cls === 'word') {
      const w = upper ? best.text.toUpperCase() : best.text;
      cls = kws.has(w) ? 'kw' : '';
    }
    // En JSON, una cadena seguida de ":" es una clave.
    if (lang === 'json' && cls === 'str' && /^\s*:/.test(rest.slice(best.idx + best.len))) cls = 'key';
    out.push(cls ? <span key={key++} className={`tok-${cls}`}>{best.text}</span> : best.text);
    rest = rest.slice(best.idx + best.len);
  }
  return out;
}
