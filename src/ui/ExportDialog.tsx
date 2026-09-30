import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { compile } from '../compile/compile';
import { APP_NAME } from '../config';
import { copyText } from '../export/clipboard';
import { isValidUsername, lookupProfile, normalizeUsername, openUrl, profileRepoUrl, type ProfileStatus } from '../export/github';
import { useEditor } from '../store/editor';
import { cx } from './cx';
import { CheckIcon, CloseIcon, CopyIcon, ExternalIcon } from './icons';

export function ExportDialog({ onClose }: { onClose: () => void }) {
  const doc = useEditor((s) => s.doc);
  const setSetting = useEditor((s) => s.setSetting);
  const source = useMemo(() => compile(doc), [doc]);
  const user = doc.username;
  const valid = isValidUsername(user);
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle');
  const [status, setStatus] = useState<ProfileStatus | null>(null);

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

  useEffect(() => setCopied('idle'), [source]);

  async function copy() {
    setCopied((await copyText(source)) ? 'done' : 'failed');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between">
          <h2 id="export-title" className="text-lg font-semibold text-slate-900">
            Put it on your GitHub profile
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-slate-500 hover:bg-slate-100">
            <CloseIcon />
          </button>
        </div>

        {!valid && (
          <label className="mb-5 block rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            <span className="mb-1.5 block font-medium">What’s your GitHub username?</span>
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

        <ol className={cx('flex flex-col gap-4', !valid && 'pointer-events-none opacity-40')}>
          <Step n={1} title="Copy your README">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {copied === 'done' ? <CheckIcon /> : <CopyIcon />}
              {copied === 'done' ? 'Copied' : 'Copy'}
            </button>
            {copied === 'failed' && (
              <p className="mt-2 text-sm text-red-600">Your browser blocked copying. Use “Show the code” below and copy it by hand.</p>
            )}
          </Step>
          <Step n={2} title={stepTwoTitle(status)}>
            <a
              href={valid ? openUrl(user, status ?? { kind: 'unknown' }) : undefined}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3.5 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              {stepTwoButton(user, status)}
              <ExternalIcon />
            </a>
            <p className="mt-2 text-sm text-slate-600">{stepTwoHint(user, status)}</p>
          </Step>
          <Step n={3} title="Paste and commit">
            <p className="text-sm text-slate-600">
              Select everything in GitHub’s editor, paste (Ctrl+V / ⌘V), then press <b>Commit changes</b>.
            </p>
          </Step>
        </ol>

        <label className="mt-6 flex items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={doc.marker}
            onChange={(e) => setSetting({ marker: e.target.checked })}
            className="mt-0.5"
          />
          <span>
            Add an invisible “made with {APP_NAME}” note. It never shows on your profile; it only lets us count how many
            people use this.
          </span>
        </label>

        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-slate-500 select-none hover:text-slate-700">Show the code</summary>
          <textarea
            readOnly
            value={source}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-2 h-40 w-full resize-y rounded-md border border-slate-300 bg-slate-50 p-2 font-mono text-xs text-slate-800"
          />
        </details>
      </div>
    </div>
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

function stepTwoTitle(status: ProfileStatus | null): string {
  if (status?.kind === 'no-repo') return 'Create your profile repository';
  if (status?.kind === 'no-readme') return 'Add a README to your profile repository';
  return 'Open your profile README';
}

function stepTwoButton(user: string, status: ProfileStatus | null): string {
  if (status?.kind === 'no-repo') return `Create repo “${user}”`;
  if (status?.kind === 'no-readme') return 'Add README.md';
  return 'Open on GitHub';
}

function stepTwoHint(user: string, status: ProfileStatus | null): string {
  const repo = profileRepoUrl(user).replace('https://', '');
  switch (status?.kind) {
    case undefined:
      return `Checking ${repo}…`;
    case 'no-repo':
      return `GitHub shows the README of a public repository named exactly like your username. Tick “Add a README file” when you create it, then open the README and edit it.`;
    case 'no-readme':
      return `${repo} exists but has no README yet. This opens a new README.md there.`;
    case 'has-readme':
      return `Opens the editor for ${repo}.`;
    case 'unknown':
      return `Couldn’t check ${repo}. If it doesn’t exist yet, create a public repository with that exact name first.`;
  }
}
