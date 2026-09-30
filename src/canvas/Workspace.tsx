import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import { useRef, useState } from 'react';
import { findCell, canDrop, insertCell, moveCell } from '../model/ops';
import { widgetCell } from '../model/doc';
import type { DropTarget } from '../model/types';
import { useEditor } from '../store/editor';
import { getWidget } from '../widgets/registry';
import { PREVIEW_USERNAME } from '../widgets/urls';
import { Canvas } from './Canvas';
import { suppressNextClick } from './clicks';
import type { DragData } from './dragData';
import { computeDropTarget, indicatorFor, type Indicator, type Point } from './dropTarget';
import { measureRows } from './measure';
import { Palette } from './Palette';
import { WidgetImage } from './WidgetImage';

interface Drop {
  target: DropTarget;
  indicator: Indicator | null;
}

function sameDrop(a: Drop | null, b: Drop | null): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function Workspace() {
  const edit = useEditor((s) => s.edit);
  const select = useEditor((s) => s.select);
  const pageRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLElement>(null);
  const origin = useRef<Point>({ x: 0, y: 0 });
  const dropRef = useRef<Drop | null>(null);
  const [active, setActive] = useState<DragData | null>(null);
  const [drop, setDropState] = useState<Drop | null>(null);

  // A small threshold so a click selects instead of starting a drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function setDrop(next: Drop | null) {
    if (sameDrop(dropRef.current, next)) return;
    dropRef.current = next;
    setDropState(next);
  }

  /** Where the dragged item would land with the pointer at `pointer`, or null for "nowhere". */
  function locate(pointer: Point, data: DragData): Drop | null {
    const zone = zoneRef.current?.getBoundingClientRect();
    const page = pageRef.current;
    if (!zone || !page) return null;
    if (pointer.x < zone.left || pointer.x > zone.right || pointer.y < zone.top || pointer.y > zone.bottom) return null;

    const doc = useEditor.getState().doc;
    const movingId = data.source === 'cell' ? data.cellId : undefined;
    const rows = measureRows(page);
    const target = computeDropTarget(pointer, rows, (rowId) =>
      canDrop(doc, { kind: 'into-row', rowId, index: 0 }, movingId)
    );
    // Dropping a cell where it already is changes nothing, so don't promise a change.
    if (movingId && moveCell(doc, movingId, target) === doc) return null;

    const pageBox = page.getBoundingClientRect();
    const content = rows[0] ?? pageBox;
    const line = indicatorFor(target, rows, { left: content.left, right: content.right, top: pageBox.top, bottom: pageBox.bottom });
    // The line is drawn inside the page element, so convert to its coordinates.
    const indicator = line && { ...line, x: line.x - pageBox.left, y: line.y - pageBox.top };
    return { target, indicator };
  }

  function onDragStart(e: DragStartEvent) {
    const data = e.active.data.current as DragData;
    const pointer = e.activatorEvent as PointerEvent;
    origin.current = { x: pointer.clientX, y: pointer.clientY };
    setActive(data);
    if (data.source === 'cell') select(data.cellId);
  }

  function onDragMove(e: DragMoveEvent) {
    const data = e.active.data.current as DragData;
    setDrop(locate({ x: origin.current.x + e.delta.x, y: origin.current.y + e.delta.y }, data));
  }

  function onDragEnd(e: DragEndEvent) {
    const data = e.active.data.current as DragData;
    const target = dropRef.current?.target;
    reset();
    suppressNextClick();
    if (!target) return;

    if (data.source === 'palette') {
      const def = getWidget(data.widgetId);
      if (!def) return;
      const cell = widgetCell(def.id, def.defaultWidth);
      edit((doc) => insertCell(doc, cell, target));
      select(cell.id);
    } else {
      edit((doc) => moveCell(doc, data.cellId, target));
    }
  }

  function reset() {
    setActive(null);
    setDrop(null);
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragMove={onDragMove} onDragEnd={onDragEnd} onDragCancel={reset}>
      <div className="flex min-h-0 flex-1">
        <Palette />
        <main ref={zoneRef} className="flex-1 overflow-auto bg-slate-100">
          <Canvas
            pageRef={pageRef}
            indicator={drop?.indicator ?? null}
            emptyTargeted={active !== null && drop !== null && drop.indicator === null}
          />
        </main>
      </div>
      <DragOverlay dropAnimation={null}>{active && <DragPreview data={active} />}</DragOverlay>
    </DndContext>
  );
}

function DragPreview({ data }: { data: DragData }) {
  const doc = useEditor((s) => s.doc);
  const username = doc.username || PREVIEW_USERNAME;

  let widgetId: string;
  let params = {};
  if (data.source === 'palette') {
    widgetId = data.widgetId;
  } else {
    const found = findCell(doc, data.cellId);
    if (!found) return null;
    const cell = found.row.cells[found.cellIndex];
    widgetId = cell.block.widgetId;
    params = cell.block.params;
  }
  const def = getWidget(widgetId);
  if (!def) return null;

  return (
    <div className="flex h-full w-full cursor-grabbing items-center justify-center">
      <WidgetImage def={def} params={params} username={username} className="rounded opacity-80 shadow-xl ring-2 ring-blue-500" />
    </div>
  );
}
