import { useDraggable } from '@dnd-kit/core';
import { useState, type PointerEvent as ReactPointerEvent } from 'react';
import { removeCell, resizeCell, setRowAlign, widthLimit } from '../model/ops';
import type { Align, Cell, Row, WidthStep } from '../model/types';
import { snapWidth } from '../model/widths';
import { useEditor } from '../store/editor';
import { cx } from '../ui/cx';
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, TrashIcon } from '../ui/icons';
import { getWidget } from '../widgets/registry';
import { PREVIEW_USERNAME } from '../widgets/urls';
import { suppressNextClick } from './clicks';
import type { DragData } from './dragData';
import { WidgetImage } from './WidgetImage';

interface Props {
  cell: Cell;
  row: Row;
}

export function CellView({ cell, row }: Props) {
  const username = useEditor((s) => s.doc.username) || PREVIEW_USERNAME;
  const selected = useEditor((s) => s.selectedCellId === cell.id);
  const select = useEditor((s) => s.select);
  const [resizing, setResizing] = useState<WidthStep | null>(null);
  const data: DragData = { source: 'cell', cellId: cell.id };
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: `cell:${cell.id}`, data });

  const def = getWidget(cell.block.widgetId);
  const width = resizing ?? cell.width;

  return (
    <span
      ref={setNodeRef}
      data-cell-id={cell.id}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        select(cell.id);
      }}
      className={cx(
        'group relative inline-block cursor-grab touch-none align-baseline outline-none select-none',
        isDragging && 'opacity-30'
      )}
      style={{ width: `${width}%` }}
    >
      {def ? (
        <WidgetImage def={def} params={cell.block.params} username={username} />
      ) : (
        <span className="flex h-16 items-center justify-center rounded bg-slate-100 text-xs text-slate-500">
          Unknown widget
        </span>
      )}
      <span
        className={cx(
          'pointer-events-none absolute inset-0 rounded-sm',
          selected ? 'ring-2 ring-blue-500' : 'ring-blue-400/70 group-hover:ring-1'
        )}
      />
      {selected && !isDragging && (
        <>
          <CellToolbar cellId={cell.id} row={row} />
          {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
            <ResizeHandle key={corner} corner={corner} cell={cell} row={row} onPreview={setResizing} />
          ))}
          {resizing !== null && (
            <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-1/2 rounded bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white shadow">
              {resizing}%
            </span>
          )}
        </>
      )}
    </span>
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
  onPreview: (width: WidthStep | null) => void;
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

    const startX = e.clientX;
    const startPx = cellEl.getBoundingClientRect().width;
    const rowPx = rowEl.clientWidth;
    const direction = corner.endsWith('e') ? 1 : -1;
    // A centered cell grows on both sides, so the edge only keeps up with the
    // pointer if the width changes twice as fast.
    const factor = row.align === 'center' ? 2 : 1;
    const limit = widthLimit(row, cell.id);
    let width: WidthStep = cell.width;

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
      edit((doc) => resizeCell(doc, cell.id, width));
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
        'absolute z-10 size-3 rounded-[2px] border-2 border-blue-500 bg-white shadow-sm',
        CORNER_POSITION[corner]
      )}
    />
  );
}

const ALIGNS: { value: Align; label: string; Icon: typeof AlignLeftIcon }[] = [
  { value: 'left', label: 'Align row left', Icon: AlignLeftIcon },
  { value: 'center', label: 'Center row', Icon: AlignCenterIcon },
  { value: 'right', label: 'Align row right', Icon: AlignRightIcon }
];

function CellToolbar({ cellId, row }: { cellId: string; row: Row }) {
  const edit = useEditor((s) => s.edit);

  return (
    <span
      // Clicks here must not start a drag or reach the cell.
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-full left-1/2 z-20 mb-2 flex -translate-x-1/2 cursor-default items-center gap-0.5 rounded-md border border-slate-200 bg-white p-1 whitespace-nowrap shadow-md"
    >
      {ALIGNS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={row.align === value}
          onClick={() => edit((doc) => setRowAlign(doc, row.id, value))}
          className={cx(
            'rounded p-1.5 hover:bg-slate-100',
            row.align === value ? 'bg-blue-50 text-blue-600' : 'text-slate-600'
          )}
        >
          <Icon />
        </button>
      ))}
      <span className="mx-0.5 h-5 w-px bg-slate-200" />
      <button
        type="button"
        title="Delete (Del)"
        aria-label="Delete widget"
        onClick={() => edit((doc) => removeCell(doc, cellId))}
        className="rounded p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600"
      >
        <TrashIcon />
      </button>
    </span>
  );
}
