import type { ReactNode } from 'react';
import { useT, type MessageKey } from '../i18n';
import { rowKind } from '../model/layout';
import { findCell, resizeCell, setRowAlign, setText, widthLimit } from '../model/ops';
import { WIDTH_STEPS, type Align, type Cell, type CellWidth, type Row, type TextKind } from '../model/types';
import { useEditor } from '../store/editor';
import { cx } from '../ui/cx';
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, ExternalIcon } from '../ui/icons';
import { getWidget } from '../widgets/registry';
import { missingParams } from '../widgets/urls';
import { ParamField } from './ParamField';

/** Right-hand panel: settings for whatever is selected, generated from the registry. */
export function Inspector() {
  const selectedId = useEditor((s) => s.selectedCellId);
  const doc = useEditor((s) => s.doc);
  const found = selectedId ? findCell(doc, selectedId) : null;

  return (
    <aside className="w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-white">
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
    <div className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-slate-900">{t('pageTitle')}</h2>
      <p className="text-sm leading-relaxed text-slate-600">{t('pageHint')}</p>
      <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">{t('pageTips')}</p>
    </div>
  );
}

function CellPanel({ cell, row }: { cell: Cell; row: Row }) {
  const t = useT();
  const block = cell.block;
  const kind = rowKind(row);

  if (block.type === 'text') {
    return (
      <div className="flex flex-col gap-5 p-4">
        <h2 className="text-sm font-semibold text-slate-900">{t('sectionText')}</h2>
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
        <p className="text-xs leading-relaxed text-slate-500">{t('textTips')}</p>
        {kind === 'table' && <p className="rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">{t('tableNote')}</p>}
      </div>
    );
  }

  const def = getWidget(block.widgetId);
  if (!def) return <div className="p-4 text-sm text-slate-500">{t('unknownWidget')}</div>;
  const missing = missingParams(def, block.params);

  return (
    <div className="flex flex-col gap-5 p-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{t.registry(def.name)}</h2>
        {def.description && <p className="mt-0.5 text-xs text-slate-500">{t.registry(def.description)}</p>}
        <a
          href={def.homepage}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          {t('by', { author: def.author })}
          <ExternalIcon width={11} height={11} />
        </a>
      </div>
      {missing.length > 0 && (
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          {t('needsSetup', { field: t.registry(missing[0].label ?? missing[0].key) })}
        </p>
      )}
      {def.params.map((param) => (
        <ParamField key={param.key} def={def} param={param} block={block} cellId={cell.id} />
      ))}
      <Section label={t('width')}>
        <WidthPicker cell={cell} row={row} allowNatural />
      </Section>
      <Section label={t('alignment')}>
        <AlignPicker row={row} />
      </Section>
      {kind === 'table' && <p className="rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">{t('tableNote')}</p>}
    </div>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
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
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          title={o.title}
          disabled={o.disabled}
          onClick={() => onPick(o.value)}
          className={cx(
            'flex min-w-9 items-center justify-center rounded-md border px-2 py-1 text-xs disabled:opacity-30',
            o.value === value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-400'
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
  const options: { value: CellWidth; label: string; disabled?: boolean }[] = [
    ...(allowNatural ? [{ value: 'auto' as const, label: t('natural') }] : []),
    ...WIDTH_STEPS.map((step) => ({ value: step, label: `${step}%`, disabled: step > limit }))
  ];
  return (
    <Segmented
      options={options}
      value={cell.width}
      onPick={(w) => edit((doc) => resizeCell(doc, cell.id, w))}
    />
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
