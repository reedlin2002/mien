// The document is a tree that can only express layouts GitHub is able to render:
// rows stack vertically, cells sit side by side inside a row, and a cell's only
// geometry is its width. There are no coordinates, so nothing can be placed where
// GitHub's HTML sanitizer would move it.

export const WIDTH_STEPS = [20, 25, 33, 50, 66, 75, 100] as const;
export type WidthStep = (typeof WIDTH_STEPS)[number];

// Five 20% cells fill a row; a sixth would force widths below the smallest step.
export const MAX_CELLS_PER_ROW = 5;

export type Align = 'left' | 'center' | 'right';
export type ColorMode = 'light' | 'dark';

export type ParamValue = string | number | boolean;

export interface WidgetBlock {
  type: 'widget';
  widgetId: string;
  params: Record<string, ParamValue>;
}

export type Block = WidgetBlock;

export interface Cell {
  id: string;
  width: WidthStep;
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
