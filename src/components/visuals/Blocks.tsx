import { Fragment, useState } from 'react';
import { motion } from 'motion/react';
import type { BlockPiece, Txt } from '../../types';
import { useLang } from '../../i18n/lang';
import { Glyph, Ic } from '../ui/Icon';

const PALETTE = ['#7c6cff', '#4cc9f0', '#ff9f43', '#f78fb3', '#ffd166', '#00d29a'];

/**
 * La fórmula visual "L + A = LA": cada pieza aparece una por una y al final se combinan en el resultado.
 * Así el cerebro ve que una idea grande está hecha de ideas pequeñas que ya conoce.
 */
export function Blocks({ pieces, result, resultEmoji, compact = false }: { pieces: BlockPiece[]; result: Txt; resultEmoji?: string; compact?: boolean }) {
  const { tr, tx } = useLang();
  const [run, setRun] = useState(0);
  const step = compact ? 0.15 : 0.55;
  return (
    <div>
      <div className="blocks" key={run} style={compact ? { padding: 6, gap: 6 } : undefined}>
        {pieces.map((p, i) => (
          <Fragment key={i}>
            {i > 0 && (
              <motion.span className="block-op" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * step - step / 2 }}>
                +
              </motion.span>
            )}
            <motion.div
              className="block"
              style={{ ['--bc' as string]: p.color ?? PALETTE[i % PALETTE.length], ...(compact ? { minWidth: 0, padding: '6px 10px', fontSize: '0.85rem' } : {}) }}
              initial={{ opacity: 0, y: 24, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * step, type: 'spring', stiffness: 260, damping: 18 }}
            >
              {p.emoji && <span className="em"><Glyph emoji={p.emoji} size={compact ? 18 : 28} /></span>}
              <span>{tr(p.label)}</span>
            </motion.div>
          </Fragment>
        ))}
        <motion.span className="block-op" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: pieces.length * step }}>
          =
        </motion.span>
        <motion.div
          className="block result"
          style={compact ? { padding: '6px 12px', fontSize: '0.88rem' } : undefined}
          initial={{ opacity: 0, scale: 0.4, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: pieces.length * step + step * 0.6, type: 'spring', stiffness: 220, damping: 12 }}
        >
          {resultEmoji && <span className="em"><Glyph emoji={resultEmoji} size={28} /></span>}
          <span>{tr(result)}</span>
        </motion.div>
      </div>
      {!compact && (
        <div className="row center">
          <button className="btn btn-ghost btn-sm" onClick={() => setRun((r) => r + 1)}>
            <Ic n="reset" size={18} /> {tx('Ver otra vez', 'Watch again')}
          </button>
        </div>
      )}
    </div>
  );
}
