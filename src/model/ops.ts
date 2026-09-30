// Pure document operations. Every function returns a new Doc and leaves its input
// untouched, which is what the undo history relies on.

import {
  MAX_CELLS_PER_ROW,
  type Align,
  type Cell,
  type Doc,
  type DropTarget,
  type Row,
  type WidthStep
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

/** Whether `target` can take one more cell. Rows are capped so widths never drop below the smallest step. */
export function canDrop(doc: Doc, target: DropTarget, movingCellId?: string): boolean {
  if (target.kind === 'new-row') return true;
  const row = doc.rows.find((r) => r.id === target.rowId);
  if (!row) return false;
  const staysInRow = movingCellId !== undefined && row.cells.some((c) => c.id === movingCellId);
  return staysInRow || row.cells.length < MAX_CELLS_PER_ROW;
}

export function insertCell(doc: Doc, cell: Cell, target: DropTarget): Doc {
  if (!canDrop(doc, target)) return doc;

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
  if (!canDrop(doc, target, cellId)) return doc;

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

/** Resizes a cell to the nearest step that still fits beside its siblings. */
export function resizeCell(doc: Doc, cellId: string, percent: number): Doc {
  const found = findCell(doc, cellId);
  if (!found) return doc;
  const width: WidthStep = snapWidth(percent, widthLimit(found.row, cellId));
  if (width === found.row.cells[found.cellIndex].width) return doc;
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
