/** What travels with a drag: a new item from the palette, or a cell already on the page. */
export type DragData = { source: 'palette'; itemId: string } | { source: 'cell'; cellId: string };
