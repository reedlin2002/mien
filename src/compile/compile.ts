// Turns the document tree into README source that survives GitHub's HTML sanitizer.
// Only markup GitHub keeps is emitted: align, width, href, src, alt, <b>, <br>,
// headings, tables, and <picture>/<source media> for light and dark variants.
// Anything the canvas can show must be expressible here, which is why the model has
// no free positioning.

import { MARKER } from '../config';
import { rowKind, spaceAfter } from '../model/layout';
import { runsToHtml } from '../model/text';
import type { Cell, CellWidth, ColorMode, Doc, Row, TextBlock, WidgetBlock } from '../model/types';
import { getWidget } from '../widgets/registry';
import type { WidgetDef } from '../widgets/types';
import { missingParams, widgetHref, widgetSrc } from '../widgets/urls';

export type WidgetLookup = (id: string) => WidgetDef | undefined;

export function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface Context {
  username: string;
  lookup: WidgetLookup;
  /** Previews pin one color mode instead of following the viewer's. */
  mode?: ColorMode;
}

/** A widget as linked, theme-switching image markup, or null if it can't be exported yet. */
function compileWidget(block: WidgetBlock, width: CellWidth, ctx: Context): string | null {
  const def = ctx.lookup(block.widgetId);
  if (!def || missingParams(def, block.params).length > 0) return null;

  const light = widgetSrc(def, block.params, ctx.username, ctx.mode ?? 'light');
  const dark = widgetSrc(def, block.params, ctx.username, ctx.mode ?? 'dark');
  const size = width === 'auto' ? '' : ` width="${width}%"`;
  const img = `<img src="${escapeAttr(light)}" alt="${escapeAttr(def.name)}"${size}>`;
  // Only widgets left on "auto" differ between modes; the rest need no <picture>.
  const body =
    dark === light ? img : `<picture><source media="(prefers-color-scheme: dark)" srcset="${escapeAttr(dark)}">${img}</picture>`;

  const href = widgetHref(def, block.params, ctx.username);
  return href ? `<a href="${escapeAttr(href)}">${body}</a>` : body;
}

function compileText(block: TextBlock, align?: string): string | null {
  const html = runsToHtml(block.runs);
  if (!html.trim()) return null;
  const attr = align ? ` align="${align}"` : '';
  return `<${block.kind}${attr}>${html}</${block.kind}>`;
}

/** Inside a table cell the image fills the cell, unless it keeps its natural size. */
function compileTableCell(cell: Cell, ctx: Context): string | null {
  if (cell.block.type === 'text') return compileText(cell.block);
  return compileWidget(cell.block, cell.width === 'auto' ? 'auto' : 100, ctx);
}

function compileRow(row: Row, ctx: Context): string | null {
  switch (rowKind(row)) {
    case 'inline': {
      let html = '';
      row.cells.forEach((c, i) => {
        const item = c.block.type === 'widget' ? compileWidget(c.block, c.width, ctx) : null;
        if (item === null) return;
        html += item + (spaceAfter(row, i) ? ' ' : '');
      });
      html = html.trimEnd();
      return html ? `<p align="${row.align}">${html}</p>` : null;
    }
    case 'text': {
      const block = row.cells[0].block as TextBlock;
      return compileText(block, row.align);
    }
    case 'table': {
      const tds = row.cells
        .map((c) => {
          const inner = compileTableCell(c, ctx);
          const width = c.width === 'auto' ? '' : ` width="${c.width}%"`;
          return inner === null ? null : `<td${width} align="${row.align}">${inner}</td>`;
        })
        .filter((td): td is string => td !== null);
      if (tds.length === 0) return null;
      return `<table align="${row.align}"><tr>${tds.join('')}</tr></table>`;
    }
  }
}

export function compile(doc: Doc, lookup: WidgetLookup = getWidget, options: { mode?: ColorMode } = {}): string {
  const ctx: Context = { username: doc.username, lookup, mode: options.mode };
  const blocks: string[] = [];
  if (doc.marker) blocks.push(MARKER);
  for (const row of doc.rows) {
    const html = compileRow(row, ctx);
    if (html) blocks.push(html);
  }
  // A blank line ends each HTML block, so GitHub treats every row on its own.
  return blocks.join('\n\n') + '\n';
}
