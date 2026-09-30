import type { RowBox } from './dropTarget';

/** Reads the on-screen boxes of every row and cell on the page, in viewport coordinates. */
export function measureRows(page: HTMLElement): RowBox[] {
  return Array.from(page.querySelectorAll<HTMLElement>('[data-row-id]')).map((rowEl) => {
    const r = rowEl.getBoundingClientRect();
    return {
      id: rowEl.dataset.rowId!,
      left: r.left,
      right: r.right,
      top: r.top,
      bottom: r.bottom,
      cells: Array.from(rowEl.querySelectorAll<HTMLElement>('[data-cell-id]')).map((cellEl) => {
        const c = cellEl.getBoundingClientRect();
        return { id: cellEl.dataset.cellId!, left: c.left, right: c.right, top: c.top, bottom: c.bottom };
      })
    };
  });
}
