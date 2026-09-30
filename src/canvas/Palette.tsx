import { useDraggable } from '@dnd-kit/core';
import { widgetCell } from '../model/doc';
import { insertCell } from '../model/ops';
import { useEditor } from '../store/editor';
import { cx } from '../ui/cx';
import { WIDGETS } from '../widgets/registry';
import type { WidgetDef } from '../widgets/types';
import { PREVIEW_USERNAME } from '../widgets/urls';
import type { DragData } from './dragData';
import { WidgetImage } from './WidgetImage';

export function Palette() {
  return (
    <aside className="flex w-64 shrink-0 flex-col gap-3 overflow-y-auto border-r border-slate-200 bg-white p-3">
      <h2 className="px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">Widgets</h2>
      {WIDGETS.map((def) => (
        <PaletteItem key={def.id} def={def} />
      ))}
      <p className="mt-auto px-1 text-xs leading-relaxed text-slate-500">
        Drag a widget onto the page, or click it to add it at the bottom.
      </p>
    </aside>
  );
}

function PaletteItem({ def }: { def: WidgetDef }) {
  const username = useEditor((s) => s.doc.username) || PREVIEW_USERNAME;
  const edit = useEditor((s) => s.edit);
  const select = useEditor((s) => s.select);
  const data: DragData = { source: 'palette', widgetId: def.id };
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: `palette:${def.id}`, data });

  function addAtBottom() {
    const cell = widgetCell(def.id, def.defaultWidth);
    edit((doc) => insertCell(doc, cell, { kind: 'new-row', index: doc.rows.length }));
    select(cell.id);
  }

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      onClick={addAtBottom}
      className={cx(
        'group flex cursor-grab touch-none flex-col gap-2 rounded-lg border border-slate-200 p-2 text-left transition hover:border-blue-400 hover:shadow-sm',
        isDragging && 'opacity-50'
      )}
    >
      <span className="flex h-20 items-center justify-center overflow-hidden rounded bg-slate-50 p-1.5">
        <WidgetImage def={def} params={{}} username={username} className="max-h-full object-contain" />
      </span>
      <span className="px-0.5">
        <span className="block text-sm font-medium text-slate-800">{def.name}</span>
        <span className="block text-xs text-slate-500">by {def.author}</span>
      </span>
    </button>
  );
}
