import type { WidgetDef } from './types';

const modules = import.meta.glob<WidgetDef>('../../registry/widgets/*.json', { eager: true, import: 'default' });

export const WIDGETS: readonly WidgetDef[] = Object.values(modules).sort((a, b) => a.name.localeCompare(b.name));

const byId = new Map(WIDGETS.map((w) => [w.id, w]));

export function getWidget(id: string): WidgetDef | undefined {
  return byId.get(id);
}
