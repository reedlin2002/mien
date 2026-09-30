import type { RowSpec } from '../model/doc';

export interface Template {
  id: string;
  name: string;
  name_zh: string;
  description: string;
  description_zh: string;
  rows: RowSpec[];
}

const modules = import.meta.glob<Template>('../../registry/templates/*.json', { eager: true, import: 'default' });

export const TEMPLATES: readonly Template[] = Object.entries(modules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, t]) => t);
