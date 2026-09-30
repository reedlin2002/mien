import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useT } from '../i18n';
import { setText } from '../model/ops';
import { htmlToRuns, runsToHtml } from '../model/text';
import type { Align, Cell, CellWidth, Row, TextBlock, WidgetBlock } from '../model/types';
import { useEditor } from '../store/editor';
import { usePrefs } from '../store/prefs';
import { cx } from '../ui/cx';
import { getWidget } from '../widgets/registry';
import { missingParams, PREVIEW_USERNAME } from '../widgets/urls';
import { SelectionChrome } from './SelectionChrome';
import { takePendingCaret, useCell } from './useCell';
import { WidgetImage } from './WidgetImage';

// Cells render the same elements the compiler emits (inline images in a row, a
// heading, or table cells), styled by GitHub's own CSS, so the canvas lays out the
// way the profile will. Editor chrome is drawn on top and never changes the layout.

interface CellProps {
  cell: Cell;
  row: Row;
  /** First block on the page: GitHub drops its top margin. */
  first?: boolean;
}

function widthAttr(width: CellWidth): string | undefined {
  return width === 'auto' ? undefined : `${width}%`;
}

/** A widget inside an inline row: an inline box as wide as the image GitHub will show. */
export function InlineWidgetCell({ cell, row }: CellProps) {
  const c = useCell(cell);
  const [preview, setPreview] = useState<CellWidth | null>(null);
  const width = preview ?? cell.width;
  return (
    <span
      ref={c.ref}
      {...c.props}
      className={cx(
        'group relative inline-block cursor-grab touch-none align-baseline outline-none select-none',
        c.isDragging && 'opacity-30'
      )}
      style={{ width: widthAttr(width) }}
    >
      <WidgetBody block={cell.block as WidgetBlock} natural={width === 'auto'} />
      <SelectionChrome
        cell={cell}
        row={row}
        selected={c.selected}
        editing={false}
        resizable
        preview={preview}
        onPreview={setPreview}
      />
    </span>
  );
}

/** Any cell inside a table row. */
export function TableCell({ cell, row }: CellProps) {
  const c = useCell(cell);
  const [preview, setPreview] = useState<CellWidth | null>(null);
  const width = preview ?? cell.width;
  return (
    <td
      ref={c.ref}
      {...c.props}
      width={widthAttr(width)}
      align={row.align}
      className={cx('group relative touch-none outline-none', !c.editing && 'cursor-grab', c.isDragging && 'opacity-30')}
    >
      {/* Chrome first: GitHub zeroes the margin of a cell's last child, which must be the content. */}
      <SelectionChrome
        cell={cell}
        row={row}
        selected={c.selected}
        editing={c.editing}
        resizable
        preview={preview}
        onPreview={setPreview}
      />
      {cell.block.type === 'text' ? (
        <TextBody cell={cell} block={cell.block} editing={c.editing} />
      ) : (
        <WidgetBody block={cell.block} natural={width === 'auto'} inline />
      )}
    </td>
  );
}

/** A row holding a single heading or paragraph, which always spans the page. */
export function TextRowCell({ cell, row, first }: CellProps) {
  const c = useCell(cell);
  return (
    <div
      ref={c.ref}
      {...c.props}
      className={cx('group relative touch-none outline-none', !c.editing && 'cursor-grab', c.isDragging && 'opacity-30')}
    >
      <TextBody cell={cell} block={cell.block as TextBlock} editing={c.editing} align={row.align} first={first} />
      <SelectionChrome
        cell={cell}
        row={row}
        selected={c.selected}
        editing={c.editing}
        resizable={false}
        preview={null}
        onPreview={() => {}}
      />
    </div>
  );
}

function WidgetBody({ block, natural, inline }: { block: WidgetBlock; natural: boolean; inline?: boolean }) {
  const t = useT();
  const username = useEditor((s) => s.doc.username) || PREVIEW_USERNAME;
  const mode = usePrefs((s) => s.mode);
  const def = getWidget(block.widgetId);

  if (!def) {
    return (
      <span className="flex h-16 items-center justify-center rounded bg-slate-500/10 text-xs text-slate-500">
        {t('unknownWidget')}
      </span>
    );
  }

  const missing = missingParams(def, block.params);
  if (missing.length > 0) {
    // Not exported until filled in, so it shows as a dashed placeholder instead.
    return (
      <span
        className="flex w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-slate-400/60 p-3 text-center text-xs leading-snug text-slate-500"
        style={{ aspectRatio: natural ? undefined : def.aspectRatio, minHeight: 64 }}
      >
        <span className="font-semibold">{t.registry(def.name)}</span>
        <span>{t('needsSetup', { field: t.registry(missing[0].label ?? missing[0].key) })}</span>
      </span>
    );
  }

  return (
    <WidgetImage
      def={def}
      params={block.params}
      username={username}
      mode={mode}
      natural={natural}
      className={inline ? 'inline' : 'block'}
    />
  );
}

interface TextBodyProps {
  cell: Cell;
  block: TextBlock;
  editing: boolean;
  align?: Align;
  first?: boolean;
}

/**
 * The heading or paragraph itself. While editing, the browser owns its contents;
 * they are read back into runs when editing ends, so React never rewrites the text
 * under the caret.
 */
function TextBody({ cell, block, editing, align, first }: TextBodyProps) {
  const t = useT();
  const edit = useEditor((s) => s.edit);
  const stopEditing = useEditor((s) => s.stopEditing);
  const ref = useRef<HTMLElement>(null);
  const html = runsToHtml(block.runs);
  const Tag = block.kind;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!editing || !el) return;
    el.focus();
    placeCaret(el, takePendingCaret());
  }, [editing, block.kind]);

  function commit() {
    const el = ref.current;
    if (el) edit((doc) => setText(doc, cell.id, { runs: htmlToRuns(el) }));
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Headings are one line; Enter finishes them. Paragraphs take line breaks.
      if (block.kind === 'p' || e.shiftKey) document.execCommand('insertLineBreak');
      else e.currentTarget.blur();
    }
  }

  return (
    <Tag
      ref={ref as never}
      data-text-cell={cell.id}
      data-empty={!html && !editing}
      data-placeholder={t('typeHere')}
      contentEditable={editing}
      suppressContentEditableWarning
      spellCheck={editing}
      dangerouslySetInnerHTML={{ __html: html }}
      onKeyDown={editing ? onKeyDown : undefined}
      onPaste={(e) => {
        // Only plain text: pasted styles couldn't be exported anyway.
        e.preventDefault();
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
      }}
      onBlur={(e) => {
        // Moving focus into the toolbar (the link box) keeps editing going.
        if ((e.relatedTarget as HTMLElement | null)?.closest('[data-cell-toolbar]')) return;
        commit();
        stopEditing();
      }}
      className={cx(
        'data-[empty=true]:before:text-slate-400 data-[empty=true]:before:content-[attr(data-placeholder)]',
        editing && 'cursor-text outline-none select-text'
      )}
      style={{ textAlign: align, marginTop: first ? 0 : undefined }}
    />
  );
}

/** Puts the caret where the user clicked, or at the end. */
function placeCaret(el: HTMLElement, point: { x: number; y: number } | null) {
  const selection = window.getSelection();
  if (!selection) return;
  let range: Range | null = null;
  if (point) {
    const doc = document as Document & {
      caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
    };
    if (doc.caretPositionFromPoint) {
      const pos = doc.caretPositionFromPoint(point.x, point.y);
      if (pos && el.contains(pos.offsetNode)) {
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
      }
    } else if (document.caretRangeFromPoint) {
      const r = document.caretRangeFromPoint(point.x, point.y);
      if (r && el.contains(r.startContainer)) range = r;
    }
  }
  if (!range) {
    range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
  }
  selection.removeAllRanges();
  selection.addRange(range);
}
