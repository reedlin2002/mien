import type { Row } from './types';

/**
 * How a row reaches GitHub, which the canvas mirrors so both look the same:
 * - inline: widgets side by side as inline images inside <p align>
 * - text: a single heading or paragraph with align
 * - table: text next to anything else. GitHub always draws table borders, and the
 *   canvas shows them too rather than pretending they won't be there.
 */
export type RowKind = 'inline' | 'text' | 'table';

export function rowKind(row: Row): RowKind {
  const hasText = row.cells.some((c) => c.block.type === 'text');
  if (!hasText) return 'inline';
  return row.cells.length === 1 ? 'text' : 'table';
}

/**
 * Whether a space separates cell `i` from the next one in an inline row. Badges at
 * natural size need the gap GitHub READMEs normally have; percentage cells must not
 * get one, since a space would push cells that add up to 100% onto two lines.
 */
export function spaceAfter(row: Row, i: number): boolean {
  const next = row.cells[i + 1];
  return next !== undefined && (row.cells[i].width === 'auto' || next.width === 'auto');
}
