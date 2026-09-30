import { useState } from 'react';
import { useT } from '../i18n';
import type { ColorMode, ParamValue } from '../model/types';
import { cx } from '../ui/cx';
import type { WidgetDef } from '../widgets/types';
import { widgetSrc } from '../widgets/urls';

interface Props {
  def: WidgetDef;
  params: Record<string, ParamValue>;
  username: string;
  mode?: ColorMode;
  /** Keep the image at its own size (badges) instead of filling the cell. */
  natural?: boolean;
  className?: string;
}

/** The widget's real image, with its space reserved and a shimmer until it arrives. */
export function WidgetImage({ def, params, username, mode = 'light', natural, className }: Props) {
  const t = useT();
  const src = widgetSrc(def, params, username, mode);
  const [loaded, setLoaded] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  if (failed === src) {
    return (
      <span
        className={cx(
          'flex items-center justify-center rounded bg-slate-500/10 px-2 text-xs text-slate-500',
          natural ? 'h-6' : 'w-full',
          className
        )}
        style={natural ? undefined : { aspectRatio: def.aspectRatio }}
      >
        {t('didntLoad', { name: t.registry(def.name) })}
      </span>
    );
  }

  const loading = loaded !== src;
  return (
    <img
      src={src}
      alt={def.name}
      draggable={false}
      onLoad={() => setLoaded(src)}
      onError={() => setFailed(src)}
      className={cx(
        natural ? 'max-w-full' : 'w-full',
        loading && 'animate-pulse rounded bg-slate-500/15',
        loading && natural && 'min-h-5 min-w-20',
        className
      )}
      style={natural ? undefined : { aspectRatio: `auto ${def.aspectRatio}` }}
    />
  );
}
