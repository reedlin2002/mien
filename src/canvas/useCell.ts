import { useDraggable } from '@dnd-kit/core';
import type { MouseEvent } from 'react';
import type { Cell } from '../model/types';
import { useEditor } from '../store/editor';
import type { DragData } from './dragData';

/** Where a click that starts text editing landed, so the caret can go there. */
export let pendingCaret: { x: number; y: number } | null = null;

export function takePendingCaret() {
  const point = pendingCaret;
  pendingCaret = null;
  return point;
}

/**
 * Selection, dragging and click handling shared by every kind of cell. Clicking a
 * text cell that is already selected starts typing, the way a text box behaves in
 * slide software.
 */
export function useCell(cell: Cell) {
  const selected = useEditor((s) => s.selectedCellId === cell.id);
  const editing = useEditor((s) => s.editingCellId === cell.id);
  const select = useEditor((s) => s.select);
  const startEditing = useEditor((s) => s.startEditing);
  const data: DragData = { source: 'cell', cellId: cell.id };
  const drag = useDraggable({ id: `cell:${cell.id}`, data, disabled: editing });
  const isText = cell.block.type === 'text';

  function onClick(e: MouseEvent) {
    e.stopPropagation();
    if (editing) return;
    if (isText && selected) {
      pendingCaret = { x: e.clientX, y: e.clientY };
      startEditing(cell.id);
    } else {
      select(cell.id);
    }
  }

  function onDoubleClick(e: MouseEvent) {
    e.stopPropagation();
    if (!isText || editing) return;
    pendingCaret = { x: e.clientX, y: e.clientY };
    startEditing(cell.id);
  }

  return {
    selected,
    editing,
    isDragging: drag.isDragging,
    ref: drag.setNodeRef,
    props: {
      'data-cell-id': cell.id,
      ...(editing ? {} : drag.listeners),
      ...drag.attributes,
      // Text being typed into must stay reachable by the keyboard and not look like a button.
      ...(editing ? { role: undefined, tabIndex: undefined } : {}),
      onClick,
      onDoubleClick
    }
  };
}
