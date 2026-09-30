// Checks every widget in registry/widgets. Contributors adding a widget get their
// mistakes reported here (and in CI) instead of as a broken image on someone's profile.

import Ajv from 'ajv';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import schema from '../../registry/widget.schema.json';
import type { WidgetDef } from './types';
import { resolveParams, widgetSrc } from './urls';

const dir = new URL('../../registry/widgets/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
const validate = new Ajv({ allErrors: true }).compile(schema);

const placeholders = (template: string) => [...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);

describe.each(files)('%s', (file) => {
  const def = JSON.parse(readFileSync(new URL(file, dir), 'utf8')) as WidgetDef;

  it('matches the schema', () => {
    validate(def);
    expect(validate.errors ?? []).toEqual([]);
  });

  it('is named after its id', () => {
    expect(file).toBe(`${def.id}.json`);
  });

  it('fills every placeholder in its templates', () => {
    const values = resolveParams(def, {}, 'octocat');
    for (const p of def.params) {
      for (const option of p.options ?? []) Object.assign(values, option.set);
    }
    const templates = [def.urlTemplate, def.linkTemplate ?? ''];
    for (const key of templates.flatMap(placeholders)) expect(values, `{${key}} has no param`).toHaveProperty(key);
  });

  it('has unique param keys and defaults that are valid choices', () => {
    const keys = def.params.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const p of def.params) {
      if (p.type === 'enum' && p.default !== undefined) {
        expect(p.options?.map((o) => o.value), `${p.key} default`).toContain(p.default);
      }
      if (p.type === 'multi' && typeof p.default === 'string') {
        const allowed = p.options?.map((o) => o.value) ?? [];
        for (const v of p.default.split(p.separator ?? ',')) expect(allowed, `${p.key} default`).toContain(v);
      }
    }
  });

  it('declares its theme param when it offers one', () => {
    if (!def.theme) return;
    const declared = def.params.find((p) => p.key === def.theme!.param);
    if (declared) expect(declared.options?.map((o) => o.value)).toContain('auto');
    expect(widgetSrc(def, {}, 'octocat', 'light')).not.toBe(widgetSrc(def, {}, 'octocat', 'dark'));
  });
});
