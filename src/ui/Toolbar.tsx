import { useEffect, useState } from 'react';
import { APP_NAME } from '../config';
import { normalizeUsername } from '../export/github';
import { useEditor } from '../store/editor';
import { LogoIcon, RedoIcon, UndoIcon } from './icons';

export function Toolbar({ onExport }: { onExport: () => void }) {
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const hasRows = useEditor((s) => s.doc.rows.length > 0);

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-2 font-semibold text-slate-900">
        <LogoIcon className="text-blue-600" width={20} height={20} />
        {APP_NAME}
      </div>
      <UsernameField />
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <UndoIcon />
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo"
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <RedoIcon />
        </button>
        <button
          type="button"
          onClick={onExport}
          disabled={!hasRows}
          className="ml-2 rounded-md bg-[#1f883d] px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1a7f37] disabled:opacity-40"
        >
          Put it on GitHub
        </button>
      </div>
    </header>
  );
}

/**
 * Widgets reload whenever the username changes, so the store only hears about it
 * once typing pauses, not on every keystroke.
 */
function UsernameField() {
  const username = useEditor((s) => s.doc.username);
  const setSetting = useEditor((s) => s.setSetting);
  const [draft, setDraft] = useState(username);

  useEffect(() => setDraft(username), [username]);

  useEffect(() => {
    const next = normalizeUsername(draft);
    if (next === username) return;
    const timer = setTimeout(() => setSetting({ username: next }), 600);
    return () => clearTimeout(timer);
  }, [draft, username, setSetting]);

  return (
    <label className="flex items-center gap-2 text-sm text-slate-500">
      <span className="hidden sm:inline">GitHub username</span>
      <span className="flex items-center rounded-md border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
        <span className="pl-2.5 text-slate-400">@</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => setSetting({ username: normalizeUsername(draft) })}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          placeholder="octocat"
          spellCheck={false}
          autoCapitalize="off"
          className="w-40 bg-transparent py-1.5 pr-2.5 pl-1 text-slate-900 outline-none"
        />
      </span>
    </label>
  );
}
