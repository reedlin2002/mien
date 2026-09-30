import { useMemo } from 'react';
import { cx } from '../ui/cx';
import { DocPreview } from '../canvas/DocPreview';
import { useT } from '../i18n';
import { emptyDoc, instantiate } from '../model/doc';
import { replaceRows } from '../model/ops';
import type { Doc } from '../model/types';
import { useEditor } from '../store/editor';
import { usePrefs } from '../store/prefs';
import { PREVIEW_USERNAME } from '../widgets/urls';
import { TEMPLATES, type Template } from './templates';

/** Template cards with a live, scaled-down preview of each. */
export function TemplateGallery({ onPick, columns = 2 }: { onPick?: () => void; columns?: number }) {
  const edit = useEditor((s) => s.edit);
  const select = useEditor((s) => s.select);

  function apply(template: Template) {
    edit((doc) => replaceRows(doc, instantiate(template.rows)));
    select(null);
    onPick?.();
  }

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {TEMPLATES.map((template) => (
        <TemplateCard key={template.id} template={template} onClick={() => apply(template)} />
      ))}
    </div>
  );
}

function TemplateCard({ template, onClick }: { template: Template; onClick: () => void }) {
  const t = useT();
  const username = useEditor((s) => s.doc.username) || PREVIEW_USERNAME;
  const mode = usePrefs((s) => s.mode);
  const doc: Doc = useMemo(
    () => ({ ...emptyDoc(), username, marker: false, rows: instantiate(template.rows) }),
    [template, username]
  );
  const zh = t.lang === 'zh-TW';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md"
    >
      <div className={cx('h-44 overflow-hidden border-b border-slate-200', mode === 'dark' ? 'bg-[#0d1117]' : 'bg-white')}>
        <DocPreview doc={doc} mode={mode} width={320} />
      </div>
      <div className="px-3 py-2.5">
        <div className="text-sm font-semibold text-slate-900">{zh ? template.name_zh : template.name}</div>
        <div className="text-xs text-slate-500">{zh ? template.description_zh : template.description}</div>
      </div>
    </button>
  );
}
