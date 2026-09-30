import type { ParamValue, WidthStep } from '../model/types';

// Shape of a registry/widgets/*.json file. Widget authors add their widget by
// sending a PR with one of these; the editor builds its settings UI from `params`.

export type ParamType = 'username' | 'enum' | 'boolean' | 'color' | 'number' | 'text';

export interface ParamOption {
  value: string;
  label?: string;
  thumbnail?: string;
}

export interface ParamDef {
  key: string;
  type: ParamType;
  label?: string;
  default?: ParamValue;
  options?: ParamOption[];
}

export interface WidgetDef {
  id: string;
  name: string;
  author: string;
  homepage: string;
  /** Image URL with `{key}` placeholders filled from params. */
  urlTemplate: string;
  /** Where clicking the widget on GitHub goes. Without it GitHub links the image to itself. */
  linkTemplate?: string;
  defaultWidth: WidthStep;
  /** width / height of the image, used to reserve space before it loads. */
  aspectRatio: number;
  params: ParamDef[];
  /** When present, exports switch between these values of `param` with the viewer's color mode. */
  theme?: { param: string; light: string; dark: string };
}
