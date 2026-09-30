import { describe, expect, it } from 'vitest';
import { emptyDoc, textCell, widgetCell } from './doc';
import { canDrop, duplicateCell, insertCell, moveCell, removeCell, resizeCell, setParam, setRowAlign, setText, widthLimit } from './ops';
import type { CellWidth, Doc } from './types';
import { fitWidths, snapWidth, stepAtMost } from './widths';

/** Builds a doc from width lists, one list per row. Cell ids are r{row}c{cell}. */
function docOf(...rows: CellWidth[][]): Doc {
  return {
    ...emptyDoc(),
    rows: rows.map((widths, r) => ({
      id: `r${r}`,
      align: 'center',
      cells: widths.map((width, c) => ({ ...widgetCell('w', width), id: `r${r}c${c}` }))
    }))
  };
}

const layout = (doc: Doc) => doc.rows.map((r) => r.cells.map((c) => c.id));
const widths = (doc: Doc) => doc.rows.map((r) => r.cells.map((c) => c.width));

describe('widths', () => {
  it('snaps to the nearest step within the limit', () => {
    expect(snapWidth(48)).toBe(50);
    expect(snapWidth(70)).toBe(66);
    expect(snapWidth(90, 75)).toBe(75);
    expect(snapWidth(10)).toBe(20);
  });

  it('never goes below the smallest step', () => {
    expect(snapWidth(50, 5)).toBe(20);
    expect(stepAtMost(10)).toBe(20);
  });

  it('leaves rows that fit alone and evens out rows that overflow', () => {
    expect(fitWidths([50, 25])).toEqual([50, 25]);
    expect(fitWidths([100, 50])).toEqual([50, 50]);
    expect(fitWidths([50, 50, 50])).toEqual([33, 33, 33]);
    expect(fitWidths([25, 25, 25, 25, 25])).toEqual([20, 20, 20, 20, 20]);
  });
});

describe('insertCell', () => {
  it('creates a centered row at the given index', () => {
    const doc = insertCell(docOf([100], [50]), { ...widgetCell('w', 50), id: 'new' }, { kind: 'new-row', index: 1 });
    expect(layout(doc)).toEqual([['r0c0'], ['new'], ['r1c0']]);
    expect(doc.rows[1].align).toBe('center');
  });

  it('squeezes a full row so the new cell fits', () => {
    const doc = insertCell(docOf([100]), { ...widgetCell('w', 50), id: 'new' }, { kind: 'into-row', rowId: 'r0', index: 0 });
    expect(layout(doc)).toEqual([['new', 'r0c0']]);
    expect(widths(doc)).toEqual([[50, 50]]);
  });

  it('refuses a sixth cell', () => {
    const before = docOf([20, 20, 20, 20, 20]);
    const target = { kind: 'into-row', rowId: 'r0', index: 5 } as const;
    expect(canDrop(before, target, 20)).toBe(false);
    expect(insertCell(before, widgetCell('w', 20), target)).toBe(before);
  });

  it('does not mutate its input', () => {
    const before = docOf([50]);
    const snapshot = JSON.stringify(before);
    insertCell(before, widgetCell('w', 50), { kind: 'into-row', rowId: 'r0', index: 1 });
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});

describe('removeCell', () => {
  it('drops the row when its last cell goes', () => {
    expect(layout(removeCell(docOf([50], [50, 50]), 'r0c0'))).toEqual([['r1c0', 'r1c1']]);
  });
});

describe('moveCell', () => {
  it('reorders within a row, measuring the target before the cell is lifted', () => {
    const doc = docOf([25, 25, 25]);
    expect(layout(moveCell(doc, 'r0c0', { kind: 'into-row', rowId: 'r0', index: 3 }))).toEqual([['r0c1', 'r0c2', 'r0c0']]);
    expect(layout(moveCell(doc, 'r0c2', { kind: 'into-row', rowId: 'r0', index: 0 }))).toEqual([['r0c2', 'r0c0', 'r0c1']]);
  });

  it('treats dropping next to itself as a no-op', () => {
    const doc = docOf([25, 25, 25]);
    expect(moveCell(doc, 'r0c1', { kind: 'into-row', rowId: 'r0', index: 1 })).toBe(doc);
    expect(moveCell(doc, 'r0c1', { kind: 'into-row', rowId: 'r0', index: 2 })).toBe(doc);
  });

  it('moves a lone cell down past other rows, accounting for its emptied row', () => {
    const doc = docOf([100], [50], [50]);
    expect(layout(moveCell(doc, 'r0c0', { kind: 'new-row', index: 3 }))).toEqual([['r1c0'], ['r2c0'], ['r0c0']]);
    expect(moveCell(doc, 'r0c0', { kind: 'new-row', index: 1 })).toBe(doc);
  });

  it('pulls a cell out of a row into a new row', () => {
    const doc = docOf([50, 50]);
    expect(layout(moveCell(doc, 'r0c1', { kind: 'new-row', index: 0 }))).toEqual([['r0c1'], ['r0c0']]);
  });

  it('joins another row and evens it out when needed', () => {
    const doc = moveCell(docOf([100], [50, 50]), 'r0c0', { kind: 'into-row', rowId: 'r1', index: 1 });
    expect(layout(doc)).toEqual([['r1c0', 'r0c0', 'r1c1']]);
    expect(widths(doc)).toEqual([[33, 33, 33]]);
  });

  it('can reorder inside a full row', () => {
    const doc = docOf([20, 20, 20, 20, 20]);
    expect(layout(moveCell(doc, 'r0c4', { kind: 'into-row', rowId: 'r0', index: 0 }))[0][0]).toBe('r0c4');
  });
});

describe('resizeCell', () => {
  it('snaps to a step', () => {
    expect(widths(resizeCell(docOf([50]), 'r0c0', 70))).toEqual([[66]]);
  });

  it('stops where the siblings begin', () => {
    const doc = docOf([50, 25]);
    expect(widthLimit(doc.rows[0], 'r0c0')).toBe(75);
    expect(widths(resizeCell(doc, 'r0c0', 100))).toEqual([[75, 25]]);
  });

  it('returns the same doc when nothing changes', () => {
    const doc = docOf([50]);
    expect(resizeCell(doc, 'r0c0', 52)).toBe(doc);
  });
});

describe('setRowAlign', () => {
  it('changes only the given row', () => {
    const doc = setRowAlign(docOf([50], [50]), 'r1', 'left');
    expect(doc.rows.map((r) => r.align)).toEqual(['center', 'left']);
  });
});

describe('natural-size cells', () => {
  it('lets badges share a row with percentage cells without being evened out', () => {
    const doc = insertCell(docOf([50, 50]), { ...widgetCell('w', 'auto'), id: 'badge' }, { kind: 'into-row', rowId: 'r0', index: 2 });
    expect(widths(doc)).toEqual([[50, 50, 'auto']]);
  });

  it('allows more badges than percentage cells in a row', () => {
    const doc = docOf([20, 20, 20, 20, 20]);
    expect(canDrop(doc, { kind: 'into-row', rowId: 'r0', index: 0 }, 'auto')).toBe(true);
    expect(canDrop(doc, { kind: 'into-row', rowId: 'r0', index: 0 }, 25)).toBe(false);
    const ten = docOf(Array(10).fill('auto'));
    expect(canDrop(ten, { kind: 'into-row', rowId: 'r0', index: 0 }, 'auto')).toBe(false);
  });

  it('switches between natural size and a step', () => {
    const sized = resizeCell(docOf(['auto', 50]), 'r0c0', 45);
    expect(widths(sized)).toEqual([[50, 50]]);
    expect(widths(resizeCell(sized, 'r0c0', 'auto'))).toEqual([['auto', 50]]);
  });

  it('will not turn a badge into a sixth percentage cell', () => {
    const doc = docOf([20, 20, 20, 20, 20, 'auto']);
    expect(resizeCell(doc, 'r0c5', 20)).toBe(doc);
  });
});

describe('block edits', () => {
  it('sets a widget param and ignores no-op changes', () => {
    const doc = setParam(docOf([50]), 'r0c0', 'theme', 'dracula');
    expect(doc.rows[0].cells[0].block).toMatchObject({ params: { theme: 'dracula' } });
    expect(setParam(doc, 'r0c0', 'theme', 'dracula')).toBe(doc);
  });

  it('edits text and ignores widgets', () => {
    const doc: Doc = { ...emptyDoc(), rows: [{ id: 'r', align: 'center', cells: [textCell('h1', [{ text: 'Hi' }])] }] };
    const id = doc.rows[0].cells[0].id;
    const next = setText(doc, id, { kind: 'h2' });
    expect(next.rows[0].cells[0].block).toMatchObject({ kind: 'h2', runs: [{ text: 'Hi' }] });
    expect(setText(next, id, { kind: 'h2' })).toBe(next);
    const widgets = docOf([50]);
    expect(setText(widgets, 'r0c0', { kind: 'p' })).toBe(widgets);
  });

  it('duplicates beside the original, or below when the row is full', () => {
    const beside = duplicateCell(docOf([50]), 'r0c0');
    expect(beside.doc.rows[0].cells.map((c) => c.id)).toEqual(['r0c0', beside.id]);
    const below = duplicateCell(docOf([20, 20, 20, 20, 20]), 'r0c2');
    expect(below.doc.rows[1].cells.map((c) => c.id)).toEqual([below.id]);
  });
});
