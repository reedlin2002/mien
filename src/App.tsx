import { useEffect, useState } from 'react';
import { installMarkdownTheme } from './canvas/markdownTheme';
import { Workspace } from './canvas/Workspace';
import { useT } from './i18n';
import { duplicateCell, removeCell } from './model/ops';
import { useEditor } from './store/editor';
import { usePrefs } from './store/prefs';
import { TemplateGallery } from './templates/TemplateGallery';
import { ExportDialog } from './ui/ExportDialog';
import { Modal } from './ui/Modal';
import { Toolbar } from './ui/Toolbar';

installMarkdownTheme();

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

function useShortcuts(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const { undo, redo, edit, select, startEditing, selectedCellId, doc } = useEditor.getState();
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (mod && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && key === 'y') {
        e.preventDefault();
        redo();
      } else if (mod && key === 'd' && selectedCellId) {
        e.preventDefault();
        let copy: string | null = null;
        edit((d) => {
          const result = duplicateCell(d, selectedCellId);
          copy = result.id;
          return result.doc;
        });
        if (copy) select(copy);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedCellId) {
        e.preventDefault();
        edit((d) => removeCell(d, selectedCellId));
      } else if (e.key === 'Enter' && selectedCellId) {
        const isText = doc.rows.some((r) => r.cells.some((c) => c.id === selectedCellId && c.block.type === 'text'));
        if (isText) {
          e.preventDefault();
          startEditing(selectedCellId);
        }
      } else if (e.key === 'Escape') {
        select(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}

export function App() {
  const t = useT();
  const lang = usePrefs((s) => s.lang);
  const [dialog, setDialog] = useState<'export' | 'templates' | null>(null);
  useShortcuts(dialog === null);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <div className="flex h-screen flex-col bg-ground text-ink">
      <p className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900 lg:hidden">{t('narrow')}</p>
      <Toolbar onExport={() => setDialog('export')} onTemplates={() => setDialog('templates')} />
      <Workspace />
      {dialog === 'export' && <ExportDialog onClose={() => setDialog(null)} />}
      {dialog === 'templates' && (
        <Modal title={t('templatesTitle')} width="max-w-3xl" onClose={() => setDialog(null)}>
          <p className="-mt-3 mb-4 text-sm text-muted">{t('templatesHint')}</p>
          <TemplateGallery columns={2} onPick={() => setDialog(null)} />
        </Modal>
      )}
    </div>
  );
}
