import { useCallback, useEffect, useRef, useState } from 'react';
import { APP_NAME } from '../config';
import { isValidUsername, normalizeUsername } from '../export/github';
import { useT } from '../i18n';
import { useEditor } from '../store/editor';
import { usePrefs } from '../store/prefs';
import { cx } from './cx';
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  LogoMark,
  MoonIcon,
  RedoIcon,
  SunIcon,
  TemplateIcon,
  UndoIcon
} from './icons';
import { useDismiss } from './useDismiss';

const iconButton =
  'flex size-9 items-center justify-center rounded-lg text-ink hover:bg-ground disabled:text-faint disabled:hover:bg-transparent';

export function Toolbar({ onExport, onTemplates }: { onExport: () => void; onTemplates: () => void }) {
  const t = useT();
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const hasRows = useEditor((s) => s.doc.rows.length > 0);
  const mode = usePrefs((s) => s.mode);
  const setMode = usePrefs((s) => s.setMode);
  const lang = usePrefs((s) => s.lang);
  const setLang = usePrefs((s) => s.setLang);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-white px-4">
      <div className="flex items-center gap-2">
        <LogoMark />
        <span className="font-display text-xl font-extrabold tracking-tight text-ink">{APP_NAME}</span>
      </div>
      <span className="h-6 w-px bg-line" />
      <ProfileChip />
      <button
        type="button"
        onClick={onTemplates}
        className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-ink hover:bg-ground"
      >
        <TemplateIcon /> {t('templates')}
      </button>

      <div className="flex-1" />

      <span
        title={t('parityHint')}
        className="hidden items-center gap-1.5 rounded-full bg-[#e8f5ec] px-3 py-1.5 text-[13px] font-medium text-[#1a6b34] xl:flex"
      >
        <CheckIcon width={14} height={14} strokeWidth={2.5} />
        {t('parity')}
      </span>
      <div className="flex items-center">
        <button type="button" onClick={undo} disabled={!canUndo} title={t('undo')} aria-label={t('undo')} className={iconButton}>
          <UndoIcon width={17} height={17} />
        </button>
        <button type="button" onClick={redo} disabled={!canRedo} title={t('redo')} aria-label={t('redo')} className={iconButton}>
          <RedoIcon width={17} height={17} />
        </button>
      </div>
      <div className="flex rounded-[10px] bg-ground p-[3px]" role="group" aria-label={`${t('showLight')} / ${t('showDark')}`}>
        {(['light', 'dark'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            title={m === 'light' ? t('showLight') : t('showDark')}
            aria-label={m === 'light' ? t('showLight') : t('showDark')}
            className={cx(
              'flex h-[30px] w-[34px] items-center justify-center rounded-[7px]',
              mode === m ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'
            )}
          >
            {m === 'light' ? <SunIcon /> : <MoonIcon />}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setLang(lang === 'en' ? 'zh-TW' : 'en')}
        className="h-9 rounded-lg px-2.5 text-[13px] font-semibold text-muted hover:bg-ground hover:text-ink"
      >
        {t('switchLanguage')}
      </button>
      <button
        type="button"
        onClick={onExport}
        disabled={!hasRows}
        className="flex h-[38px] items-center gap-2 rounded-[10px] bg-github px-4 text-sm font-semibold text-white shadow-sm hover:bg-github-strong disabled:opacity-40"
      >
        {t('copyToGitHub')}
        <ArrowRightIcon width={15} height={15} strokeWidth={2.2} />
      </button>
    </header>
  );
}

/** Avatar and @name; clicking opens a small editor for the username. */
function ProfileChip() {
  const t = useT();
  const username = useEditor((s) => s.doc.username);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={cx(
          'flex h-9 items-center gap-2 rounded-full border py-0 pr-2.5 pl-1 text-sm',
          username ? 'border-line text-ink hover:border-faint' : 'border-brand bg-brand-tint text-brand-ink'
        )}
      >
        <Avatar username={username} />
        {username ? `@${username}` : t('setUsername')}
        <ChevronDownIcon width={14} height={14} className="text-muted" />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 w-72 rounded-xl border border-line bg-white p-3 shadow-lg">
          <UsernameField onDone={close} />
        </div>
      )}
    </div>
  );
}

export function Avatar({ username, size = 28 }: { username: string; size?: number }) {
  const [failed, setFailed] = useState<string | null>(null);
  const valid = isValidUsername(username);
  if (!valid || failed === username) {
    return (
      <span
        className="flex items-center justify-center rounded-full bg-ink text-xs font-semibold text-white"
        style={{ width: size, height: size }}
      >
        {username ? username[0].toUpperCase() : '?'}
      </span>
    );
  }
  return (
    <img
      src={`https://github.com/${username}.png?size=${size * 2}`}
      alt=""
      onError={() => setFailed(username)}
      className="rounded-full bg-ground"
      style={{ width: size, height: size }}
    />
  );
}

/**
 * Widgets reload whenever the username changes, so the store only hears about it
 * once typing pauses, not on every keystroke.
 */
export function UsernameField({ onDone, autoFocus = true }: { onDone?: () => void; autoFocus?: boolean }) {
  const t = useT();
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
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink">{t('username')}</span>
      <span className="flex h-10 items-center rounded-lg border border-line bg-white px-2.5 focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/20">
        <span className="font-mono text-muted">github.com/</span>
        <input
          autoFocus={autoFocus}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => setSetting({ username: normalizeUsername(draft) })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setSetting({ username: normalizeUsername(draft) });
              onDone?.();
            }
          }}
          placeholder="octocat"
          spellCheck={false}
          autoCapitalize="off"
          className="w-full bg-transparent font-mono text-ink outline-none"
        />
      </span>
    </label>
  );
}
