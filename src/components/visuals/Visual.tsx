import { motion } from 'motion/react';
import type { CompareSide, GridItem, Visual as VisualSpec } from '../../types';
import { useLang } from '../../i18n/lang';
import { Blocks } from './Blocks';
import { Sequence } from './Sequence';
import { Pipeline } from './Pipeline';
import { SimHost } from '../sims/SimHost';

export function Grid({ items, columns }: { items: GridItem[]; columns?: number }) {
  const { tr } = useLang();
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${columns && columns > 3 ? 150 : 200}px, 1fr))` }}>
      {items.map((it, i) => (
        <motion.div
          key={i}
          className="card flat tight"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.12 }}
          style={{ borderColor: it.color ?? 'var(--border)', borderWidth: 2 }}
        >
          <div className="mono bold" style={{ fontSize: it.badge.length > 4 ? '1.1rem' : '1.6rem', color: it.color ?? 'var(--primary-2)' }}>
            {it.badge}
          </div>
          <div className="bold">{tr(it.title)}</div>
          <div className="small muted" style={{ lineHeight: 1.4 }}>{tr(it.desc)}</div>
        </motion.div>
      ))}
    </div>
  );
}

function Side({ side, delay }: { side: CompareSide; delay: number }) {
  const { tr } = useLang();
  const color = side.color ?? 'var(--primary)';
  return (
    <motion.div className="card flat" initial={{ opacity: 0, x: delay ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }} style={{ borderColor: color, borderWidth: 2 }}>
      <div style={{ fontSize: '2rem' }}>{side.emoji}</div>
      <h3 style={{ color }}>{tr(side.title)}</h3>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {side.points.map((p, i) => (
          <li key={i} className="small" style={{ marginBottom: 4 }}>
            {tr(p)}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export function Compare({ left, right }: { left: CompareSide; right: CompareSide }) {
  return (
    <div className="grid grid-2">
      <Side side={left} delay={0} />
      <Side side={right} delay={0.25} />
    </div>
  );
}

export function DataTable({ name, columns, rows, highlight = [] }: { name: string; columns: string[]; rows: (string | number | null)[][]; highlight?: number[] }) {
  return (
    <div>
      {name && <div className="table-name">{name}</div>}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={highlight.includes(i) ? 'hl' : ''}>
                {r.map((v, j) => (
                  <td key={j}>{v === null ? <span className="faint">NULL</span> : String(v)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Visual({ v }: { v: VisualSpec }) {
  switch (v.type) {
    case 'blocks':
      return <Blocks pieces={v.pieces} result={v.result} resultEmoji={v.resultEmoji} />;
    case 'sequence':
      return <Sequence actors={v.actors} messages={v.messages} />;
    case 'pipeline':
      return <Pipeline item={v.item} itemEmoji={v.itemEmoji} stages={v.stages} success={v.success} vertical={v.vertical ?? true} />;
    case 'grid':
      return <Grid items={v.items} columns={v.columns} />;
    case 'compare':
      return <Compare left={v.left} right={v.right} />;
    case 'table':
      return <DataTable name={v.name} columns={v.columns} rows={v.rows} highlight={v.highlight} />;
    case 'sim':
      return <SimHost id={v.id} props={v.props} />;
  }
}
