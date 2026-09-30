import { useState } from 'react';
import type { ParamValue } from '../model/types';
import { cx } from '../ui/cx';
import type { WidgetDef } from '../widgets/types';
import { widgetSrc } from '../widgets/urls';

interface Props {
  def: WidgetDef;
  params: Record<string, ParamValue>;
  username: string;
  className?: string;
}

/** The widget's real image, with its space reserved and a shimmer until it arrives. */
export function WidgetImage({ def, params, username, className }: Props) {
  const src = widgetSrc(def, params, username);
  const [loaded, setLoaded] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  if (failed === src) {
    return (
      <span
        className={cx('flex w-full items-center justify-center rounded bg-slate-100 text-xs text-slate-500', className)}
        style={{ aspectRatio: def.aspectRatio }}
      >
        {def.name} didn’t load
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={def.name}
      draggable={false}
      onLoad={() => setLoaded(src)}
      onError={() => setFailed(src)}
      className={cx('block w-full', loaded !== src && 'animate-pulse rounded bg-slate-100', className)}
      style={{ aspectRatio: `auto ${def.aspectRatio}` }}
    />
  );
}
