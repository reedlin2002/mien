import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { compile } from '../compile/compile';
import { APP_NAME } from '../config';
import { copyText } from '../export/clipboard';
import { isValidUsername, lookupProfile, normalizeUsername, openUrl, profileRepoUrl, type ProfileStatus } from '../export/github';
import { useT } from '../i18n';
import type { Doc } from '../model/types';
import { useEditor } from '../store/editor';
import { getWidget } from '../widgets/registry';
import { missingParams } from '../widgets/urls';
import { cx } from './cx';
import { CheckIcon, CopyIcon, ExternalIcon } from './icons';
import { Modal } from './Modal';

function unfinishedWidgets(doc: Doc): number {
  return doc.rows
    .flatMap((r) => r.cells)
    .filter((c) => {
      if (c.block.type !== 'widget') return false;
      const def = getWidget(c.block.widgetId);
      return !def || missingParams(def, c.block.params).length > 0;
    }).length;
}

export function ExportDialog({ onClose }: { onClose: () => void }) {
  const t = useT();
  const doc = useEditor((s) => s.doc);
  const setSetting = useEditor((s) => s.setSetting);
  const source = useMemo(() => compile(doc), [doc]);
  const skipped = useMemo(() => unfinishedWidgets(doc), [doc]);
  const user = doc.username;
  const valid = isValidUsername(user);
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle');
  const [status, setStatus] = useState<ProfileStatus | null>(null);

  useEffect(() => {
    if (!valid) return;
    let current = true;
    setStatus(null);
    lookupProfile(user).then((s) => current && setStatus(s));
    return () => {
      current = false;
    };
  }, [user, valid]);

  useEffect(() => setCopied('idle'), [source]);

  async function copy() {
    setCopied((await copyText(source)) ? 'done' : 'failed');
  }

  const repo = profileRepoUrl(user).replace('https://', '');
  const stepTwo =
    status?.kind === 'no-repo'
      ? { title: t('step2Create'), button: t('createRepo', { user }), hint: t('hintNoRepo') }
      : status?.kind === 'no-readme'
        ? { title: t('step2Add'), button: t('addReadme'), hint: t('hintNoReadme', { repo }) }
        : {
            title: t('step2Open'),
            button: t('openOnGitHub'),
            hint:
              status === null
                ? t('checking', { repo })
                : status.kind === 'has-readme'
                  ? t('hintHasReadme', { repo })
                  : t('hintUnknown', { repo })
          };

  return (
    <Modal title={t('exportTitle')} onClose={onClose}>
      {!valid && (
        <label className="mb-5 block rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <span className="mb-1.5 block font-medium">{t('askUsername')}</span>
          <input
            autoFocus
            defaultValue={user}
            onChange={(e) => setSetting({ username: normalizeUsername(e.target.value) })}
            placeholder="octocat"
            spellCheck={false}
            className="w-full rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-slate-900 outline-none focus:border-blue-500"
          />
        </label>
      )}

      {skipped > 0 && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{t('skipped', { n: skipped })}</p>}

      <ol className={cx('flex flex-col gap-4', !valid && 'pointer-events-none opacity-40')}>
        <Step n={1} title={t('step1')}>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {copied === 'done' ? <CheckIcon /> : <CopyIcon />}
            {copied === 'done' ? t('copied') : t('copy')}
          </button>
          {copied === 'failed' && <p className="mt-2 text-sm text-red-600">{t('copyFailed')}</p>}
        </Step>
        <Step n={2} title={stepTwo.title}>
          <a
            href={valid ? openUrl(user, status ?? { kind: 'unknown' }) : undefined}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3.5 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            {stepTwo.button}
            <ExternalIcon />
          </a>
          <p className="mt-2 text-sm text-slate-600">{stepTwo.hint}</p>
        </Step>
        <Step n={3} title={t('step3')}>
          <p className="text-sm text-slate-600">{t('step3Body')}</p>
        </Step>
      </ol>

      <label className="mt-6 flex items-start gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={doc.marker} onChange={(e) => setSetting({ marker: e.target.checked })} className="mt-0.5" />
        <span>{t('marker', { app: APP_NAME })}</span>
      </label>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-slate-500 select-none hover:text-slate-700">{t('showCode')}</summary>
        <textarea
          readOnly
          value={source}
          onFocus={(e) => e.currentTarget.select()}
          className="mt-2 h-40 w-full resize-y rounded-md border border-slate-300 bg-slate-50 p-2 font-mono text-xs text-slate-800"
        />
      </details>
    </Modal>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="mb-2 font-medium text-slate-900">{title}</p>
        {children}
      </div>
    </li>
  );
}
