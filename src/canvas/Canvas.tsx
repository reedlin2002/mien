import type { RefObject } from 'react';
import { useEditor } from '../store/editor';
import { cx } from '../ui/cx';
import { BookIcon } from '../ui/icons';
import { PREVIEW_USERNAME } from '../widgets/urls';
import { CellView } from './CellView';
import type { Indicator } from './dropTarget';

interface Props {
  pageRef: RefObject<HTMLDivElement | null>;
  indicator: Indicator | null;
  /** A drag is over the page and would land in its (empty) first row. */
  emptyTargeted: boolean;
}

/**
 * The page is styled with GitHub's own markdown CSS and laid out the way the
 * compiler's HTML lays out on GitHub: rows are blocks, cells are inline boxes whose
 * widths are percentages of the row. That is what keeps the canvas and the profile
 * looking the same.
 */
export function Canvas({ pageRef, indicator, emptyTargeted }: Props) {
  const rows = useEditor((s) => s.doc.rows);
  const username = useEditor((s) => s.doc.username) || PREVIEW_USERNAME;
  const select = useEditor((s) => s.select);

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 py-8" onClick={() => select(null)}>
      <div className="rounded-md border border-[#d1d9e0] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#d1d9e0] px-4 py-2.5 text-sm text-[#59636e]">
          <BookIcon />
          <span>
            <span className="font-semibold text-[#1f2328]">{username}</span> / README.md
          </span>
        </div>
        <div ref={pageRef} className="markdown-body relative min-h-[480px] p-6">
          {rows.length === 0 ? (
            <EmptyPage targeted={emptyTargeted} />
          ) : (
            rows.map((row) => (
              <div key={row.id} data-row-id={row.id} className="mb-4" style={{ textAlign: row.align }}>
                {row.cells.map((cell) => (
                  <CellView key={cell.id} cell={cell} row={row} />
                ))}
              </div>
            ))
          )}
          {indicator && <InsertionLine indicator={indicator} />}
        </div>
      </div>
    </div>
  );
}

function InsertionLine({ indicator }: { indicator: Indicator }) {
  const horizontal = indicator.orientation === 'horizontal';
  return (
    <div
      className="pointer-events-none absolute z-30 rounded-full bg-blue-500 shadow-[0_0_0_2px_white]"
      style={
        horizontal
          ? { left: indicator.x, top: indicator.y - 1.5, width: indicator.length, height: 3 }
          : { left: indicator.x - 1.5, top: indicator.y, width: 3, height: indicator.length }
      }
    />
  );
}

function EmptyPage({ targeted }: { targeted: boolean }) {
  return (
    <div
      className={cx(
        'flex h-[420px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center transition-colors',
        targeted ? 'border-blue-500 bg-blue-50/60 text-blue-700' : 'border-slate-300 text-slate-500'
      )}
    >
      <p className="!m-0 text-base font-semibold">Drag a widget here</p>
      <p className="!m-0 text-sm">Pick one from the left. You can move and resize it afterwards.</p>
    </div>
  );
}
