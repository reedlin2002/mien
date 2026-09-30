import { useDraggable } from '@dnd-kit/core';
import { useState } from 'react';
import { useT, type MessageKey } from '../i18n';
import { insertCell } from '../model/ops';
import { useEditor } from '../store/editor';
import { cx } from '../ui/cx';
import { SearchIcon } from '../ui/icons';
import { getWidget } from '../widgets/registry';
import { PREVIEW_USERNAME } from '../widgets/urls';
import type { DragData } from './dragData';
import { createFromPalette, PALETTE, SECTIONS, type PaletteItem, type Section } from './paletteItems';
import { WidgetImage } from './WidgetImage';

const SECTION_LABEL: Record<Section, MessageKey> = {
  text: 'sectionText',
  header: 'sectionHeader',
  stats: 'sectionStats',
  skills: 'sectionSkills',
  badges: 'sectionBadges',
  media: 'sectionMedia'
};

const TEXT_LABEL: Record<string, MessageKey> = { 'text:h1': 'textH1', 'text:h2': 'textH2', 'text:h3': 'textH3', 'text:p': 'textP' };

function itemText(item: PaletteItem, t: ReturnType<typeof useT>): { name: string; description: string } {
  if (item.section === 'text') return { name: t(TEXT_LABEL[item.id]), description: '' };
  const def = getWidget(item.id.slice('widget:'.length));
  return { name: t.registry(def?.name), description: t.registry(def?.description) };
}

export function Palette() {
  const t = useT();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const matches = PALETTE.filter((item) => {
    if (!q) return true;
    const { name, description } = itemText(item, t);
    return `${name} ${description} ${item.id}`.toLowerCase().includes(q);
  });

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-3">
        <label className="flex items-center gap-2 rounded-md border border-slate-300 px-2.5 py-1.5 text-slate-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
          <SearchIcon />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search')}
            className="w-full bg-transparent text-sm text-slate-900 outline-none"
          />
        </label>
      </div>
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
        {SECTIONS.map((section) => {
          const items = matches.filter((item) => item.section === section);
          if (items.length === 0) return null;
          return (
            <section key={section}>
              <h2 className="mb-2 px-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{t(SECTION_LABEL[section])}</h2>
              <div className={cx('grid gap-2', section === 'text' ? 'grid-cols-3' : 'grid-cols-2')}>
                {items.map((item) => (
                  <PaletteCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          );
        })}
        {matches.length === 0 && <p className="px-1 text-sm text-slate-500">{t('noMatches', { q: query })}</p>}
        <p className="mt-auto px-1 text-xs leading-relaxed text-slate-500">{t('paletteHint')}</p>
      </div>
    </aside>
  );
}

function PaletteCard({ item }: { item: PaletteItem }) {
  const t = useT();
  const edit = useEditor((s) => s.edit);
  const select = useEditor((s) => s.select);
  const data: DragData = { source: 'palette', itemId: item.id };
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: `palette:${item.id}`, data });
  const { name, description } = itemText(item, t);

  function addAtBottom() {
    const cell = createFromPalette(item.id, t.lang);
    if (!cell) return;
    edit((doc) => insertCell(doc, cell, { kind: 'new-row', index: doc.rows.length }));
    select(cell.id);
    requestAnimationFrame(() =>
      document.querySelector(`[data-cell-id="${cell.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    );
  }

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      onClick={addAtBottom}
      title={description || name}
      className={cx(
        'group flex cursor-grab touch-none flex-col gap-1.5 rounded-lg border border-slate-200 p-1.5 text-left transition hover:border-blue-400 hover:shadow-sm',
        isDragging && 'opacity-50'
      )}
    >
      <PaletteThumb item={item} />
      <span className="truncate px-0.5 text-xs font-medium text-slate-700">{name}</span>
    </button>
  );
}

export function PaletteThumb({ item }: { item: PaletteItem }) {
  const username = useEditor((s) => s.doc.username) || PREVIEW_USERNAME;
  if (item.section === 'text') {
    const kind = item.id.slice('text:'.length);
    return (
      <span className="flex h-12 items-center justify-center rounded bg-slate-50 font-semibold text-slate-700">
        {kind === 'h1' && <span className="text-xl">H1</span>}
        {kind === 'h2' && <span className="text-base">H2</span>}
        {kind === 'p' && <span className="text-xs font-normal">Aa ¶</span>}
      </span>
    );
  }
  const def = getWidget(item.id.slice('widget:'.length));
  if (!def) return null;
  const needsInput = def.params.some((p) => p.required);
  return (
    <span className="flex h-16 items-center justify-center overflow-hidden rounded bg-slate-50 p-1">
      {needsInput ? (
        <span className="text-[10px] text-slate-400">{def.id === 'image' ? '🖼️ GIF' : def.name}</span>
      ) : (
        <WidgetImage def={def} params={{}} username={username} natural={item.width === 'auto'} className="max-h-full object-contain" />
      )}
    </span>
  );
}
