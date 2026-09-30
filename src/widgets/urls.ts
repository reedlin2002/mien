import type { ColorMode, ParamValue } from '../model/types';
import type { WidgetDef } from './types';

/** Shown on the canvas until the user types their own username. */
export const PREVIEW_USERNAME = 'octocat';

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
    const raw = params[p.key] ?? p.default ?? '';
    values[p.key] = p.type === 'text' ? String(raw).replaceAll('{username}', username) : String(raw);
  }
  if (def.theme) values[def.theme.param] = def.theme[mode];
  return values;
}

/** Replaces `{key}` placeholders with URL-encoded values. Unknown placeholders are left as they are. */
export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? encodeURIComponent(values[key]) : match
  );
}

export function widgetSrc(
  def: WidgetDef,
  params: Record<string, ParamValue>,
  username: string,
  mode: ColorMode = 'light'
): string {
  return fillTemplate(def.urlTemplate, resolveParams(def, params, username, mode));
}

export function widgetHref(def: WidgetDef, params: Record<string, ParamValue>, username: string): string | undefined {
  return def.linkTemplate ? fillTemplate(def.linkTemplate, resolveParams(def, params, username)) : undefined;
}
