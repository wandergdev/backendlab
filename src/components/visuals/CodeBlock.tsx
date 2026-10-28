import { useState } from 'react';
import { highlight } from '../../lib/highlight';
import type { CodeLang, CodeSnippet } from '../../types';
import { useLang } from '../../i18n/lang';
import { STACKS, useStack, type Stack } from '../../i18n/stack';

const LANG_LABEL: Partial<Record<CodeLang, string>> = { ts: 'TypeScript', js: 'JavaScript', csharp: 'C#', sql: 'SQL', bash: 'Terminal', docker: 'Dockerfile', json: 'JSON', http: 'HTTP', yaml: 'YAML', graphql: 'GraphQL' };

export function CodeBlock({ snippet, copy = true }: { snippet: CodeSnippet; copy?: boolean }) {
  const { tr, tx } = useLang();
  const { stack, setStack } = useStack();
  const [copied, setCopied] = useState(false);
  const shown = stack === 'dotnet' && snippet.dotnet ? snippet.dotnet : snippet;
  const doCopy = () => {
    navigator.clipboard?.writeText(shown.src).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };
  return (
    <div>
      {snippet.dotnet && (
        <div className="row" style={{ gap: 4, marginBottom: -2 }}>
          {(['node', 'dotnet'] as Stack[]).map((st) => (
            <button
              key={st}
              className="btn btn-sm"
              onClick={() => setStack(st)}
              style={{
                borderRadius: '10px 10px 0 0',
                borderBottom: 'none',
                background: stack === st ? 'var(--code-bg)' : 'transparent',
                color: stack === st ? '#fff' : 'var(--muted)',
                borderColor: stack === st ? STACKS[st].color : 'var(--border)',
              }}
            >
              {STACKS[st].emoji} {STACKS[st].short}
            </button>
          ))}
          <span className="tiny faint hide-mobile" style={{ marginLeft: 6 }}>← {tx('cambia todos los ejemplos', 'switches all examples')}</span>
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <pre className="code" style={snippet.dotnet ? { borderTopLeftRadius: 0, borderColor: STACKS[stack].color } : undefined}>
          {highlight(shown.src, shown.lang)}
        </pre>
        <div className="row" style={{ position: 'absolute', top: 6, right: 6, gap: 4 }}>
          {LANG_LABEL[shown.lang] && <span className="tiny mono" style={{ color: '#6f7aa8' }}>{LANG_LABEL[shown.lang]}</span>}
          {copy && (
            <button className="btn btn-ghost btn-sm" onClick={doCopy} style={{ color: '#a6abd6' }}>
              {copied ? tx('¡Copiado!', 'Copied!') : tx('Copiar', 'Copy')}
            </button>
          )}
        </div>
      </div>
      {shown.caption && <div className="code-caption">{tr(shown.caption)}</div>}
    </div>
  );
}
