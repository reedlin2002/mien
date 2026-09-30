import { translate } from '../i18n';
import { textCell, widgetCell } from '../model/doc';
import type { Cell, CellWidth, TextKind } from '../model/types';
import type { Lang } from '../store/prefs';
import { getWidget, WIDGETS } from '../widgets/registry';
import { CATEGORIES, type Category } from '../widgets/types';

// Everything the palette offers: a few text blocks, then every registry widget.
// Items are addressed by id ("text:h1", "widget:github-stats") so a drag only has to
// carry a string.

export type Section = 'text' | Category;
export const SECTIONS: readonly Section[] = ['text', ...CATEGORIES];

export interface PaletteItem {
  id: string;
  section: Section;
  width: CellWidth;
}

const TEXT_KINDS: TextKind[] = ['h1', 'h2', 'p'];

export const PALETTE: readonly PaletteItem[] = [
  ...TEXT_KINDS.map((kind) => ({ id: `text:${kind}`, section: 'text' as const, width: 100 as const })),
  ...WIDGETS.map((def) => ({ id: `widget:${def.id}`, section: def.category, width: def.defaultWidth }))
];

const SAMPLE = { h1: 'sampleH1', h2: 'sampleH2', h3: 'sampleH3', p: 'sampleP' } as const;

export function paletteItem(id: string): PaletteItem | undefined {
  return PALETTE.find((item) => item.id === id);
}

/** A fresh cell for a palette item, with sample text in the user's language. */
export function createFromPalette(id: string, lang: Lang): Cell | null {
  const [kind, rest] = id.split(':');
  if (kind === 'text') {
    const textKind = rest as TextKind;
    return textCell(textKind, [{ text: translate(lang, SAMPLE[textKind]) }]);
  }
  const def = getWidget(rest);
  return def ? widgetCell(def.id, def.defaultWidth) : null;
}
