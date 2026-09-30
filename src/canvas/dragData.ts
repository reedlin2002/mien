/** What travels with a drag: a new palette item, a cell on the page, or a whole row. */
export type DragData =
  | { source: 'palette'; itemId: string }
  | { source: 'cell'; cellId: string }
  | { source: 'row'; rowId: string };
