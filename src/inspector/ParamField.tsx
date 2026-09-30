import { useState, type ReactNode } from 'react';
import { WidgetImage } from '../canvas/WidgetImage';
import { useT } from '../i18n';
import { setParam } from '../model/ops';
import type { ParamValue, WidgetBlock } from '../model/types';
import { useEditor } from '../store/editor';
import { usePrefs } from '../store/prefs';
import { cx } from '../ui/cx';
import { CloseIcon, PlusIcon, SearchIcon } from '../ui/icons';
import type { ParamDef, WidgetDef } from '../widgets/types';
import { paramValue, PREVIEW_USERNAME } from '../widgets/urls';
import { useDraft } from './useDraft';

interface Props {
  def: WidgetDef;
  param: ParamDef;
  block: WidgetBlock;
  cellId: string;
}

/** One setting, with the control its registry type calls for. */
export function ParamField({ def, param, block, cellId }: Props) {
  const t = useT();
  const edit = useEditor((s) => s.edit);
  const value = paramValue(param, block.params);
  const set = (next: ParamValue) => edit((doc) => setParam(doc, cellId, param.key, next));
  const label = t.registry(param.label ?? param.key);

  switch (param.type) {
    case 'username':
      return null;
    case 'boolean':
      return (
        <label className="flex cursor-pointer items-center justify-between gap-3 py-1 text-sm text-ink">
          {label}
          <Switch checked={value === true || value === 'true'} onChange={set} />
        </label>
      );
    case 'enum':
      return (
        <Field label={label}>
          {param.preview ? (
            <PreviewChoices def={def} param={param} block={block} value={String(value)} onPick={set} />
          ) : (
            <Chips options={param.options ?? []} value={String(value)} onPick={set} />
          )}
        </Field>
      );
    case 'multi':
      return (
        <Field label={label}>
          <MultiPicker param={param} value={String(value)} onChange={set} />
        </Field>
      );
    case 'list':
      return (
        <Field label={label}>
          <ListEditor separator={param.separator ?? ';'} value={String(value)} onChange={set} />
        </Field>
      );
    case 'color':
      return (
        <Field label={label}>
          <ColorInput value={String(value)} onChange={set} />
        </Field>
      );
    case 'number':
      return (
        <Field label={label}>
          <NumberInput param={param} value={Number(value)} onChange={set} />
        </Field>
      );
    case 'text':
    case 'url':
      return (
        <Field label={label}>
          <TextInput value={String(value)} placeholder={param.placeholder} onChange={set} />
        </Field>
      );
  }
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cx('relative h-5 w-9 shrink-0 rounded-full transition', checked ? 'bg-ink' : 'bg-line')}
    >
      <span className={cx('absolute top-0.5 size-4 rounded-full bg-white shadow transition-all', checked ? 'left-4.5' : 'left-0.5')} />
    </button>
  );
}

function Chips({ options, value, onPick }: { options: NonNullable<ParamDef['options']>; value: string; onPick: (v: string) => void }) {
  const t = useT();
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onPick(o.value)}
          className={cx(
            'rounded-md border px-2 py-1 text-xs',
            o.value === value ? 'border-brand bg-brand-tint text-brand-text' : 'border-line text-muted hover:border-faint'
          )}
        >
          {t.registry(o.label ?? o.value)}
        </button>
      ))}
    </div>
  );
}

/** Each option drawn as the widget itself would look with it, so choosing is seeing. */
function PreviewChoices({ def, param, block, value, onPick }: Omit<Props, 'cellId'> & { value: string; onPick: (v: string) => void }) {
  const t = useT();
  const username = useEditor((s) => s.doc.username) || PREVIEW_USERNAME;
  const mode = usePrefs((s) => s.mode);
  const natural = def.defaultWidth === 'auto';
  return (
    <div className={cx('grid gap-1.5', natural ? 'grid-cols-2' : 'grid-cols-2')}>
      {(param.options ?? []).map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onPick(o.value)}
          className={cx(
            'flex flex-col items-center gap-1 rounded-lg border p-1 text-[11px] transition',
            o.value === value ? 'border-brand bg-brand-tint text-brand-text ring-1 ring-brand' : 'border-line text-muted hover:border-faint'
          )}
        >
          <span
            className={cx(
              'flex h-14 w-full items-center justify-center overflow-hidden rounded',
              mode === 'dark' ? 'bg-[#0d1117]' : 'bg-paper'
            )}
          >
            <WidgetImage
              def={def}
              params={{ ...block.params, [param.key]: o.value }}
              username={username}
              mode={mode}
              natural={natural}
              className="max-h-full object-contain"
            />
          </span>
          <span className="truncate">{t.registry(o.label ?? o.value)}</span>
        </button>
      ))}
    </div>
  );
}

function MultiPicker({ param, value, onChange }: { param: ParamDef; value: string; onChange: (v: string) => void }) {
  const t = useT();
  const [query, setQuery] = useState('');
  const separator = param.separator ?? ',';
  const chosen = value ? value.split(separator).filter(Boolean) : [];
  const thumb = (v: string) => param.thumbnailTemplate?.replace('{value}', encodeURIComponent(v));
  const toggle = (v: string) =>
    onChange((chosen.includes(v) ? chosen.filter((c) => c !== v) : [...chosen, v]).join(separator));
  const options = (param.options ?? []).filter((o) => o.value.includes(query.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-9 flex-wrap gap-1 rounded-md bg-paper p-1.5">
        {chosen.map((v) => (
          <button key={v} type="button" title={v} onClick={() => toggle(v)} className="group relative">
            {thumb(v) ? <img src={thumb(v)} alt={v} className="size-7" /> : <span className="text-xs">{v}</span>}
            <span className="absolute -top-1 -right-1 hidden size-3.5 items-center justify-center rounded-full bg-ink text-white group-hover:flex">
              <CloseIcon width={9} height={9} />
            </span>
          </button>
        ))}
      </div>
      <span className="text-[11px] text-muted">{t('selected', { n: chosen.length })}</span>
      <label className="flex items-center gap-2 rounded-md border border-line px-2 py-1 text-faint focus-within:border-brand">
        <SearchIcon width={14} height={14} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchIcons')}
          className="w-full bg-transparent text-xs text-ink outline-none"
        />
      </label>
      <div className="grid max-h-56 grid-cols-7 gap-1 overflow-y-auto">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            title={o.label ?? o.value}
            onClick={() => toggle(o.value)}
            className={cx(
              'rounded-md p-0.5 transition',
              chosen.includes(o.value) ? 'bg-brand-tint ring-2 ring-brand' : 'opacity-70 hover:bg-ground hover:opacity-100'
            )}
          >
            {thumb(o.value) ? <img src={thumb(o.value)} alt={o.value} loading="lazy" className="size-full" /> : o.value}
          </button>
        ))}
      </div>
    </div>
  );
}

function ListEditor({ separator, value, onChange }: { separator: string; value: string; onChange: (v: string) => void }) {
  const t = useT();
  // The draft stays a string: a fresh array each render would never settle.
  const [text, setText, flush] = useDraft(value, onChange);
  const draft = text.split(separator);
  const change = (lines: string[]) => setText(lines.join(separator));
  const update = (i: number, line: string) => change(draft.map((l, j) => (j === i ? line.replaceAll(separator, '') : l)));
  return (
    <div className="flex flex-col gap-1">
      {draft.map((line, i) => (
        <div key={i} className="flex items-center gap-1">
          <input
            value={line}
            onChange={(e) => update(i, e.target.value)}
            onBlur={flush}
            className="w-full rounded-md border border-line px-2 py-1 text-sm text-ink outline-none focus:border-brand"
          />
          <button
            type="button"
            aria-label="Remove"
            disabled={draft.length <= 1}
            onClick={() => change(draft.filter((_, j) => j !== i))}
            className="rounded p-1 text-faint hover:bg-ground hover:text-ink disabled:opacity-30"
          >
            <CloseIcon />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => change([...draft, ''])}
        className="flex items-center gap-1 self-start rounded px-1 py-0.5 text-xs text-brand-text hover:bg-brand-tint"
      >
        <PlusIcon width={12} height={12} /> {t('addLine')}
      </button>
    </div>
  );
}

const SWATCHES = ['ffffff', '000000', '36BCF7', '40c463', '2f81f7', 'a371f7', 'ff7b72', 'f78166', 'ffa657', 'e3b341'];

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [draft, change, flush] = useDraft(value.replace(/^#/, ''), onChange, 250);
  const hex = /^[0-9a-f]{6}$/i.test(draft) ? `#${draft}` : '#000000';
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => change(e.target.value.slice(1))}
          onBlur={flush}
          className="h-8 w-10 cursor-pointer rounded border border-line bg-white p-0.5"
        />
        <span className="flex items-center rounded-md border border-line px-2 py-1 text-sm focus-within:border-brand">
          <span className="text-faint">#</span>
          <input
            value={draft}
            onChange={(e) => change(e.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6))}
            onBlur={flush}
            className="w-16 bg-transparent font-mono text-ink outline-none"
          />
        </span>
      </div>
      <div className="flex gap-1">
        {SWATCHES.map((s) => (
          <button
            key={s}
            type="button"
            aria-label={`#${s}`}
            onClick={() => onChange(s)}
            className={cx('size-5 rounded-full border border-line', draft.toLowerCase() === s.toLowerCase() && 'ring-2 ring-brand ring-offset-1')}
            style={{ background: `#${s}` }}
          />
        ))}
      </div>
    </div>
  );
}

function NumberInput({ param, value, onChange }: { param: ParamDef; value: number; onChange: (v: number) => void }) {
  const [draft, change, flush] = useDraft(value, onChange, 300);
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={param.min ?? 0}
        max={param.max ?? 100}
        step={param.step ?? 1}
        value={draft}
        onChange={(e) => change(Number(e.target.value))}
        onPointerUp={flush}
        className="flex-1 accent-brand"
      />
      <span className="w-12 text-right font-mono text-xs text-muted">{draft}</span>
    </div>
  );
}

function TextInput({ value, placeholder, onChange }: { value: string; placeholder?: string; onChange: (v: string) => void }) {
  const [draft, change, flush] = useDraft(value, onChange);
  return (
    <input
      value={draft}
      placeholder={placeholder}
      onChange={(e) => change(e.target.value)}
      onBlur={flush}
      onKeyDown={(e) => e.key === 'Enter' && flush()}
      className="w-full rounded-md border border-line px-2 py-1.5 text-sm text-ink outline-none focus:border-brand"
    />
  );
}
