import type { ReactNode } from 'react';
import { useT, type MessageKey } from '../i18n';
import { rowKind } from '../model/layout';
import { findCell, resizeCell, setRowAlign, setText, widthLimit } from '../model/ops';
import { WIDTH_STEPS, type Align, type Cell, type CellWidth, type Row, type TextKind } from '../model/types';
import { useEditor } from '../store/editor';
import { cx } from '../ui/cx';
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, CheckCircleIcon, ExternalIcon, WarningIcon } from '../ui/icons';
import { getWidget } from '../widgets/registry';
import { AUTO, missingParams, paramValue } from '../widgets/urls';
import { ParamField } from './ParamField';

/** Right-hand panel: settings for whatever is selected, generated from the registry. */
export function Inspector() {
  const selectedId = useEditor((s) => s.selectedCellId);
  const doc = useEditor((s) => s.doc);
  const found = selectedId ? findCell(doc, selectedId) : null;

  return (
    <aside className="w-80 shrink-0 overflow-y-auto border-l border-line bg-white">
      {found ? (
        <CellPanel key={selectedId} cell={found.row.cells[found.cellIndex]} row={found.row} />
      ) : (
        <PagePanel />
      )}
    </aside>
  );
}

function PagePanel() {
  const t = useT();
  return (
    <div className="flex flex-col gap-3 p-5">
      <h2 className="text-base font-semibold text-ink">{t('pageTitle')}</h2>
      <p className="text-sm leading-relaxed text-muted">{t('pageHint')}</p>
      <p className="rounded-xl bg-paper p-3.5 text-xs leading-relaxed text-muted">{t('pageTips')}</p>
      <Note tone="ok">{t('parityHint')}</Note>
    </div>
  );
}

function CellPanel({ cell, row }: { cell: Cell; row: Row }) {
  const t = useT();
  const block = cell.block;
  const kind = rowKind(row);

  if (block.type === 'text') {
    return (
      <div className="flex flex-col gap-5 p-5">
        <h2 className="text-base font-semibold text-ink">{t('sectionText')}</h2>
        <Section label={t('style')}>
          <TextKindPicker cell={cell} kind={block.kind} />
        </Section>
        <Section label={t('alignment')}>
          <AlignPicker row={row} />
        </Section>
        {kind === 'table' && (
          <Section label={t('width')}>
            <WidthPicker cell={cell} row={row} allowNatural={false} />
          </Section>
        )}
        <p className="text-xs leading-relaxed text-muted">{t('textTips')}</p>
        {kind === 'table' && <Note tone="warn">{t('tableNote')}</Note>}
      </div>
    );
  }

  const def = getWidget(block.widgetId);
  if (!def) return <div className="p-4 text-sm text-muted">{t('unknownWidget')}</div>;
  const missing = missingParams(def, block.params);
  const themeParam = def.theme ? def.params.find((p) => p.key === def.theme!.param) : undefined;
  const autoTheme = def.theme && (!themeParam || paramValue(themeParam, block.params) === AUTO);

  return (
    <div className="flex flex-col gap-5 p-5">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">{t.registry(def.name)}</h2>
          <span className="rounded-full bg-ground px-2 py-0.5 text-[11px] font-medium text-muted">{t(CATEGORY_LABEL[def.category])}</span>
        </div>
        {def.description && <p className="mt-0.5 text-xs text-muted">{t.registry(def.description)}</p>}
        <a
          href={def.homepage}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-xs text-brand-text hover:underline"
        >
          {t('by', { author: def.author })}
          <ExternalIcon width={11} height={11} />
        </a>
      </div>
      {missing.length > 0 && <Note tone="warn">{t('needsSetup', { field: t.registry(missing[0].label ?? missing[0].key) })}</Note>}
      {def.params.map((param) => (
        <ParamField key={param.key} def={def} param={param} block={block} cellId={cell.id} />
      ))}
      <Section label={t('width')}>
        <WidthPicker cell={cell} row={row} allowNatural />
      </Section>
      <Section label={t('alignment')}>
        <AlignPicker row={row} />
      </Section>
      {kind === 'table' && <Note tone="warn">{t('tableNote')}</Note>}
      {autoTheme && <Note tone="ok">{t('autoThemeNote')}</Note>}
    </div>
  );
}

const CATEGORY_LABEL: Record<string, MessageKey> = {
  header: 'sectionHeader',
  stats: 'sectionStats',
  skills: 'sectionSkills',
  badges: 'sectionBadges',
  media: 'sectionMedia'
};

function Note({ tone, children }: { tone: 'ok' | 'warn'; children: ReactNode }) {
  const Icon = tone === 'ok' ? CheckCircleIcon : WarningIcon;
  return (
    <p
      className={cx(
        'flex gap-2.5 rounded-xl p-3.5 text-xs leading-relaxed',
        tone === 'ok' ? 'bg-paper text-[#4a4843]' : 'bg-[#fff4e5] text-[#7a4100]'
      )}
    >
      <Icon width={16} height={16} className={cx('shrink-0', tone === 'ok' && 'text-github')} />
      <span>{children}</span>
    </p>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-muted">{label}</span>
      {children}
    </div>
  );
}

function Segmented<T extends string | number>({
  options,
  value,
  onPick
}: {
  options: { value: T; label: ReactNode; title?: string; disabled?: boolean }[];
  value: T;
  onPick: (v: T) => void;
}) {
  // A pill track with the chosen option raised, like a native segmented control.
  return (
    <div className="flex rounded-[10px] bg-ground p-[3px]" role="group">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          title={o.title}
          aria-label={o.title}
          aria-pressed={o.value === value}
          disabled={o.disabled}
          onClick={() => onPick(o.value)}
          className={cx(
            'flex h-7 min-w-0 flex-1 items-center justify-center rounded-[7px] px-1 text-[11px] disabled:text-faint/60',
            o.value === value ? 'bg-white font-semibold text-ink shadow-sm' : 'text-muted enabled:hover:text-ink'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function WidthPicker({ cell, row, allowNatural }: { cell: Cell; row: Row; allowNatural: boolean }) {
  const t = useT();
  const edit = useEditor((s) => s.edit);
  const limit = widthLimit(row, cell.id);
  const options: { value: CellWidth; label: string; title: string; disabled?: boolean }[] = [
    ...(allowNatural ? [{ value: 'auto' as const, label: 'auto', title: t('natural') }] : []),
    ...WIDTH_STEPS.map((step) => ({ value: step, label: String(step), title: `${step}%`, disabled: step > limit }))
  ];
  const blocked = WIDTH_STEPS.some((step) => step > limit);
  const neighbours = row.cells
    .filter((c) => c.id !== cell.id)
    .map((c) => (c.block.type === 'widget' ? t.registry(getWidget(c.block.widgetId)?.name) : t('sectionText')))
    .join(', ');
  return (
    <>
      <div className="font-mono">
        <Segmented options={options} value={cell.width} onPick={(w) => edit((doc) => resizeCell(doc, cell.id, w))} />
      </div>
      {blocked && neighbours && <span className="text-xs leading-relaxed text-muted">{t('widthTakenBy', { names: neighbours })}</span>}
    </>
  );
}

const ALIGNS: { value: Align; label: MessageKey; Icon: typeof AlignLeftIcon }[] = [
  { value: 'left', label: 'alignLeft', Icon: AlignLeftIcon },
  { value: 'center', label: 'alignCenter', Icon: AlignCenterIcon },
  { value: 'right', label: 'alignRight', Icon: AlignRightIcon }
];

function AlignPicker({ row }: { row: Row }) {
  const t = useT();
  const edit = useEditor((s) => s.edit);
  return (
    <Segmented
      options={ALIGNS.map(({ value, label, Icon }) => ({ value, label: <Icon />, title: t(label) }))}
      value={row.align}
      onPick={(align) => edit((doc) => setRowAlign(doc, row.id, align))}
    />
  );
}

const KINDS: { value: TextKind; label: MessageKey }[] = [
  { value: 'h1', label: 'textH1' },
  { value: 'h2', label: 'textH2' },
  { value: 'h3', label: 'textH3' },
  { value: 'p', label: 'textP' }
];

function TextKindPicker({ cell, kind }: { cell: Cell; kind: TextKind }) {
  const t = useT();
  const edit = useEditor((s) => s.edit);
  return (
    <Segmented
      options={KINDS.map((k) => ({ value: k.value, label: t(k.label) }))}
      value={kind}
      onPick={(next) => edit((doc) => setText(doc, cell.id, { kind: next }))}
    />
  );
}
