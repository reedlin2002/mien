// Decides where a dragged widget would land, and where to draw the blue insertion
// line, from the pointer position and the on-screen boxes of rows and cells. Pure so
// it can be tested without a browser; the canvas measures the DOM and calls in.

import type { DropTarget } from '../model/types';

export interface Point {
  x: number;
  y: number;
}

export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface CellBox extends Box {
  id: string;
}

export interface RowBox extends Box {
  id: string;
  cells: CellBox[];
}

export interface Indicator {
  orientation: 'horizontal' | 'vertical';
  x: number;
  y: number;
  length: number;
}

/** Pointer this close to a row's top or bottom edge means "new row here", not "into this row". */
const EDGE_PX = 12;
/** How far outside the first or last row the line is drawn. */
const LINE_OFFSET = 6;

function edgeZone(row: Box): number {
  return Math.min(EDGE_PX, (row.bottom - row.top) * 0.25);
}

export function computeDropTarget(
  pointer: Point,
  rows: readonly RowBox[],
  canEnterRow: (rowId: string) => boolean
): DropTarget {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (pointer.y < row.top || pointer.y > row.bottom) continue;

    const edge = edgeZone(row);
    if (pointer.y < row.top + edge) return { kind: 'new-row', index: i };
    if (pointer.y > row.bottom - edge) return { kind: 'new-row', index: i + 1 };

    if (!canEnterRow(row.id)) {
      const middle = (row.top + row.bottom) / 2;
      return { kind: 'new-row', index: pointer.y < middle ? i : i + 1 };
    }
    const index = row.cells.filter((c) => (c.left + c.right) / 2 < pointer.x).length;
    return { kind: 'into-row', rowId: row.id, index };
  }

  // Above, below, or in the margin between rows.
  const index = rows.filter((r) => (r.top + r.bottom) / 2 < pointer.y).length;
  return { kind: 'new-row', index };
}

export function indicatorFor(target: DropTarget, rows: readonly RowBox[], page: Box): Indicator | null {
  if (target.kind === 'new-row') {
    if (rows.length === 0) return null;
    const i = target.index;
    let y: number;
    if (i <= 0) y = rows[0].top - LINE_OFFSET;
    else if (i >= rows.length) y = rows[rows.length - 1].bottom + LINE_OFFSET;
    else y = (rows[i - 1].bottom + rows[i].top) / 2;
    return { orientation: 'horizontal', x: page.left, y, length: page.right - page.left };
  }

  const row = rows.find((r) => r.id === target.rowId);
  if (!row || row.cells.length === 0) return null;
  const cells = row.cells;
  const j = target.index;
  let x: number;
  if (j <= 0) x = cells[0].left;
  else if (j >= cells.length) x = cells[cells.length - 1].right;
  else x = (cells[j - 1].right + cells[j].left) / 2;
  const top = Math.min(...cells.map((c) => c.top));
  const bottom = Math.max(...cells.map((c) => c.bottom));
  return { orientation: 'vertical', x, y: top, length: bottom - top };
}
