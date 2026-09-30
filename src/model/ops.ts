// Pure document operations. Every function returns a new Doc and leaves its input
// untouched, which is what the undo history relies on.

import {
  MAX_CELLS_PER_ROW,
  MAX_PERCENT_CELLS,
  type Align,
  type Block,
  type Cell,
  type CellWidth,
  type Doc,
  type DropTarget,
  type ParamValue,
  type Row,
  type TextBlock
} from './types';
import { fitWidths, rowTotal, snapWidth } from './widths';

export function newId(): string {
  return crypto.randomUUID();
}

function withFittedCells(row: Row, cells: Cell[]): Row {
  const widths = fitWidths(cells.map((c) => c.width));
  return { ...row, cells: cells.map((c, i) => (c.width === widths[i] ? c : { ...c, width: widths[i] })) };
}

export function findCell(doc: Doc, cellId: string): { row: Row; rowIndex: number; cellIndex: number } | null {
  for (let rowIndex = 0; rowIndex < doc.rows.length; rowIndex++) {
    const row = doc.rows[rowIndex];
    const cellIndex = row.cells.findIndex((c) => c.id === cellId);
    if (cellIndex !== -1) return { row, rowIndex, cellIndex };
  }
  return null;
}

/**
 * Whether `target` can take one more cell of width `incoming`. Rows are capped so
 * percentage widths never drop below the smallest step.
 */
export function canDrop(doc: Doc, target: DropTarget, incoming: CellWidth, movingCellId?: string): boolean {
  if (target.kind === 'new-row') return true;
  const row = doc.rows.find((r) => r.id === target.rowId);
  if (!row) return false;
  if (movingCellId !== undefined && row.cells.some((c) => c.id === movingCellId)) return true;
  if (row.cells.length >= MAX_CELLS_PER_ROW) return false;
  return incoming === 'auto' || row.cells.filter((c) => c.width !== 'auto').length < MAX_PERCENT_CELLS;
}

export function insertCell(doc: Doc, cell: Cell, target: DropTarget): Doc {
  if (!canDrop(doc, target, cell.width)) return doc;

  if (target.kind === 'new-row') {
    const index = Math.max(0, Math.min(target.index, doc.rows.length));
    const row: Row = { id: newId(), align: 'center', cells: [cell] };
    return { ...doc, rows: [...doc.rows.slice(0, index), row, ...doc.rows.slice(index)] };
  }

  return {
    ...doc,
    rows: doc.rows.map((row) => {
      if (row.id !== target.rowId) return row;
      const index = Math.max(0, Math.min(target.index, row.cells.length));
      const cells = [...row.cells.slice(0, index), cell, ...row.cells.slice(index)];
      return withFittedCells(row, cells);
    })
  };
}

export function removeCell(doc: Doc, cellId: string): Doc {
  const found = findCell(doc, cellId);
  if (!found) return doc;
  const cells = found.row.cells.filter((c) => c.id !== cellId);
  const rows =
    cells.length === 0
      ? doc.rows.filter((r) => r.id !== found.row.id)
      : doc.rows.map((r) => (r.id === found.row.id ? { ...r, cells } : r));
  return { ...doc, rows };
}

/**
 * Moves a cell to `target`, where `target` was computed against the document as it
 * is now (before the cell is lifted out). Indices are shifted to account for the
 * gap the cell leaves behind.
 */
export function moveCell(doc: Doc, cellId: string, target: DropTarget): Doc {
  const found = findCell(doc, cellId);
  if (!found) return doc;
  if (!canDrop(doc, target, found.row.cells[found.cellIndex].width, cellId)) return doc;

  const { row: origin, rowIndex: originRowIndex, cellIndex: originCellIndex } = found;
  const cell = origin.cells[originCellIndex];
  const originEmptied = origin.cells.length === 1;

  let adjusted: DropTarget = target;
  if (target.kind === 'into-row' && target.rowId === origin.id) {
    // Dropping right before or after itself is a no-op.
    if (target.index === originCellIndex || target.index === originCellIndex + 1) return doc;
    adjusted = { ...target, index: target.index > originCellIndex ? target.index - 1 : target.index };
  } else if (target.kind === 'new-row' && originEmptied) {
    // A lone cell dropped into the gap directly above or below its own row stays put.
    if (target.index === originRowIndex || target.index === originRowIndex + 1) return doc;
    if (target.index > originRowIndex) adjusted = { ...target, index: target.index - 1 };
  }

  return insertCell(removeCell(doc, cellId), cell, adjusted);
}

/** The widest a cell can grow without pushing its row past 100%. */
export function widthLimit(row: Row, cellId: string): number {
  return 100 - rowTotal(row.cells.filter((c) => c.id !== cellId).map((c) => c.width));
}

/**
 * Resizes a cell to the nearest step that still fits beside its siblings, or back to
 * its natural size with 'auto'.
 */
export function resizeCell(doc: Doc, cellId: string, percent: number | 'auto'): Doc {
  const found = findCell(doc, cellId);
  if (!found) return doc;
  const current = found.row.cells[found.cellIndex].width;
  if (percent !== 'auto' && current === 'auto') {
    const percentCells = found.row.cells.filter((c) => c.width !== 'auto').length;
    if (percentCells >= MAX_PERCENT_CELLS) return doc;
  }
  const width: CellWidth = percent === 'auto' ? 'auto' : snapWidth(percent, widthLimit(found.row, cellId));
  if (width === current) return doc;
  return {
    ...doc,
    rows: doc.rows.map((r) =>
      r.id === found.row.id ? { ...r, cells: r.cells.map((c) => (c.id === cellId ? { ...c, width } : c)) } : r
    )
  };
}

export function setRowAlign(doc: Doc, rowId: string, align: Align): Doc {
  return { ...doc, rows: doc.rows.map((r) => (r.id === rowId && r.align !== align ? { ...r, align } : r)) };
}

/** Replaces a cell's block. `fn` returning the same block leaves the doc untouched. */
export function updateBlock(doc: Doc, cellId: string, fn: (block: Block) => Block): Doc {
  const found = findCell(doc, cellId);
  if (!found) return doc;
  const cell = found.row.cells[found.cellIndex];
  const block = fn(cell.block);
  if (block === cell.block) return doc;
  return {
    ...doc,
    rows: doc.rows.map((r) =>
      r.id === found.row.id ? { ...r, cells: r.cells.map((c) => (c.id === cellId ? { ...c, block } : c)) } : r
    )
  };
}

export function setParam(doc: Doc, cellId: string, key: string, value: ParamValue): Doc {
  return updateBlock(doc, cellId, (block) =>
    block.type !== 'widget' || block.params[key] === value ? block : { ...block, params: { ...block.params, [key]: value } }
  );
}

export function setText(doc: Doc, cellId: string, patch: Partial<Pick<TextBlock, 'kind' | 'runs'>>): Doc {
  return updateBlock(doc, cellId, (block) => {
    if (block.type !== 'text') return block;
    const next = { ...block, ...patch };
    return JSON.stringify(next) === JSON.stringify(block) ? block : next;
  });
}

/** Copies a cell right after itself, or into a new row below when its row is full. */
export function duplicateCell(doc: Doc, cellId: string): { doc: Doc; id: string | null } {
  const found = findCell(doc, cellId);
  if (!found) return { doc, id: null };
  const cell = found.row.cells[found.cellIndex];
  const copy: Cell = { ...cell, id: newId() };
  const beside: DropTarget = { kind: 'into-row', rowId: found.row.id, index: found.cellIndex + 1 };
  const target: DropTarget = canDrop(doc, beside, copy.width) ? beside : { kind: 'new-row', index: found.rowIndex + 1 };
  return { doc: insertCell(doc, copy, target), id: copy.id };
}

/** Swaps the whole layout for another (a template), keeping the user's settings. */
export function replaceRows(doc: Doc, rows: Row[]): Doc {
  return { ...doc, rows };
}

/**
 * Moves a whole row to the gap at `gapIndex` (0 = above the first row), counted
 * before the row is lifted out. Dropping it into either gap next to itself is a no-op.
 */
export function moveRow(doc: Doc, rowId: string, gapIndex: number): Doc {
  const from = doc.rows.findIndex((r) => r.id === rowId);
  if (from === -1 || gapIndex === from || gapIndex === from + 1) return doc;
  const rows = doc.rows.filter((r) => r.id !== rowId);
  const to = Math.max(0, Math.min(gapIndex > from ? gapIndex - 1 : gapIndex, rows.length));
  rows.splice(to, 0, doc.rows[from]);
  return { ...doc, rows };
}

export function removeRow(doc: Doc, rowId: string): Doc {
  const rows = doc.rows.filter((r) => r.id !== rowId);
  return rows.length === doc.rows.length ? doc : { ...doc, rows };
}

/** Copies a row, with fresh ids, right below itself. */
export function duplicateRow(doc: Doc, rowId: string): Doc {
  const index = doc.rows.findIndex((r) => r.id === rowId);
  if (index === -1) return doc;
  const row = doc.rows[index];
  const copy: Row = { ...row, id: newId(), cells: row.cells.map((c) => ({ ...c, id: newId() })) };
  return { ...doc, rows: [...doc.rows.slice(0, index + 1), copy, ...doc.rows.slice(index + 1)] };
}
