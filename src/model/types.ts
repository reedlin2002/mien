// The document is a tree that can only express layouts GitHub is able to render:
// rows stack vertically, cells sit side by side inside a row, and a cell's only
// geometry is its width. There are no coordinates, so nothing can be placed where
// GitHub's HTML sanitizer would move it.

export const WIDTH_STEPS = [20, 25, 33, 50, 66, 75, 100] as const;
export type WidthStep = (typeof WIDTH_STEPS)[number];
/** 'auto' keeps the image at its natural size, which is how badges are meant to look. */
export type CellWidth = WidthStep | 'auto';

// Five 20% cells fill a row; a sixth would force widths below the smallest step.
export const MAX_PERCENT_CELLS = 5;
// Natural-size cells (badges) take little room, so a row may hold more of them.
export const MAX_CELLS_PER_ROW = 10;

export type Align = 'left' | 'center' | 'right';
export type ColorMode = 'light' | 'dark';

export type ParamValue = string | number | boolean;

export interface WidgetBlock {
  type: 'widget';
  widgetId: string;
  params: Record<string, ParamValue>;
}

/** Only formatting GitHub keeps inside HTML: bold and links. `\n` is a line break. */
export interface TextRun {
  text: string;
  bold?: boolean;
  href?: string;
}

export const TEXT_KINDS = ['h1', 'h2', 'h3', 'p'] as const;
export type TextKind = (typeof TEXT_KINDS)[number];

export interface TextBlock {
  type: 'text';
  kind: TextKind;
  runs: TextRun[];
}

export type Block = WidgetBlock | TextBlock;

export interface Cell {
  id: string;
  width: CellWidth;
  block: Block;
}

export interface Row {
  id: string;
  align: Align;
  cells: Cell[];
}

export interface Doc {
  version: 1;
  username: string;
  // Adds an invisible <!-- made with … --> comment so real READMEs can be counted
  // with GitHub code search. The user can switch it off.
  marker: boolean;
  rows: Row[];
}

export type DropTarget =
  | { kind: 'into-row'; rowId: string; index: number }
  | { kind: 'new-row'; index: number };
