import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { DocPreview } from '../canvas/DocPreview';
import { compile } from '../compile/compile';
import { APP_NAME } from '../config';
import { copyText } from '../export/clipboard';
import { isValidUsername, lookupProfile, openUrl, profileRepoUrl, type ProfileStatus } from '../export/github';
import { useT } from '../i18n';
import type { ColorMode, Doc } from '../model/types';
import { useEditor } from '../store/editor';
import { usePrefs } from '../store/prefs';
import { getWidget } from '../widgets/registry';
import { missingParams } from '../widgets/urls';
import { cx } from './cx';
import { CheckIcon, ChevronRightIcon, CloseIcon, CopyIcon, WarningIcon } from './icons';
import { UsernameField } from './Toolbar';

/** Widgets left out of the export because a required setting is still empty. */
export function unfinishedCells(doc: Doc): { cellId: string; name: string }[] {
  return doc.rows.flatMap((row) =>
    row.cells.flatMap((cell) => {
      if (cell.block.type !== 'widget') return [];
      const def = getWidget(cell.block.widgetId);
      return !def || missingParams(def, cell.block.params).length > 0 ? [{ cellId: cell.id, name: def?.name ?? '?' }] : [];
    })
  );
}

const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

/**
 * Getting the README onto the profile: a preview of exactly what GitHub renders,
 * then one button that copies it and opens the right page on GitHub.
 */
export function ExportDialog({ onClose }: { onClose: () => void }) {
  const t = useT();
  const doc = useEditor((s) => s.doc);
  const setSetting = useEditor((s) => s.setSetting);
  const select = useEditor((s) => s.select);
  const [mode, setMode] = useState<ColorMode>(usePrefs.getState().mode);
  const source = useMemo(() => compile(doc), [doc]);
  const unfinished = useMemo(() => unfinishedCells(doc), [doc]);
  const user = doc.username;
  const valid = isValidUsername(user);
  const [status, setStatus] = useState<ProfileStatus | null>(null);
  const [result, setResult] = useState<'idle' | 'opened' | 'blocked' | 'copy-failed'>('idle');
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!valid) return;
    let current = true;
    setStatus(null);
    lookupProfile(user).then((s) => current && setStatus(s));
    return () => {
      current = false;
    };
  }, [user, valid]);

  useEffect(() => setResult('idle'), [source]);

  const target = valid ? openUrl(user, status ?? { kind: 'unknown' }) : '';
  const repo = profileRepoUrl(user).replace('https://', '');

  async function copyAndOpen() {
    if (!(await copyText(source))) {
      setResult('copy-failed');
      setShowCode(true);
      return;
    }
    const tab = window.open(target, '_blank');
    if (tab) tab.opener = null;
    setResult(tab ? 'opened' : 'blocked');
  }

  const primary =
    status?.kind === 'no-repo' ? t('copyAndCreate') : status?.kind === 'no-readme' ? t('copyAndAdd') : t('copyAndOpen');

  return (
    <div className="fixed inset-0 z-50 bg-ink/35" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        onClick={(e) => e.stopPropagation()}
        className="absolute top-0 right-0 flex h-full w-[600px] max-w-full flex-col bg-white shadow-[-16px_0_48px_rgba(27,26,23,0.22)]"
      >
        <div className="flex items-center justify-between px-7 pt-5 pb-4">
          <h2 id="export-title" className="font-display text-[26px] font-extrabold tracking-[-0.02em] text-ink">
            {t('exportTitle')}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-9 items-center justify-center rounded-[9px] bg-ground text-ink hover:bg-line">
            <CloseIcon />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-7 pb-6">
          <div className="overflow-hidden rounded-[14px] border border-line">
            <div className="flex items-center justify-between border-b border-line bg-paper py-2 pr-2 pl-3.5">
              <span className="text-[13px] font-medium text-[#4a4843]">{t('renderPreview')}</span>
              <div className="flex rounded-lg bg-line/70 p-0.5" role="group">
                {(['light', 'dark'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={mode === m}
                    onClick={() => setMode(m)}
                    className={cx('h-[26px] rounded-md px-2.5 text-xs', mode === m ? 'bg-white font-medium text-ink shadow-sm' : 'text-muted')}
                  >
                    {t(m)}
                  </button>
                ))}
              </div>
            </div>
            <div className={cx('max-h-[300px] overflow-y-auto', mode === 'dark' ? 'bg-[#0d1117]' : 'bg-white')}>
              <DocPreview doc={{ ...doc, username: user || 'octocat' }} mode={mode} width={544} />
            </div>
          </div>

          {!valid && (
            <div className="rounded-xl bg-[#fff4e5] p-3.5">
              <UsernameField />
            </div>
          )}

          {valid && (
            <p
              className={cx(
                'flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm',
                status?.kind === 'has-readme' ? 'bg-[#e8f5ec] text-[#1a6b34]' : 'bg-paper text-[#4a4843]'
              )}
            >
              {status?.kind === 'has-readme' && <CheckIcon width={18} height={18} strokeWidth={2.2} />}
              {status === null
                ? t('checking', { repo })
                : status.kind === 'has-readme'
                  ? t('foundReadme', { repo })
                  : status.kind === 'no-readme'
                    ? t('foundNoReadme', { repo })
                    : status.kind === 'no-repo'
                      ? t('noRepo')
                      : t('hintUnknown', { repo })}
            </p>
          )}

          <button
            type="button"
            disabled={!valid}
            onClick={copyAndOpen}
            className="flex h-14 items-center justify-center gap-2.5 rounded-[14px] bg-github text-[17px] font-semibold text-white hover:bg-github-strong disabled:opacity-40"
          >
            {result === 'opened' ? <CheckIcon width={18} height={18} /> : <CopyIcon width={18} height={18} />}
            {result === 'opened' ? t('copied') : primary}
          </button>
          {result === 'blocked' && (
            <p className="text-sm text-[#4a4843]">
              {t('popupBlocked')}{' '}
              <a href={target} target="_blank" rel="noreferrer" className="font-semibold text-brand-text underline">
                {repo}
              </a>
            </p>
          )}
          {result === 'copy-failed' && <p className="text-sm text-[#b42318]">{t('copyFailed')}</p>}

          <ol className="flex flex-col gap-2.5 text-sm text-[#4a4843]">
            {status?.kind === 'no-repo' && <Step n={1}>{t('stepCreate')}</Step>}
            <Step n={status?.kind === 'no-repo' ? 2 : 1}>
              {t('stepSelectAll')} <Key>{MOD} A</Key>
            </Step>
            <Step n={status?.kind === 'no-repo' ? 3 : 2}>
              {t('stepPaste')} <Key>{MOD} V</Key>
            </Step>
            <Step n={status?.kind === 'no-repo' ? 4 : 3}>{t('stepCommit')}</Step>
          </ol>

          {unfinished.map((u) => (
            <div key={u.cellId} className="flex items-center gap-3 rounded-xl bg-[#fff4e5] px-3.5 py-3 text-[13px] text-[#7a4100]">
              <WarningIcon width={18} height={18} className="shrink-0" />
              <span className="flex-1">{t('unfinished', { name: t.registry(u.name) })}</span>
              <button
                type="button"
                onClick={() => {
                  select(u.cellId);
                  onClose();
                }}
                className="font-semibold whitespace-nowrap hover:underline"
              >
                {t('fixIt')}
              </button>
            </div>
          ))}

          <label className="flex cursor-pointer items-start justify-between gap-4 text-[13px] leading-relaxed text-[#4a4843]">
            <span>{t('marker', { app: APP_NAME })}</span>
            <input type="checkbox" checked={doc.marker} onChange={(e) => setSetting({ marker: e.target.checked })} className="peer sr-only" />
            <span className={cx('relative mt-0.5 h-5 w-[34px] shrink-0 rounded-full transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand', doc.marker ? 'bg-brand' : 'bg-[#d6d3cb]')}>
              <span className={cx('absolute top-0.5 size-4 rounded-full bg-white transition-all', doc.marker ? 'left-4' : 'left-0.5')} />
            </span>
          </label>
        </div>

        <div className="border-t border-line px-7 py-3.5">
          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            aria-expanded={showCode}
            className="flex w-full items-center justify-between text-[13px] text-[#4a4843]"
          >
            <span className="flex items-center gap-1.5">
              <ChevronRightIcon width={14} height={14} className={cx('transition', showCode && 'rotate-90')} />
              {t('showCode')}
            </span>
            <span className="font-mono text-xs text-muted">{t('codeSize', { size: `${(new Blob([source]).size / 1024).toFixed(1)} KB` })}</span>
          </button>
          {showCode && (
            <textarea
              readOnly
              value={source}
              onFocus={(e) => e.currentTarget.select()}
              className="mt-3 h-40 w-full resize-y rounded-lg border border-line bg-paper p-2 font-mono text-xs text-ink"
            />
          )}
        </div>
      </section>
    </div>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-ink text-xs font-semibold text-cream">{n}</span>
      <span className="flex flex-wrap items-center gap-2">{children}</span>
    </li>
  );
}

function Key({ children }: { children: ReactNode }) {
  return <kbd className="rounded-md border border-[#d6d3cb] px-1.5 py-0.5 font-mono text-xs text-ink">{children}</kbd>;
}
