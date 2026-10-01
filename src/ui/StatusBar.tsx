import { useMemo } from 'react';
import { useT } from '../i18n';
import { useEditor } from '../store/editor';
import { unfinishedCells } from './ExportDialog';

export function StatusBar() {
  const t = useT();
  const doc = useEditor((s) => s.doc);
  const select = useEditor((s) => s.select);
  const unfinished = useMemo(() => unfinishedCells(doc), [doc]);
  const items = doc.rows.reduce((n, r) => n + r.cells.length, 0);

  return (
    <footer className="flex h-[30px] shrink-0 items-center gap-4 border-t border-line bg-white px-4 text-xs text-muted">
      <span className="flex items-center gap-1.5">
        <span className="size-[7px] rounded-full bg-github" />
        {t('saved')}
      </span>
      <span>{t('counts', { rows: doc.rows.length, items })}</span>
      {unfinished.length > 0 ? (
        <button
          type="button"
          onClick={() => select(unfinished[0].cellId)}
          className="font-medium text-[#7a4100] hover:underline"
        >
          {t('needSetupCount', { n: unfinished.length })}
        </button>
      ) : (
        items > 0 && <span>{t('allSetUp')}</span>
      )}
      <span className="flex-1" />
      <span className="hidden lg:inline">{t('shortcuts')}</span>
    </footer>
  );
}
