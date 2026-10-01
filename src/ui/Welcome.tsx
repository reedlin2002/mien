import { useEffect, useMemo, useState } from 'react';
import { DocPreview } from '../canvas/DocPreview';
import { APP_NAME } from '../config';
import { isValidUsername, normalizeUsername } from '../export/github';
import { useT } from '../i18n';
import { emptyDoc, instantiate } from '../model/doc';
import { replaceRows } from '../model/ops';
import type { Doc } from '../model/types';
import { useEditor } from '../store/editor';
import { TEMPLATES, type Template } from '../templates/templates';
import { cx } from './cx';
import { ArrowRightIcon, LockIcon, LogoMark } from './icons';

/**
 * First visit: ask for the username before anything else, so every template is
 * already showing the visitor's own stats when they choose one.
 */
export function Welcome({ onClose }: { onClose: () => void }) {
  const t = useT();
  const edit = useEditor((s) => s.edit);
  const setSetting = useEditor((s) => s.setSetting);
  const [name, setName] = useState('');
  const [preview, setPreview] = useState('octocat');
  const [picked, setPicked] = useState(TEMPLATES[0]?.id);
  const zh = t.lang === 'zh-TW';

  // Previews reload images, so they follow the field only once typing pauses.
  useEffect(() => {
    const next = normalizeUsername(name);
    const timer = setTimeout(() => setPreview(isValidUsername(next) ? next : 'octocat'), 500);
    return () => clearTimeout(timer);
  }, [name]);

  function start(templateId: string | null) {
    const username = normalizeUsername(name);
    if (username) setSetting({ username });
    const template = TEMPLATES.find((tp) => tp.id === templateId);
    if (template) edit((doc) => replaceRows(doc, instantiate(template.rows)));
    onClose();
  }

  const pickedTemplate = TEMPLATES.find((tp) => tp.id === picked);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/45 p-6 pt-[8vh]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="flex w-full max-w-[780px] flex-col gap-7 rounded-[20px] bg-white px-12 pt-11 pb-10 shadow-2xl"
      >
        <div className="flex items-center gap-2 text-brand-ink">
          <LogoMark blink width={28} height={28} />
          <span className="font-display text-2xl leading-none font-extrabold tracking-[-0.05em]">{APP_NAME}</span>
        </div>

        <div className="flex flex-col gap-2.5">
          <h1 id="welcome-title" className="font-display text-[40px] leading-[1.08] font-extrabold tracking-[-0.03em] whitespace-pre-line text-ink">
            {t('welcomeTitle')}
          </h1>
          <p className="text-base leading-relaxed text-muted">{t('welcomeBody')}</p>
        </div>

        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            start(picked ?? null);
          }}
        >
          <label htmlFor="welcome-user" className="text-sm font-semibold text-ink">
            {t('username')}
          </label>
          <div className="flex gap-2.5">
            <span className="flex h-[52px] flex-1 items-center rounded-xl border-2 border-brand px-3.5 ring-4 ring-brand/15">
              <span className="font-mono text-base text-muted">github.com/</span>
              <input
                id="welcome-user"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="octocat"
                spellCheck={false}
                autoCapitalize="off"
                className="w-full bg-transparent font-mono text-base text-ink outline-none"
              />
            </span>
            <button
              type="submit"
              className="flex h-[52px] items-center gap-2 rounded-xl bg-brand-ink px-6 text-base font-semibold text-cream hover:bg-black"
            >
              {t('start')}
              <ArrowRightIcon width={16} height={16} strokeWidth={2.2} />
            </button>
          </div>
          <p className="flex items-center gap-1.5 text-[13px] text-muted">
            <LockIcon width={14} height={14} />
            {t('noLogin')}
          </p>
        </form>

        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-ink">{t('startFrom')}</span>
            <span className="text-[13px] text-muted">{t('filledWith', { user: preview })}</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {TEMPLATES.map((template) => (
              <TemplateChoice
                key={template.id}
                template={template}
                username={preview}
                selected={template.id === picked}
                zh={zh}
                onPick={() => setPicked(template.id)}
                onStart={() => start(template.id)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button type="button" onClick={() => start(null)} className="text-sm font-medium text-brand-text hover:underline">
            {t('emptyPage')}
          </button>
          {pickedTemplate && (
            <span className="flex items-center gap-2 text-[13px] text-muted">
              <kbd className="rounded-md border border-line px-1.5 py-0.5 font-mono text-xs">Enter</kbd>
              {t('enterToStart', { name: zh ? pickedTemplate.name_zh : pickedTemplate.name })}
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

function TemplateChoice({
  template,
  username,
  selected,
  zh,
  onPick,
  onStart
}: {
  template: Template;
  username: string;
  selected: boolean;
  zh: boolean;
  onPick: () => void;
  onStart: () => void;
}) {
  const doc: Doc = useMemo(
    () => ({ ...emptyDoc(), username, marker: false, rows: instantiate(template.rows) }),
    [template, username]
  );
  return (
    <button
      type="button"
      onClick={onPick}
      onDoubleClick={onStart}
      aria-pressed={selected}
      className={cx(
        'flex flex-col overflow-hidden rounded-[14px] bg-white text-left transition',
        selected ? 'border-2 border-brand' : 'border border-line hover:border-faint'
      )}
    >
      <span className="block h-[132px] overflow-hidden border-b border-line">
        <DocPreview doc={doc} mode="light" width={164} />
      </span>
      <span className="flex flex-col gap-0.5 px-3 py-2.5">
        <span className="text-sm font-semibold text-ink">{zh ? template.name_zh : template.name}</span>
        <span className="truncate text-xs text-muted">{zh ? template.description_zh : template.description}</span>
      </span>
    </button>
  );
}
