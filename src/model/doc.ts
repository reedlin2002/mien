import { newId } from './ops';
import type { Cell, Doc, WidthStep } from './types';

export function emptyDoc(): Doc {
  return { version: 1, username: '', marker: true, rows: [] };
}

export function widgetCell(widgetId: string, width: WidthStep): Cell {
  return { id: newId(), width, block: { type: 'widget', widgetId, params: {} } };
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
    doc.rows.every((r) => Array.isArray(r?.cells))
  );
}
