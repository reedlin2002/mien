import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { APP_NAME, REPO_URL } from '../config';
import { copyText } from '../export/clipboard';
import { cx } from '../ui/cx';
import { LockIcon, LogoMark } from '../ui/icons';
import { Hero } from './Hero';
import { AUTHOR_URL, CONTRIBUTING_URL, EDITOR_URL, StarIcon } from './links';
import { useReveal } from './useReveal';

const NAV = [
  { href: '#how', label: 'How it works' },
  { href: '#why', label: `Why ${APP_NAME}` },
  { href: '#widgets', label: 'Widgets' },
  { href: '#contribute', label: 'Contribute' }
];

export function Site() {
  useEffect(() => {
    document.documentElement.lang = 'en';
  }, []);

  return (
    <div className="min-h-screen bg-cream font-sans text-brand-ink">
      <header className="sticky top-0 z-20 border-b border-brand-ink/12 bg-brand">
        <nav className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between gap-6 px-6">
          <a href="#top" className="flex items-center gap-2.5 text-brand-ink no-underline">
            <LogoMark blink width={34} height={34} />
            <span className="font-display text-[30px] leading-none font-extrabold tracking-[-0.05em]">{APP_NAME}</span>
          </a>
          <div className="hidden items-center gap-7 text-[15px] font-medium md:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="relative text-brand-ink no-underline after:absolute after:right-0 after:-bottom-1.5 after:left-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-brand-ink after:transition-transform hover:after:scale-x-100"
              >
                {n.label}
              </a>
            ))}
          </div>
          <PrimaryLink href={EDITOR_URL} size="sm">
            Open the editor
          </PrimaryLink>
        </nav>
      </header>

      <Hero />
      <UsualWay />
      <HowItWorks />
      <Why />
      <Widgets />
      <Contribute />
      <FinalCta />

      <footer className="bg-brand-ink text-[#e9d6ca]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-5 px-6 py-9 text-sm">
          <span className="flex items-center gap-2.5">
            <LogoMark blink head="var(--color-brand)" eyes="var(--color-brand-ink)" width={26} height={26} />
            <span className="font-display text-[22px] font-extrabold tracking-[-0.04em] text-cream">{APP_NAME}</span>
          </span>
          <span>
            MIT license · made by{' '}
            <a href={AUTHOR_URL} className="text-[#f9b394] hover:text-cream">
              @reedlin2002
            </a>
          </span>
          <span className="flex gap-5">
            <a href={REPO_URL} className="text-cream hover:text-[#f9b394]">
              GitHub
            </a>
            <a href={CONTRIBUTING_URL} className="text-cream hover:text-[#f9b394]">
              Contributing
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}

function PrimaryLink({ href, size = 'md', children }: { href: string; size?: 'sm' | 'md'; children: ReactNode }) {
  return (
    <a
      href={href}
      className={cx(
        'inline-flex shrink-0 items-center rounded-xl bg-brand-ink font-semibold text-cream no-underline transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(42,18,6,.22)]',
        size === 'sm' ? 'h-11 px-[18px] text-[15px]' : 'h-14 px-7 text-lg'
      )}
    >
      {children}
    </a>
  );
}

function Section({ id, tone, children, className }: { id?: string; tone: 'white' | 'cream'; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cx('scroll-mt-[72px]', tone === 'white' ? 'bg-white' : 'bg-cream')}>
      <div className={cx('mx-auto flex max-w-[1200px] flex-col gap-10 px-6 py-24', className)}>{children}</div>
    </section>
  );
}

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const reveal = useReveal<HTMLDivElement>();
  return (
    <div ref={reveal.ref} className={cx('transition duration-700 ease-[cubic-bezier(.2,.8,.2,1)]', reveal.className, className)}>
      {children}
    </div>
  );
}

function Heading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cx('m-0 font-display text-[clamp(32px,4.5vw,52px)] leading-[1.02] font-extrabold tracking-[-0.035em]', className)}>
      {children}
    </h2>
  );
}

function UsualWay() {
  return (
    <Section tone="white">
      <Reveal className="flex max-w-[720px] flex-col gap-3">
        <span className="font-mono text-[13px] text-[#a63f14]">The usual way</span>
        <Heading>Edit, commit, reload, find out the widths add up to 101%. Repeat.</Heading>
      </Reveal>
      <Reveal className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] gap-5">
        <div className="flex min-w-0 flex-col gap-3.5 rounded-[18px] bg-brand-ink p-6 text-[#e9d6ca]">
          <span className="text-sm font-semibold text-cream">By hand</span>
          <pre className="m-0 font-mono text-[12.5px] leading-[1.65] break-all whitespace-pre-wrap">
            {`<p align="center"><a href="https://github.com/you">
  <picture><source media="(prefers-color-scheme: dark)"
  srcset="…api?username=you&theme=github_dark">
  <img src="…api?username=you" width="49%"></picture></a>
<a href="https://github.com/you"><img
  src="…/top-langs/?username=you" width="49%"></a></p>
`}
            <span className="text-[#f9b394]">{'<!-- why is the second card on its own line now? -->'}</span>
          </pre>
        </div>
        <div className="flex min-w-0 flex-col gap-3.5 rounded-[18px] border border-cream-line bg-cream p-6">
          <span className="text-sm font-semibold">With {APP_NAME}</span>
          <div className="flex min-h-[190px] flex-1 items-center justify-center rounded-xl border border-[#f0e2d8] bg-white p-5">
            <div className="h-24 w-[42%] rounded border border-[#e4e2e2]" />
            <div className="mx-2.5 h-[116px] w-[3px] animate-dropline rounded-sm bg-brand" />
            <div className="h-24 w-[42%] animate-dropin rounded border border-[#e4e2e2] bg-white shadow-[0_12px_24px_rgba(42,18,6,.16)] outline-2 outline-brand" />
          </div>
          <span className="text-[15px] text-brown">
            Drop a card next to another. The orange line says where it lands and how wide each one becomes.
          </span>
        </div>
      </Reveal>
    </Section>
  );
}

const STEPS = [
  ['Type your username', 'Pick a template. It fills in with your real GitHub stats right away.'],
  ['Drag, drop, resize', 'Put things side by side and pull a corner. Widths snap to steps GitHub renders exactly.'],
  ['Copy to GitHub', 'One button copies your README and opens GitHub. Paste, commit, done.']
];

function HowItWorks() {
  return (
    <Section id="how" tone="cream">
      <Reveal>
        <Heading>Three steps. No Markdown.</Heading>
      </Reveal>
      <Reveal className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-5">
        {STEPS.map(([title, body], i) => (
          <div
            key={title}
            className="flex flex-col gap-2.5 rounded-[18px] border border-cream-line bg-white p-7 transition duration-200 hover:-translate-y-1.5 hover:-rotate-[0.6deg] hover:border-brand hover:shadow-[0_18px_36px_rgba(242,107,58,.18)]"
          >
            <span className="font-display text-[56px] leading-none font-extrabold text-brand">{i + 1}</span>
            <h3 className="m-0 text-[22px] font-semibold">{title}</h3>
            <p className="m-0 text-base leading-normal text-brown">{body}</p>
          </div>
        ))}
      </Reveal>
    </Section>
  );
}

const REASONS: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: 'Real rows and columns',
    body: 'Rows, side-by-side cells and snapping widths. Nothing GitHub can’t show.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C4501F" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M12 4v16M3 12h18" />
      </svg>
    )
  },
  {
    title: 'Light and dark, automatically',
    body: 'Cards switch with each visitor’s GitHub theme. You never write both.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C4501F" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4a8 8 0 0 1 0 16z" fill="#C4501F" />
      </svg>
    )
  },
  {
    title: 'Checked by GitHub’s renderer',
    body: 'CI sends every change through GitHub’s own Markdown renderer to prove it.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C4501F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    )
  },
  { title: 'No login', body: 'Nothing is written to GitHub until you paste it yourself.', icon: <LockIcon width={28} height={28} stroke="#C4501F" /> }
];

function Why() {
  return (
    <Section id="why" tone="white">
      <Reveal className="flex max-w-[760px] flex-col gap-3">
        <Heading>It never breaks on GitHub.</Heading>
        <p className="m-0 text-lg leading-normal text-brown">
          GitHub strips styling from READMEs. Instead of letting you place things anywhere and hoping, {APP_NAME} only lets you build
          layouts GitHub can render.
        </p>
      </Reveal>
      <Reveal className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-5">
        {REASONS.map((r) => (
          <SpotlightCard key={r.title}>
            {r.icon}
            <h3 className="m-0 text-[19px] font-semibold">{r.title}</h3>
            <p className="m-0 text-[15px] leading-normal text-brown">{r.body}</p>
          </SpotlightCard>
        ))}
      </Reveal>
    </Section>
  );
}

/** A card that glows orange around the pointer. */
function SpotlightCard({ children }: { children: ReactNode }) {
  const [spot, setSpot] = useState<{ x: number; y: number } | null>(null);
  function move(e: MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setSpot({ x: Math.round(e.clientX - r.left), y: Math.round(e.clientY - r.top) });
  }
  return (
    <div
      onMouseMove={move}
      onMouseLeave={() => setSpot(null)}
      className="flex flex-col gap-2.5 rounded-[18px] p-6"
      style={{
        background: spot
          ? `radial-gradient(280px circle at ${spot.x}px ${spot.y}px, rgba(242,107,58,0.32), transparent 70%), var(--color-cream)`
          : 'var(--color-cream)'
      }}
    >
      {children}
    </div>
  );
}

const CHIPS_A = ['Banners', 'Typing text', 'GitHub stats', 'Top languages', 'Streaks', 'Contribution chart', 'Repository cards'];
const CHIPS_B = ['LeetCode', 'Skill icons', 'Social badges', 'View counter', 'Followers', 'Any image or GIF', 'Headings and links'];

function Widgets() {
  return (
    <Section id="widgets" tone="cream" className="items-center gap-7 text-center">
      <Reveal>
        <Heading>Put any of these on your page.</Heading>
      </Reveal>
      <div className="flex w-full flex-col gap-3">
        <Marquee chips={CHIPS_A} />
        <Marquee chips={CHIPS_B} reverse />
      </div>
      <p className="m-0 text-base text-brown">Every widget comes from an open-source project, and its author is credited right in the editor.</p>
    </Section>
  );
}

function Marquee({ chips, reverse }: { chips: string[]; reverse?: boolean }) {
  return (
    <div className="group overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
      <div
        className="flex w-max animate-marquee gap-2.5 group-hover:[animation-play-state:paused]"
        style={reverse ? { animationDirection: 'reverse', animationDuration: '44s' } : undefined}
      >
        {[...chips, ...chips].map((c, i) => (
          <span
            key={i}
            aria-hidden={i >= chips.length}
            className="inline-flex h-11 items-center rounded-full border border-cream-line bg-white px-[18px] text-[15px] whitespace-nowrap transition hover:-translate-y-0.5 hover:bg-brand"
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

const WIDGET_JSON = `{
  "id": "my-widget",
  "urlTemplate": "https://my-widget.dev/api?user={username}&theme={theme}",
  "params": [{ "key": "theme", "type": "enum", "preview": true }]
}`;

function Contribute() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    if (await copyText(WIDGET_JSON)) {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    }
  }

  return (
    <section id="contribute" className="scroll-mt-[72px] bg-white">
      <Reveal className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-center gap-10 px-6 py-24">
        <div className="flex flex-col gap-4">
          <Heading>Run a README widget? Add it in one file.</Heading>
          <p className="m-0 text-lg leading-normal text-brown">
            Describe it in one JSON file and open a pull request. The settings panel is generated from it.
          </p>
          <a href={CONTRIBUTING_URL} className="text-base font-semibold text-[#a63f14] hover:text-[#7a2d0e]">
            Read CONTRIBUTING.md →
          </a>
        </div>
        <div className="relative overflow-hidden rounded-[18px] bg-brand-ink">
          <button
            type="button"
            onClick={copy}
            className={cx(
              'absolute top-3 right-3 h-[34px] cursor-pointer rounded-[9px] px-3 text-[13px] font-semibold text-brand-ink transition hover:-translate-y-0.5',
              copied ? 'bg-[#f9b394]' : 'bg-brand'
            )}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          <pre className="m-0 px-6 pt-14 pb-6 font-mono text-sm leading-[1.65] break-words whitespace-pre-wrap text-cream">{WIDGET_JSON}</pre>
        </div>
      </Reveal>
    </section>
  );
}

/** The closing call to action: the cat watches the pointer and the button leans toward it. */
function FinalCta() {
  const [eyes, setEyes] = useState({ x: 0, y: 0 });
  const [pull, setPull] = useState({ x: 0, y: 0 });

  function look(e: MouseEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
    const dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.4)) / (r.height / 2)));
    setEyes({ x: dx * 1.2, y: dy });
  }

  function lean(e: MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setPull({ x: Math.round((e.clientX - r.left - r.width / 2) * 0.3), y: Math.round((e.clientY - r.top - r.height / 2) * 0.3) });
  }

  return (
    <section id="editor" onMouseMove={look} className="bg-brand text-brand-ink">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 px-6 py-[104px] text-center">
        <Reveal className="flex items-center gap-[18px]">
          <svg width="96" height="96" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 9 5 2l5 5h4l5-5 2 7v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" fill="var(--color-brand-ink)" />
            <g transform={`translate(${eyes.x} ${eyes.y})`} style={{ transition: 'transform .15s ease-out' }}>
              <g className="animate-blink" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                <rect x="7" y="12" width="4" height="4" rx="1" fill="var(--color-brand)" />
                <rect x="13" y="12" width="4" height="4" rx="1" fill="var(--color-brand)" />
              </g>
            </g>
          </svg>
          <span className="font-display text-[clamp(80px,12vw,140px)] leading-none font-extrabold tracking-[-0.05em]">{APP_NAME}</span>
        </Reveal>
        <p className="m-0 text-[clamp(18px,2.2vw,22px)] font-medium">Drag. Drop. Done. A profile README in minutes.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <div onMouseMove={lean} onMouseLeave={() => setPull({ x: 0, y: 0 })} className="-m-3.5 p-3.5">
            <a
              href={EDITOR_URL}
              className="inline-flex h-14 items-center rounded-[14px] bg-brand-ink px-7 text-lg font-semibold text-cream no-underline transition-transform duration-200 ease-[cubic-bezier(.2,.8,.2,1)]"
              style={{ transform: `translate(${pull.x}px, ${pull.y}px)` }}
            >
              Open the editor
            </a>
          </div>
          <a
            href={REPO_URL}
            className="inline-flex h-14 items-center gap-2 rounded-[14px] border-2 border-brand-ink px-7 text-lg font-semibold text-brand-ink no-underline transition hover:-translate-y-0.5"
          >
            <StarIcon /> Star on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
