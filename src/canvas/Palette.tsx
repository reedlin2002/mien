import { useDraggable } from '@dnd-kit/core';
import { useState, type ComponentType, type SVGProps } from 'react';
import { useT, type MessageKey } from '../i18n';
import { insertCell } from '../model/ops';
import { useEditor } from '../store/editor';
import { useUi } from '../store/ui';
import { cx } from '../ui/cx';
import { BadgeIcon, ChartIcon, GridIcon, HeaderIcon, ImageIcon, SearchIcon, TextIcon } from '../ui/icons';
import { getWidget } from '../widgets/registry';
import { PREVIEW_USERNAME } from '../widgets/urls';
import type { DragData } from './dragData';
import { createFromPalette, PALETTE, SECTIONS, type PaletteItem, type Section } from './paletteItems';
import { WidgetImage } from './WidgetImage';

const SECTION_INFO: Record<Section, { label: MessageKey; Icon: ComponentType<SVGProps<SVGSVGElement>> }> = {
  text: { label: 'sectionText', Icon: TextIcon },
  header: { label: 'sectionHeader', Icon: HeaderIcon },
  stats: { label: 'sectionStats', Icon: ChartIcon },
  skills: { label: 'sectionSkills', Icon: GridIcon },
  badges: { label: 'sectionBadges', Icon: BadgeIcon },
  media: { label: 'sectionMedia', Icon: ImageIcon }
};

const TEXT_LABEL: Record<string, MessageKey> = { 'text:h1': 'textH1', 'text:h2': 'textH2', 'text:h3': 'textH3', 'text:p': 'textP' };

function itemText(item: PaletteItem, t: ReturnType<typeof useT>): { name: string; description: string } {
  if (item.section === 'text') return { name: t(TEXT_LABEL[item.id]), description: '' };
  const def = getWidget(item.id.slice('widget:'.length));
  return { name: t.registry(def?.name), description: t.registry(def?.description) };
}

/** A rail of kinds on the far left, and the chosen kind's items beside it. Search spans every kind. */
export function Palette() {
  const t = useT();
  const section = useUi((s) => s.paletteSection);
  const setUi = useUi((s) => s.set);
  const username = useEditor((s) => s.doc.username) || PREVIEW_USERNAME;
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const items = q
    ? PALETTE.filter((item) => {
        const { name, description } = itemText(item, t);
        return `${name} ${description} ${item.id}`.toLowerCase().includes(q);
      })
    : PALETTE.filter((item) => item.section === section);

  return (
    <>
      <nav aria-label={t('search')} className="flex w-[72px] shrink-0 flex-col items-center gap-1 border-r border-line bg-white pt-3">
        {SECTIONS.map((s) => {
          const { label, Icon } = SECTION_INFO[s];
          const active = !q && s === section;
          return (
            <button
              key={s}
              type="button"
              aria-current={active}
              onClick={() => {
                setQuery('');
                setUi({ paletteSection: s });
              }}
              className={cx(
                'flex h-14 w-[58px] flex-col items-center justify-center gap-1 rounded-[10px] text-[11px]',
                active ? 'bg-brand-tint font-semibold text-brand-ink' : 'text-muted hover:bg-ground hover:text-ink'
              )}
            >
              <Icon width={20} height={20} />
              {t(label)}
            </button>
          );
        })}
      </nav>
      <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-white">
        <div className="px-3.5 pt-3.5 pb-2.5">
          <label className="flex h-9 items-center gap-2 rounded-[9px] border border-line px-2.5 text-muted focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/20">
            <SearchIcon width={15} height={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchAll', { n: PALETTE.length })}
              className="w-full bg-transparent text-sm text-ink outline-none"
            />
          </label>
        </div>
        <div className="flex items-baseline justify-between px-3.5 pb-2">
          <span className="text-[13px] font-semibold text-ink">{q ? t('results') : t(SECTION_INFO[section].label)}</span>
          <span className="truncate pl-2 text-xs text-muted">{t('previewing', { user: username })}</span>
        </div>
        <div className="grid flex-1 auto-rows-min grid-cols-2 gap-2.5 overflow-y-auto px-3.5 pb-3.5">
          {items.map((item) => (
            <PaletteCard key={item.id} item={item} />
          ))}
          {items.length === 0 && <p className="col-span-2 text-sm text-muted">{t('noMatches', { q: query })}</p>}
        </div>
        <p className="border-t border-line p-3.5 text-xs leading-relaxed text-muted">{t('paletteHint')}</p>
      </aside>
    </>
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
        'flex cursor-grab touch-none flex-col gap-2 rounded-xl border border-line bg-white p-2 text-left transition hover:-translate-y-px hover:border-brand hover:shadow-sm',
        isDragging && 'opacity-50'
      )}
    >
      <PaletteThumb item={item} />
      <span className="truncate px-0.5 text-[13px] font-medium text-ink">{name}</span>
    </button>
  );
}

export function PaletteThumb({ item }: { item: PaletteItem }) {
  const username = useEditor((s) => s.doc.username) || PREVIEW_USERNAME;
  if (item.section === 'text') {
    const kind = item.id.slice('text:'.length);
    return (
      <span className="flex h-16 items-center justify-center rounded-lg bg-paper font-display font-extrabold text-ink">
        {kind === 'h1' && <span className="text-2xl">H1</span>}
        {kind === 'h2' && <span className="text-lg">H2</span>}
        {kind === 'p' && <span className="font-sans text-sm font-normal text-muted">Aa ¶</span>}
      </span>
    );
  }
  const def = getWidget(item.id.slice('widget:'.length));
  if (!def) return null;
  const needsInput = def.params.some((p) => p.required);
  return (
    <span className="flex h-16 items-center justify-center overflow-hidden rounded-lg bg-paper p-1.5">
      {needsInput ? (
        <span className="text-center text-[11px] leading-tight text-muted">{def.id === 'image' ? 'GIF / PNG' : def.name}</span>
      ) : (
        <WidgetImage def={def} params={{}} username={username} natural={item.width === 'auto'} className="max-h-full object-contain" />
      )}
    </span>
  );
}
