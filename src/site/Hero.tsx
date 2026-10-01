import { useEffect, useState } from 'react';
import { APP_NAME, REPO_URL } from '../config';
import { cx } from '../ui/cx';
import { LogoMark } from '../ui/icons';
import { EDITOR_URL, StarIcon } from './links';

const WORDS = ['slide', 'poster', 'bento box', 'magazine'];
const HEADLINE = ['Your', 'GitHub', 'profile,', 'laid', 'out', 'like', 'a'];

export function Hero() {
  const [word, setWord] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setWord((w) => (w + 1) % WORDS.length), 2200);
    return () => clearInterval(timer);
  }, []);
  const prev = (word + WORDS.length - 1) % WORDS.length;

  return (
    <section id="top" className="overflow-hidden bg-brand text-brand-ink">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 px-6 pt-[72px] text-center">
        <span className="inline-flex h-8 animate-fadeup items-center rounded-full bg-brand-ink/10 px-3.5 font-mono text-[13px]">
          Free · open source · no login
        </span>
        <h1 className="m-0 max-w-[980px] font-display text-[clamp(44px,7vw,92px)] leading-[1.02] font-extrabold tracking-[-0.045em]">
          {HEADLINE.map((w, i) => (
            <span key={w}>
              <span className="inline-block animate-rise" style={{ animationDelay: `${0.05 + i * 0.06}s` }}>
                {w}
              </span>{' '}
            </span>
          ))}
          <span
            className="mt-[0.08em] inline-grid animate-rise overflow-hidden rounded-[0.14em] bg-cream px-[0.18em] align-bottom"
            style={{ animationDelay: '0.5s', rotate: '-1.5deg' }}
            aria-live="polite"
          >
            {WORDS.map((w, i) => (
              <span
                key={w}
                aria-hidden={i !== word}
                className="whitespace-nowrap transition-[opacity,transform] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] [grid-area:1/1]"
                style={{ opacity: i === word ? 1 : 0, transform: `translateY(${i === word ? 0 : i === prev ? -70 : 70}%)` }}
              >
                {w}.
              </span>
            ))}
          </span>
        </h1>
        <p className="m-0 max-w-[620px] animate-fadeup text-[clamp(17px,2vw,21px)] leading-[1.45] font-medium" style={{ animationDelay: '0.6s' }}>
          A drag-and-drop editor for your GitHub profile README. What you see is what GitHub shows.
        </p>
        <div className="flex animate-fadeup flex-wrap justify-center gap-3" style={{ animationDelay: '0.72s' }}>
          <a
            href={EDITOR_URL}
            className="inline-flex h-[52px] items-center rounded-[14px] bg-brand-ink px-6 text-[17px] font-semibold text-cream no-underline transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(42,18,6,.22)]"
          >
            Open the editor
          </a>
          <a
            href={REPO_URL}
            className="inline-flex h-[52px] items-center gap-2 rounded-[14px] border-2 border-brand-ink px-6 text-[17px] font-semibold text-brand-ink no-underline transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(42,18,6,.22)]"
          >
            <StarIcon /> Star on GitHub
          </a>
        </div>
        <MiniEditor />
      </div>
    </section>
  );
}

const CARD_COLORS = ['#2F80ED', '#F26B3A', '#26A641'];
const ACROSS_LABEL: Record<number, string> = { 1: '1 across · 100%', 2: '2 across · 50% each', 3: '3 across · 33% each' };
const ACROSS_WIDTH: Record<number, string> = { 1: '100%', 2: '50%', 3: '33%' };

/** A miniature of the editor you can poke: cards per row and the color mode. */
function MiniEditor() {
  const [across, setAcross] = useState(2);
  const [dark, setDark] = useState(false);
  const th = dark
    ? { around: '#1A1410', page: '#0D1117', border: '#30363D', bar: '#30363D' }
    : { around: '#F7F1EC', page: '#FFFFFF', border: '#E4E2E2', bar: '#E3DCD6' };

  return (
    <div
      className="mt-7 w-full max-w-[1080px] animate-fadeup overflow-hidden rounded-t-[18px] bg-white text-left shadow-[0_-2px_0_rgba(42,18,6,.08),0_30px_60px_rgba(42,18,6,.25)]"
      style={{ animationDelay: '0.85s' }}
    >
      <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-2.5 border-b border-[#f0e2d8] px-4 py-2">
        <span className="flex items-center gap-2">
          <LogoMark width={22} height={22} />
          <span className="font-display text-[19px] font-extrabold tracking-[-0.04em]">{APP_NAME}</span>
        </span>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold text-[#7a5a48]">Try it</span>
          <Segmented
            label="Cards per row"
            options={[1, 2, 3].map((n) => ({ label: `${n} across`, on: n === across, pick: () => setAcross(n) }))}
          />
          <Segmented
            label="Theme"
            options={[
              { label: 'Light', on: !dark, pick: () => setDark(false) },
              { label: 'Dark', on: dark, pick: () => setDark(true) }
            ]}
          />
        </div>
        <span className="flex h-[34px] items-center rounded-[9px] bg-brand-ink px-3.5 text-[13px] font-semibold text-cream">Copy to GitHub</span>
      </div>
      <div className="flex h-[440px]">
        <div className="hidden w-[200px] shrink-0 flex-col gap-2 border-r border-[#f0e2d8] p-4 md:flex">
          <span className="text-xs font-semibold text-[#7a5a48]">Add to page</span>
          {['Banner', 'Stats card', 'Top languages', 'Skill icons', 'Streak', 'Text'].map((item) => (
            <span
              key={item}
              className={cx(
                'flex h-[38px] items-center rounded-[9px] px-2.5 text-[13px]',
                item === 'Stats card' ? 'bg-[#fdebe2] font-semibold text-[#a63f14]' : 'bg-cream'
              )}
            >
              {item}
            </span>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 justify-center p-6 transition-colors duration-300" style={{ background: th.around }}>
          <div
            className="flex w-full max-w-[560px] flex-col gap-3.5 rounded-lg border p-[18px] transition-colors duration-300"
            style={{ background: th.page, borderColor: th.border }}
          >
            <div className="flex h-[70px] items-center justify-center rounded bg-brand-ink font-display text-[22px] font-extrabold text-cream">
              Hi, I'm octocat
            </div>
            <div className="flex justify-center gap-1">
              {['#F7DF1E', '#3178C6', '#8B949E', '#2B5B84', '#F05032'].map((c) => (
                <span key={c} className="size-[22px] rounded-[5px]" style={{ background: c }} />
              ))}
            </div>
            <div className="relative flex pt-[18px]">
              <span className="absolute -top-1.5 left-1/2 z-10 flex h-[26px] -translate-x-1/2 items-center rounded-[7px] bg-brand px-2.5 font-mono text-xs font-medium whitespace-nowrap">
                {ACROSS_LABEL[across]}
              </span>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex h-[120px] min-w-0 flex-col gap-2 overflow-hidden rounded border p-3 transition-all duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
                  style={{
                    flex: `${i < across ? 1 : 0} 1 0%`,
                    opacity: i < across ? 1 : 0,
                    marginLeft: i === 0 || i >= across ? 0 : 12,
                    padding: i < across ? undefined : 0,
                    borderWidth: i < across ? 1 : 0,
                    borderColor: th.border
                  }}
                >
                  <span className="h-[5px] w-3/5 rounded-sm" style={{ background: CARD_COLORS[i] }} />
                  <span className="h-1 rounded-sm" style={{ background: th.bar }} />
                  <span className="h-1 rounded-sm" style={{ background: th.bar }} />
                  <span className="h-1 w-[70%] rounded-sm" style={{ background: th.bar }} />
                </div>
              ))}
            </div>
            <div className="grid h-16 grid-cols-18 gap-[3px] rounded border p-2.5" style={{ borderColor: th.border }}>
              {['#0E4429', '#26A641', 'bar', '#39D353', '#006D32', 'bar', '#26A641', '#0E4429', 'bar', '#39D353', '#26A641', 'bar', '#006D32', '#0E4429', '#26A641', 'bar', '#39D353', '#006D32'].map(
                (c, i) => (
                  <span key={i} className="rounded-sm" style={{ background: c === 'bar' ? th.bar : c }} />
                )
              )}
            </div>
          </div>
        </div>
        <div className="hidden w-[210px] shrink-0 flex-col gap-3 border-l border-[#f0e2d8] p-4 text-[13px] md:flex">
          <span className="text-xs font-semibold text-[#7a5a48]">Stats card</span>
          <span className="flex justify-between">
            Theme<span className="text-[#7a5a48]">{dark ? 'Dark' : 'Light'}</span>
          </span>
          <span className="flex justify-between">
            Width<span className="font-mono font-medium text-[#a63f14]">{ACROSS_WIDTH[across]}</span>
          </span>
          <span className="flex items-center justify-between">
            Icons<Toggle on />
          </span>
          <span className="flex items-center justify-between">
            Hide border<Toggle on={false} />
          </span>
        </div>
      </div>
    </div>
  );
}

function Segmented({ label, options }: { label: string; options: { label: string; on: boolean; pick: () => void }[] }) {
  return (
    <div role="group" aria-label={label} className="flex rounded-[10px] bg-[#f7f1ec] p-[3px]">
      {options.map((o) => (
        <button
          key={o.label}
          type="button"
          onClick={o.pick}
          aria-pressed={o.on}
          className={cx(
            'h-[30px] cursor-pointer rounded-lg px-3 text-[13px] font-semibold transition-colors',
            o.on ? 'bg-brand-ink text-cream' : 'text-brand-ink'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={cx('relative h-5 w-[34px] rounded-full', on ? 'bg-brand' : 'bg-[#e6d9cf]')}>
      <span className={cx('absolute top-0.5 size-4 rounded-full bg-white', on ? 'right-0.5' : 'left-0.5')} />
    </span>
  );
}
