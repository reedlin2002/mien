import { useEffect, useState } from 'react';
import { Workspace } from './canvas/Workspace';
import { removeCell } from './model/ops';
import { useEditor } from './store/editor';
import { ExportDialog } from './ui/ExportDialog';
import { Toolbar } from './ui/Toolbar';

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

function useShortcuts(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const { undo, redo, edit, select, selectedCellId } = useEditor.getState();
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (mod && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && key === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedCellId) {
        e.preventDefault();
        edit((doc) => removeCell(doc, selectedCellId));
      } else if (e.key === 'Escape') {
        select(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}

export function App() {
  const [exporting, setExporting] = useState(false);
  useShortcuts(!exporting);

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-900">
      <Toolbar onExport={() => setExporting(true)} />
      <Workspace />
      {exporting && <ExportDialog onClose={() => setExporting(false)} />}
    </div>
  );
}
