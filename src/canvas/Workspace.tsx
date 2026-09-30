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
import { useEffect, useRef, useState, type RefObject } from 'react';
import { useT } from '../i18n';
import { Inspector } from '../inspector/Inspector';
import { canDrop, findCell, insertCell, moveCell } from '../model/ops';
import type { CellWidth, DropTarget } from '../model/types';
import { useEditor } from '../store/editor';
import { usePrefs } from '../store/prefs';
import { getWidget } from '../widgets/registry';
import { PREVIEW_USERNAME } from '../widgets/urls';
import { Canvas } from './Canvas';
import { suppressNextClick } from './clicks';
import type { DragData } from './dragData';
import { computeDropTarget, indicatorFor, type Indicator, type Point } from './dropTarget';
import { measureRows } from './measure';
import { BOX_WIDTH } from './page';
import { createFromPalette, paletteItem } from './paletteItems';
import { Palette, PaletteThumb } from './Palette';
import { WidgetImage } from './WidgetImage';

interface Drop {
  target: DropTarget;
  indicator: Indicator | null;
}

function sameDrop(a: Drop | null, b: Drop | null): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function incomingWidth(data: DragData): CellWidth {
  if (data.source === 'palette') return paletteItem(data.itemId)?.width ?? 100;
  const doc = useEditor.getState().doc;
  const found = findCell(doc, data.cellId);
  return found ? found.row.cells[found.cellIndex].width : 100;
}

/** Fits GitHub's fixed README width into `main`, never enlarging it. */
function useZoom(ref: RefObject<HTMLElement | null>): number {
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width - 48;
      setZoom(Math.max(0.5, Math.min(1, available / BOX_WIDTH)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return zoom;
}

export function Workspace() {
  const t = useT();
  const edit = useEditor((s) => s.edit);
  const select = useEditor((s) => s.select);
  const isEmpty = useEditor((s) => s.doc.rows.length === 0);
  const pageRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLElement>(null);
  const origin = useRef<Point>({ x: 0, y: 0 });
  const dropRef = useRef<Drop | null>(null);
  const [active, setActive] = useState<DragData | null>(null);
  const [drop, setDropState] = useState<Drop | null>(null);
  const zoom = useZoom(zoneRef);

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
    const width = incomingWidth(data);
    const rows = measureRows(page);
    const target = computeDropTarget(pointer, rows, (rowId) =>
      canDrop(doc, { kind: 'into-row', rowId, index: 0 }, width, movingId)
    );
    // Dropping a cell where it already is changes nothing, so don't promise a change.
    if (movingId && moveCell(doc, movingId, target) === doc) return null;

    const pageBox = page.getBoundingClientRect();
    const content = rows[0] ?? pageBox;
    const line = indicatorFor(target, rows, { left: content.left, right: content.right, top: pageBox.top, bottom: pageBox.bottom });
    // Measured on screen, drawn inside the zoomed page: convert to its own pixels.
    const indicator = line && {
      ...line,
      x: (line.x - pageBox.left) / zoom,
      y: (line.y - pageBox.top) / zoom,
      length: line.length / zoom
    };
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
      const cell = createFromPalette(data.itemId, t.lang);
      if (!cell) return;
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
        <main ref={zoneRef} className="min-w-0 flex-1 overflow-auto bg-slate-100">
          <Canvas pageRef={pageRef} zoom={zoom} indicator={drop?.indicator ?? null} emptyTargeted={active !== null && drop !== null && isEmpty} />
        </main>
        <Inspector />
      </div>
      <DragOverlay dropAnimation={null}>{active && <DragPreview data={active} />}</DragOverlay>
    </DndContext>
  );
}

function DragPreview({ data }: { data: DragData }) {
  const doc = useEditor((s) => s.doc);
  const mode = usePrefs((s) => s.mode);
  const username = doc.username || PREVIEW_USERNAME;

  if (data.source === 'palette') {
    const item = paletteItem(data.itemId);
    if (!item) return null;
    return (
      <div className="w-full cursor-grabbing rounded-lg bg-white p-1.5 opacity-90 shadow-xl ring-2 ring-blue-500">
        <PaletteThumb item={item} />
      </div>
    );
  }

  const found = findCell(doc, data.cellId);
  if (!found) return null;
  const cell = found.row.cells[found.cellIndex];
  const block = cell.block;
  if (block.type === 'text') {
    return (
      <div className="h-full w-full cursor-grabbing rounded bg-blue-500/10 opacity-80 shadow-xl ring-2 ring-blue-500" />
    );
  }
  const def = getWidget(block.widgetId);
  if (!def) return null;
  return (
    <div className="flex h-full w-full cursor-grabbing items-center justify-center">
      <WidgetImage
        def={def}
        params={block.params}
        username={username}
        mode={mode}
        natural={cell.width === 'auto'}
        className="rounded opacity-80 shadow-xl ring-2 ring-blue-500"
      />
    </div>
  );
}
