import { safeHref } from '../model/text';
import type { ColorMode, ParamValue } from '../model/types';
import type { ParamDef, WidgetDef } from './types';

/** Shown on the canvas until the user types their own username. */
export const PREVIEW_USERNAME = 'octocat';

/** Theme value meaning "follow the viewer's light or dark mode". */
export const AUTO = 'auto';

export function paramValue(p: ParamDef, params: Record<string, ParamValue>): ParamValue {
  return params[p.key] ?? p.default ?? '';
}

/**
 * Resolves every param to the string that goes into the URL. Username params always
 * take the document's username, and text params may mention `{username}` too, so a
 * banner can default to the user's name.
 */
export function resolveParams(
  def: WidgetDef,
  params: Record<string, ParamValue>,
  username: string,
  mode: ColorMode = 'light'
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const p of def.params) {
    if (p.type === 'username') {
      values[p.key] = username;
      continue;
    }
    let value = String(paramValue(p, params));
    if (p.type === 'text' || p.type === 'list') value = value.replaceAll('{username}', username);
    if (p.type === 'url') value = safeHref(value) ?? '';
    if (p.type === 'color') value = value.replace(/^#/, '');
    if (p.type === 'enum') Object.assign(values, p.options?.find((o) => o.value === value)?.set);
    values[p.key] = value;
  }
  if (def.theme) {
    const chosen = values[def.theme.param];
    if (!chosen || chosen === AUTO) values[def.theme.param] = def.theme[mode];
  }
  return values;
}

/**
 * Replaces `{key}` placeholders with URL-encoded values; keys in `raw` go in as they
 * are (whole URLs). Unknown placeholders are left alone.
 */
export function fillTemplate(template: string, values: Record<string, string>, raw: ReadonlySet<string> = new Set()): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (!(key in values)) return match;
    return raw.has(key) ? values[key] : encodeURIComponent(values[key]);
  });
}

function rawKeys(def: WidgetDef): Set<string> {
  return new Set(def.params.filter((p) => p.type === 'url').map((p) => p.key));
}

/** Required params the user hasn't filled in yet; such widgets are not exported. */
export function missingParams(def: WidgetDef, params: Record<string, ParamValue>): ParamDef[] {
  return def.params.filter((p) => p.required && String(paramValue(p, params)).trim() === '');
}

export function widgetSrc(
  def: WidgetDef,
  params: Record<string, ParamValue>,
  username: string,
  mode: ColorMode = 'light'
): string {
  return fillTemplate(def.urlTemplate, resolveParams(def, params, username, mode), rawKeys(def));
}

export function widgetHref(def: WidgetDef, params: Record<string, ParamValue>, username: string): string | undefined {
  if (!def.linkTemplate) return undefined;
  const href = fillTemplate(def.linkTemplate, resolveParams(def, params, username), rawKeys(def));
  return safeHref(href);
}
