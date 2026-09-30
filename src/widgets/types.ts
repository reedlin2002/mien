import type { CellWidth, ParamValue } from '../model/types';

// Shape of a registry/widgets/*.json file (validated against registry/widget.schema.json).
// Widget authors add their widget by sending a PR with one of these; the editor
// builds the settings panel from `params`, so no code is needed.

export type ParamType = 'username' | 'enum' | 'multi' | 'list' | 'boolean' | 'color' | 'number' | 'text' | 'url';

export const CATEGORIES = ['header', 'stats', 'skills', 'badges', 'media'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface ParamOption {
  value: string;
  label?: string;
  /** Image shown on the option's button (e.g. a single skill icon). */
  thumbnail?: string;
  /** Other template values this option supplies, e.g. a platform's logo and brand color. */
  set?: Record<string, string>;
}

export interface ParamDef {
  key: string;
  type: ParamType;
  label?: string;
  default?: ParamValue;
  /** The widget isn't exported until this has a value (e.g. an image URL). */
  required?: boolean;
  placeholder?: string;
  /** enum and multi: the choices. */
  options?: ParamOption[];
  /** enum: show every option as a live preview of the widget itself. */
  preview?: boolean;
  /** Image for each option, with `{value}` replaced by the option's value (e.g. one skill icon). */
  thumbnailTemplate?: string;
  /** list and multi: how values are joined in the URL. */
  separator?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface WidgetDef {
  id: string;
  name: string;
  description?: string;
  category: Category;
  author: string;
  homepage: string;
  /** Image URL with `{key}` placeholders filled from params. */
  urlTemplate: string;
  /** Where clicking the widget on GitHub goes. Without it GitHub links the image to itself. */
  linkTemplate?: string;
  defaultWidth: CellWidth;
  /** width / height of the image, used to reserve space before it loads. */
  aspectRatio: number;
  params: ParamDef[];
  /**
   * Light and dark values for one template key. When the user leaves that param on
   * "auto" (or the widget has no such param), exports switch with the viewer's color mode.
   */
  theme?: { param: string; light: string; dark: string };
}
