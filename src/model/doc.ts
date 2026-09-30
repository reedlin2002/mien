import { newId } from './ops';
import type { Align, Block, Cell, CellWidth, Doc, ParamValue, Row, TextKind, TextRun, WidthStep } from './types';

export function emptyDoc(): Doc {
  return { version: 1, username: '', marker: true, rows: [] };
}

export function widgetCell(widgetId: string, width: CellWidth, params: Record<string, ParamValue> = {}): Cell {
  return { id: newId(), width, block: { type: 'widget', widgetId, params } };
}

export function textCell(kind: TextKind, runs: TextRun[], width: WidthStep = 100): Cell {
  return { id: newId(), width, block: { type: 'text', kind, runs } };
}

/** A layout without ids, as templates store it. */
export interface RowSpec {
  align?: Align;
  cells: { width: CellWidth; block: Block }[];
}

/** Gives a stored layout fresh ids so it can be inserted more than once. */
export function instantiate(specs: readonly RowSpec[]): Row[] {
  return specs.map((spec) => ({
    id: newId(),
    align: spec.align ?? 'center',
    cells: spec.cells.map((c) => ({ id: newId(), width: c.width, block: structuredClone(c.block) }))
  }));
}

/** Loose shape check for documents read back from storage. */
export function isDoc(value: unknown): value is Doc {
  if (typeof value !== 'object' || value === null) return false;
  const doc = value as Partial<Doc>;
  return (
    doc.version === 1 &&
    typeof doc.username === 'string' &&
    typeof doc.marker === 'boolean' &&
    Array.isArray(doc.rows) &&
    doc.rows.every((r) => Array.isArray(r?.cells) && r.cells.every((c) => c?.block?.type === 'widget' || c?.block?.type === 'text'))
  );
}
