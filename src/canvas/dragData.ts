/** What travels with a drag: a new widget from the palette, or a cell already on the page. */
export type DragData = { source: 'palette'; widgetId: string } | { source: 'cell'; cellId: string };
