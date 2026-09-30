import { useDraggable } from '@dnd-kit/core';
import { Fragment, useCallback, useRef, type ReactNode } from 'react';
import { useT, type MessageKey } from '../i18n';
import { rowKind, spaceAfter } from '../model/layout';
import { duplicateRow, insertCell, moveRow, removeRow } from '../model/ops';
import type { Row } from '../model/types';
import { useEditor } from '../store/editor';
import { useUi } from '../store/ui';
import { cx } from '../ui/cx';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BadgeIcon,
  ChartIcon,
  CopyIcon,
  GripIcon,
  ParagraphIcon,
  PlusIcon,
  TextIcon,
  TrashIcon
} from '../ui/icons';
import { useDismiss } from '../ui/useDismiss';
import { InlineWidgetCell, TableCell, TextRowCell } from './cells';
import type { DragData } from './dragData';
import { createFromPalette } from './paletteItems';

interface Props {
  row: Row;
  index: number;
  count: number;
}

/**
 * One row, rendered as the element the compiler turns it into. Its handle and the
 * "add row" gap above it are positioned out of flow so they never change the layout.
 */
export function RowView({ row, index, count }: Props) {
  const first = index === 0;
  return (
    <RowShell row={row} index={index} count={count}>
      {rowBody(row, first)}
    </RowShell>
  );
}

function rowBody(row: Row, first: boolean): ReactNode {
  switch (rowKind(row)) {
    case 'inline':
      return row.cells.map((cell, i) => (
        <Fragment key={cell.id}>
          <InlineWidgetCell cell={cell} row={row} />
          {spaceAfter(row, i) && ' '}
        </Fragment>
      ));
    case 'text':
      return <TextRowCell cell={row.cells[0]} row={row} first={first} />;
    case 'table':
      return (
        <table align={row.align} style={first ? { marginTop: 0 } : undefined}>
          <tbody>
            <tr>
              {row.cells.map((cell) => (
                <TableCell key={cell.id} cell={cell} row={row} />
              ))}
            </tr>
          </tbody>
        </table>
      );
  }
}

function RowShell({ row, index, count, children }: Props & { children: ReactNode }) {
  const inline = rowKind(row) === 'inline';
  const data: DragData = { source: 'row', rowId: row.id };
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: `row:${row.id}`, data });
  return (
    <div
      data-row-id={row.id}
      // Like GitHub's <p align>: 16px below, text-align positions the images.
      className={cx('group/row relative', inline && 'mb-4', isDragging && 'opacity-40')}
      style={inline ? { textAlign: row.align } : undefined}
    >
      {children}
      <RowHandle row={row} index={index} count={count} dragRef={setNodeRef} dragProps={{ ...listeners, ...attributes }} />
      <AddRowGap index={index} edge="top" />
      {index === count - 1 && <AddRowGap index={count} edge="bottom" />}
    </div>
  );
}

function RowHandle({
  row,
  index,
  count,
  dragRef,
  dragProps
}: {
  row: Row;
  index: number;
  count: number;
  dragRef: (el: HTMLElement | null) => void;
  dragProps: object;
}) {
  const t = useT();
  const edit = useEditor((s) => s.edit);
  const open = useUi((s) => s.rowMenu === row.id);
  const dragging = useUi((s) => s.dragging);
  const setUi = useUi((s) => s.set);
  const hasSelection = useEditor((s) => row.cells.some((c) => c.id === s.selectedCellId));
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setUi({ rowMenu: null }), [setUi]);
  useDismiss(ref, open, close);

  const act = (fn: () => void) => () => {
    fn();
    close();
  };

  return (
    <div
      ref={ref}
      className="absolute top-0 bottom-0 -left-[46px] z-20 flex w-6 items-stretch font-sans text-sm"
      style={{ textAlign: 'left' }}
    >
      <button
        ref={dragRef}
        type="button"
        {...dragProps}
        aria-label={t('rowHandle', { n: index + 1 })}
        title={t('rowHandle', { n: index + 1 })}
        onClick={(e) => {
          e.stopPropagation();
          setUi({ rowMenu: open ? null : row.id });
        }}
        className={cx(
          'flex w-6 cursor-grab touch-none items-center justify-center rounded-md transition',
          open || hasSelection ? 'bg-brand-tint text-brand-ink opacity-100' : 'text-faint opacity-0 hover:bg-line/60',
          !dragging && 'group-hover/row:opacity-100'
        )}
      >
        <GripIcon />
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-0 left-8 w-48 rounded-xl border border-line bg-white p-1 text-ink shadow-lg"
        >
          <MenuItem Icon={ArrowUpIcon} label="moveUp" disabled={index === 0} onClick={act(() => edit((d) => moveRow(d, row.id, index - 1)))} />
          <MenuItem Icon={ArrowDownIcon} label="moveDown" disabled={index === count - 1} onClick={act(() => edit((d) => moveRow(d, row.id, index + 2)))} />
          <MenuItem Icon={CopyIcon} label="duplicateRow" onClick={act(() => edit((d) => duplicateRow(d, row.id)))} />
          <MenuItem Icon={TrashIcon} label="deleteRow" danger onClick={act(() => edit((d) => removeRow(d, row.id)))} />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  Icon,
  label,
  disabled,
  danger,
  onClick
}: {
  Icon: typeof ArrowUpIcon;
  label: MessageKey;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  const t = useT();
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm disabled:opacity-35',
        danger ? 'text-[#b42318] hover:bg-[#fdecea]' : 'hover:bg-ground'
      )}
    >
      <Icon width={15} height={15} />
      {t(label)}
    </button>
  );
}

const QUICK: { id: string; label: MessageKey; Icon: typeof TextIcon }[] = [
  { id: 'text:h2', label: 'quickHeading', Icon: TextIcon },
  { id: 'text:p', label: 'quickParagraph', Icon: ParagraphIcon },
  { id: 'widget:github-stats', label: 'quickStats', Icon: ChartIcon },
  { id: 'widget:social-badge', label: 'quickSocial', Icon: BadgeIcon }
];

/** Hover the gap between rows to add one there without dragging. */
function AddRowGap({ index, edge }: { index: number; edge: 'top' | 'bottom' }) {
  const t = useT();
  const edit = useEditor((s) => s.edit);
  const select = useEditor((s) => s.select);
  const open = useUi((s) => s.addRowAt === index);
  const dragging = useUi((s) => s.dragging);
  const setUi = useUi((s) => s.set);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setUi({ addRowAt: null }), [setUi]);
  useDismiss(ref, open, close);

  if (dragging) return null;

  function add(itemId: string) {
    const cell = createFromPalette(itemId, t.lang);
    if (!cell) return;
    edit((doc) => insertCell(doc, cell, { kind: 'new-row', index }));
    select(cell.id);
    close();
  }

  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      className={cx(
        'group/gap absolute right-0 left-0 z-10 flex h-3.5 items-center gap-2 font-sans',
        edge === 'top' ? '-top-3.5' : 'top-full'
      )}
      style={{ textAlign: 'left' }}
    >
      <span className={cx('h-0.5 flex-1 bg-brand transition', open ? 'opacity-100' : 'opacity-0 group-hover/gap:opacity-100')} />
      <button
        type="button"
        onClick={() => setUi({ addRowAt: open ? null : index })}
        className={cx(
          'flex h-6 items-center gap-1 rounded-full bg-brand pr-2.5 pl-1.5 text-xs font-medium whitespace-nowrap text-brand-ink transition',
          open ? 'opacity-100' : 'opacity-0 group-hover/gap:opacity-100 focus:opacity-100'
        )}
      >
        <PlusIcon width={13} height={13} strokeWidth={2.5} />
        {t('addRow')}
      </button>
      <span className={cx('h-0.5 flex-1 bg-brand transition', open ? 'opacity-100' : 'opacity-0 group-hover/gap:opacity-100')} />
      {open && (
        <div className="absolute top-5 left-1/2 z-30 w-[300px] -translate-x-1/2 rounded-xl border border-line bg-white p-1.5 shadow-lg">
          <div className="grid grid-cols-2 gap-1">
            {QUICK.map(({ id, label, Icon }, i) => (
              <button
                key={id}
                type="button"
                autoFocus={i === 0}
                onClick={() => add(id)}
                className="flex h-10 items-center gap-2 rounded-lg px-2.5 text-[13px] text-ink hover:bg-brand-tint focus:bg-brand-tint focus:outline-none"
              >
                <Icon width={16} height={16} />
                {t(label)}
              </button>
            ))}
          </div>
          <p className="px-2.5 pt-1.5 pb-1 text-xs text-muted">{t('addRowHint')}</p>
        </div>
      )}
    </div>
  );
}
