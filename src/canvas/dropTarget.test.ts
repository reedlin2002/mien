import { describe, expect, it } from 'vitest';
import { computeDropTarget, indicatorFor, type RowBox } from './dropTarget';

// Two rows on a 0–800 page: a 100px banner, then two 50% cards 16px below it.
const rows: RowBox[] = [
  { id: 'a', left: 0, right: 800, top: 0, bottom: 100, cells: [{ id: 'a1', left: 0, right: 800, top: 0, bottom: 100 }] },
  {
    id: 'b',
    left: 0,
    right: 800,
    top: 116,
    bottom: 276,
    cells: [
      { id: 'b1', left: 0, right: 400, top: 116, bottom: 276 },
      { id: 'b2', left: 400, right: 800, top: 116, bottom: 276 }
    ]
  }
];
const page = { left: 0, right: 800, top: 0, bottom: 400 };
const open = () => true;

describe('computeDropTarget', () => {
  it('puts the widget into a row by comparing against cell midpoints', () => {
    expect(computeDropTarget({ x: 100, y: 200 }, rows, open)).toEqual({ kind: 'into-row', rowId: 'b', index: 0 });
    expect(computeDropTarget({ x: 300, y: 200 }, rows, open)).toEqual({ kind: 'into-row', rowId: 'b', index: 1 });
    expect(computeDropTarget({ x: 700, y: 200 }, rows, open)).toEqual({ kind: 'into-row', rowId: 'b', index: 2 });
  });

  it('starts a new row near a row edge', () => {
    expect(computeDropTarget({ x: 400, y: 4 }, rows, open)).toEqual({ kind: 'new-row', index: 0 });
    expect(computeDropTarget({ x: 400, y: 96 }, rows, open)).toEqual({ kind: 'new-row', index: 1 });
    expect(computeDropTarget({ x: 400, y: 120 }, rows, open)).toEqual({ kind: 'new-row', index: 1 });
  });

  it('starts a new row in the margin between rows and outside them', () => {
    expect(computeDropTarget({ x: 400, y: 108 }, rows, open)).toEqual({ kind: 'new-row', index: 1 });
    expect(computeDropTarget({ x: 400, y: -30 }, rows, open)).toEqual({ kind: 'new-row', index: 0 });
    expect(computeDropTarget({ x: 400, y: 350 }, rows, open)).toEqual({ kind: 'new-row', index: 2 });
  });

  it('falls back to the nearest new row when a row is full', () => {
    const full = (id: string) => id !== 'b';
    expect(computeDropTarget({ x: 100, y: 150 }, rows, full)).toEqual({ kind: 'new-row', index: 1 });
    expect(computeDropTarget({ x: 100, y: 250 }, rows, full)).toEqual({ kind: 'new-row', index: 2 });
  });

  it('targets the first row of an empty page', () => {
    expect(computeDropTarget({ x: 10, y: 10 }, [], open)).toEqual({ kind: 'new-row', index: 0 });
  });
});

describe('indicatorFor', () => {
  it('draws a horizontal line in the gap between rows', () => {
    expect(indicatorFor({ kind: 'new-row', index: 1 }, rows, page)).toEqual({ orientation: 'horizontal', x: 0, y: 108, length: 800 });
  });

  it('draws the line just outside the first and last rows', () => {
    expect(indicatorFor({ kind: 'new-row', index: 0 }, rows, page)?.y).toBe(-6);
    expect(indicatorFor({ kind: 'new-row', index: 2 }, rows, page)?.y).toBe(282);
  });

  it('draws a vertical line between cells', () => {
    expect(indicatorFor({ kind: 'into-row', rowId: 'b', index: 1 }, rows, page)).toEqual({
      orientation: 'vertical',
      x: 400,
      y: 116,
      length: 160
    });
    expect(indicatorFor({ kind: 'into-row', rowId: 'b', index: 2 }, rows, page)?.x).toBe(800);
  });

  it('has nothing to draw on an empty page', () => {
    expect(indicatorFor({ kind: 'new-row', index: 0 }, [], page)).toBeNull();
  });
});
