import type { PointerEvent as ReactPointerEvent } from 'react';
import { resizeCell, widthLimit } from '../model/ops';
import type { Cell, CellWidth, Row } from '../model/types';
import { snapWidth } from '../model/widths';
import { useEditor } from '../store/editor';
import { cx } from '../ui/cx';
import { suppressNextClick } from './clicks';
import { CellToolbar } from './CellToolbar';

interface Props {
  cell: Cell;
  row: Row;
  selected: boolean;
  editing: boolean;
  /** Whether corner handles make sense (a lone text block always spans the page). */
  resizable: boolean;
  /** Width shown while a handle is being dragged. */
  preview: CellWidth | null;
  onPreview: (width: CellWidth | null) => void;
}

/** Outline, resize handles, width readout and floating toolbar drawn over a cell. */
export function SelectionChrome({ cell, row, selected, editing, resizable, preview, onPreview }: Props) {
  return (
    <>
      <span
        className={cx(
          'pointer-events-none absolute inset-0 z-10 rounded-sm',
          selected ? 'ring-2 ring-blue-500' : 'ring-blue-400/70 group-hover:ring-1'
        )}
      />
      {selected && (
        <>
          <CellToolbar cell={cell} row={row} editing={editing} />
          {resizable &&
            !editing &&
            (['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
              <ResizeHandle key={corner} corner={corner} cell={cell} row={row} onPreview={onPreview} />
            ))}
          {preview !== null && (
            <span className="pointer-events-none absolute top-1/2 left-1/2 z-20 -translate-1/2 rounded bg-blue-600 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-white shadow">
              {preview === 'auto' ? 'auto' : `${preview}%`}
            </span>
          )}
        </>
      )}
    </>
  );
}

const CORNER_POSITION = {
  nw: '-top-1.5 -left-1.5 cursor-nwse-resize',
  ne: '-top-1.5 -right-1.5 cursor-nesw-resize',
  sw: '-bottom-1.5 -left-1.5 cursor-nesw-resize',
  se: '-bottom-1.5 -right-1.5 cursor-nwse-resize'
} as const;

interface HandleProps {
  corner: keyof typeof CORNER_POSITION;
  cell: Cell;
  row: Row;
  onPreview: (width: CellWidth | null) => void;
}

/**
 * Dragging a corner changes the cell's width; height follows the image. The width
 * snaps to the same steps the model allows, so what shows while dragging is exactly
 * what gets committed.
 */
function ResizeHandle({ corner, cell, row, onPreview }: HandleProps) {
  const edit = useEditor((s) => s.edit);

  function start(e: ReactPointerEvent<HTMLSpanElement>) {
    // Keep the cell's drag listener from treating this as a move.
    e.stopPropagation();
    e.preventDefault();
    const cellEl = e.currentTarget.closest<HTMLElement>('[data-cell-id]');
    const rowEl = e.currentTarget.closest<HTMLElement>('[data-row-id]');
    if (!cellEl || !rowEl) return;
    // Percentages are of the row, or of the table when the row is one.
    const container = cellEl.closest('table') ?? rowEl;

    const startX = e.clientX;
    const startPx = cellEl.getBoundingClientRect().width;
    const rowPx = container.getBoundingClientRect().width;
    const direction = corner.endsWith('e') ? 1 : -1;
    // A centered inline cell grows on both sides, so the edge only keeps up with the
    // pointer if the width changes twice as fast.
    const factor = row.align === 'center' && !cellEl.closest('table') ? 2 : 1;
    const limit = widthLimit(row, cell.id);
    let width: CellWidth = cell.width;

    const move = (ev: PointerEvent) => {
      const px = startPx + direction * factor * (ev.clientX - startX);
      width = snapWidth((px / rowPx) * 100, limit);
      onPreview(width);
    };
    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      onPreview(null);
      if (width !== cell.width) edit((doc) => resizeCell(doc, cell.id, width));
      suppressNextClick();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }

  return (
    <span
      onPointerDown={start}
      className={cx(
        'absolute z-20 size-3 rounded-[2px] border-2 border-blue-500 bg-white shadow-sm',
        CORNER_POSITION[corner]
      )}
    />
  );
}
