import type { RefObject } from 'react';
import { useT } from '../i18n';
import { useEditor } from '../store/editor';
import { usePrefs } from '../store/prefs';
import { TemplateGallery } from '../templates/TemplateGallery';
import { cx } from '../ui/cx';
import { BookIcon } from '../ui/icons';
import { PREVIEW_USERNAME } from '../widgets/urls';
import type { Indicator } from './dropTarget';
import { BOX_WIDTH, PAGE_FONT_SIZE, PAGE_PADDING } from './page';
import { RowView } from './RowView';

interface Props {
  pageRef: RefObject<HTMLDivElement | null>;
  /** Scale that fits GitHub's fixed README width into the space available. */
  zoom: number;
  /** Insertion line, in the page's own (unzoomed) pixels. */
  indicator: Indicator | null;
  /** A drag is over the empty page. */
  emptyTargeted: boolean;
}

/**
 * The README as it will look on the profile: GitHub's box, width, font size and
 * markdown CSS, in the color mode being previewed.
 */
export function Canvas({ pageRef, zoom, indicator, emptyTargeted }: Props) {
  const rows = useEditor((s) => s.doc.rows);
  const username = useEditor((s) => s.doc.username) || PREVIEW_USERNAME;
  const select = useEditor((s) => s.select);
  const mode = usePrefs((s) => s.mode);
  const dark = mode === 'dark';

  return (
    <div className="flex min-h-full justify-center px-6 py-8" onClick={() => select(null)}>
      <div
        data-color-mode={mode}
        className={cx('h-fit rounded-md border shadow-sm', dark ? 'border-[#3d444d] bg-[#0d1117]' : 'border-[#d1d9e0] bg-white')}
        style={{ width: BOX_WIDTH, zoom }}
      >
        <div
          className={cx(
            'flex items-center gap-2 border-b px-4 py-2.5 font-sans text-sm',
            dark ? 'border-[#3d444d] text-[#9198a1]' : 'border-[#d1d9e0] text-[#59636e]'
          )}
        >
          <BookIcon />
          <span>
            <span className={cx('font-semibold', dark ? 'text-[#f0f6fc]' : 'text-[#1f2328]')}>{username}</span> / README.md
          </span>
        </div>
        <div
          ref={pageRef}
          className="markdown-body relative min-h-[540px]"
          style={{ padding: PAGE_PADDING, fontSize: PAGE_FONT_SIZE }}
        >
          {rows.length === 0 ? (
            <EmptyPage targeted={emptyTargeted} />
          ) : (
            rows.map((row, i) => <RowView key={row.id} row={row} first={i === 0} />)
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
      className="pointer-events-none absolute z-40 rounded-full bg-blue-500 shadow-[0_0_0_2px_white]"
      style={
        horizontal
          ? { left: indicator.x, top: indicator.y - 1.5, width: indicator.length, height: 3 }
          : { left: indicator.x - 1.5, top: indicator.y, width: 3, height: indicator.length }
      }
    />
  );
}

function EmptyPage({ targeted }: { targeted: boolean }) {
  const t = useT();
  return (
    <div
      className={cx(
        'flex flex-col items-center gap-5 rounded-xl border-2 border-dashed px-8 py-8 font-sans transition-colors',
        targeted ? 'border-blue-500 bg-blue-500/5' : 'border-slate-400/40'
      )}
    >
      <div className="text-center">
        <p className="!mb-1 text-lg font-semibold">{t('emptyTitle')}</p>
        <p className="!mb-0 text-sm opacity-70">{t('emptyBody')}</p>
      </div>
      <div className="w-full max-w-[700px]" onClick={(e) => e.stopPropagation()}>
        <TemplateGallery />
      </div>
    </div>
  );
}
