import { useMemo } from 'react';
import { compile } from '../compile/compile';
import type { ColorMode, Doc } from '../model/types';
import { PAGE_FONT_SIZE, PAGE_PADDING, PAGE_WIDTH } from './page';

/**
 * A read-only rendering of exactly what GitHub receives: the compiled README,
 * styled by GitHub's CSS and scaled down to `width` pixels.
 */
export function DocPreview({ doc, mode, width }: { doc: Doc; mode: ColorMode; width: number }) {
  const html = useMemo(() => compile(doc, undefined, { mode }), [doc, mode]);
  const full = PAGE_WIDTH + PAGE_PADDING * 2;
  return (
    <div data-color-mode={mode} className="pointer-events-none overflow-hidden" style={{ width }}>
      <div
        className="markdown-body"
        style={{ width: full, padding: PAGE_PADDING, fontSize: PAGE_FONT_SIZE, zoom: width / full }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
