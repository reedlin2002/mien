import { describe, expect, it } from 'vitest';
import { emptyDoc, widgetCell } from './doc';
import { canDrop, insertCell, moveCell, removeCell, resizeCell, setRowAlign, widthLimit } from './ops';
import type { Doc, WidthStep } from './types';
import { fitWidths, snapWidth, stepAtMost } from './widths';

/** Builds a doc from width lists, one list per row. Cell ids are r{row}c{cell}. */
function docOf(...rows: WidthStep[][]): Doc {
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
    expect(canDrop(before, target)).toBe(false);
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
