// Turns the document tree into README source that survives GitHub's HTML sanitizer.
// Only attributes GitHub keeps are emitted: align, width, href, src, alt, and
// <picture>/<source media> for light and dark variants. Anything the canvas can
// show must be expressible here, which is why the model has no free positioning.

import { MARKER } from '../config';
import type { Cell, Doc, Row, WidgetBlock } from '../model/types';
import { getWidget } from '../widgets/registry';
import type { WidgetDef } from '../widgets/types';
import { widgetHref, widgetSrc } from '../widgets/urls';

export type WidgetLookup = (id: string) => WidgetDef | undefined;

export function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function compileWidget(cell: Cell, block: WidgetBlock, def: WidgetDef, username: string): string {
  const light = widgetSrc(def, block.params, username, 'light');
  const img = `<img src="${escapeAttr(light)}" alt="${escapeAttr(def.name)}" width="${cell.width}%">`;

  let body = img;
  if (def.theme) {
    const dark = widgetSrc(def, block.params, username, 'dark');
    body = `<picture><source media="(prefers-color-scheme: dark)" srcset="${escapeAttr(dark)}">${img}</picture>`;
  }

  const href = widgetHref(def, block.params, username);
  return href ? `<a href="${escapeAttr(href)}">${body}</a>` : body;
}

function compileRow(row: Row, username: string, lookup: WidgetLookup): string | null {
  const items: string[] = [];
  for (const cell of row.cells) {
    const def = lookup(cell.block.widgetId);
    if (def) items.push(compileWidget(cell, cell.block, def, username));
  }
  if (items.length === 0) return null;
  // Cells are joined without whitespace: a space between inline images takes a few
  // pixels, so two 50% images would no longer fit on one line.
  return `<p align="${row.align}">${items.join('')}</p>`;
}

export function compile(doc: Doc, lookup: WidgetLookup = getWidget): string {
  const blocks: string[] = [];
  if (doc.marker) blocks.push(MARKER);
  for (const row of doc.rows) {
    const html = compileRow(row, doc.username, lookup);
    if (html) blocks.push(html);
  }
  // A blank line ends each HTML block, so GitHub treats every row on its own.
  return blocks.join('\n\n') + '\n';
}
