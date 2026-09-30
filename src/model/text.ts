import type { TextRun } from './types';

function sameFormat(a: TextRun, b: TextRun): boolean {
  return !!a.bold === !!b.bold && a.href === b.href;
}

/** Merges neighbours with the same formatting and drops empty runs and trailing breaks. */
export function normalizeRuns(runs: readonly TextRun[]): TextRun[] {
  const out: TextRun[] = [];
  for (const run of runs) {
    if (!run.text) continue;
    const clean: TextRun = { text: run.text };
    if (run.bold) clean.bold = true;
    if (run.href) clean.href = run.href;
    const last = out[out.length - 1];
    if (last && sameFormat(last, clean)) last.text += clean.text;
    else out.push(clean);
  }
  const last = out[out.length - 1];
  if (last) {
    last.text = last.text.replace(/\n+$/, '');
    if (!last.text) out.pop();
  }
  return out;
}

export function plainText(runs: readonly TextRun[]): string {
  return runs.map((r) => r.text).join('');
}

/** Only web and mail links; anything else (javascript:, data:) is dropped. */
export function safeHref(href: string | undefined): string | undefined {
  if (!href) return undefined;
  const trimmed = href.trim();
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(trimmed)) return `https://${trimmed}`;
  return undefined;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, '&quot;');
}

/** The HTML GitHub gets for a run list; the canvas edits the very same markup. */
export function runsToHtml(runs: readonly TextRun[]): string {
  return runs
    .map((run) => {
      let html = escapeHtml(run.text).replace(/\n/g, '<br>');
      if (run.bold) html = `<b>${html}</b>`;
      const href = safeHref(run.href);
      if (href) html = `<a href="${escapeAttr(href)}">${html}</a>`;
      return html;
    })
    .join('');
}

/**
 * Reads runs back out of edited markup. Browsers produce <b>/<strong>, inline
 * font-weight, <div> or <p> for new lines and <br>, so all of those are understood;
 * every other tag is flattened to its text.
 */
export function htmlToRuns(root: Node): TextRun[] {
  const runs: TextRun[] = [];

  function walk(node: Node, bold: boolean, href: string | undefined) {
    if (node.nodeType === 3) {
      runs.push({ text: (node.textContent ?? '').replace(/ /g, ' '), bold, href });
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as Element;
    const tag = el.tagName;
    if (tag === 'BR') {
      runs.push({ text: '\n', bold, href });
      return;
    }
    const weight = (el as HTMLElement).style?.fontWeight;
    const isBold = bold || tag === 'B' || tag === 'STRONG' || weight === 'bold' || Number(weight) >= 600;
    const link = tag === 'A' ? safeHref(el.getAttribute('href') ?? undefined) ?? href : href;
    const block = tag === 'DIV' || tag === 'P';
    if (block && runs.length > 0 && !runs[runs.length - 1].text.endsWith('\n')) runs.push({ text: '\n' });
    el.childNodes.forEach((child) => walk(child, isBold, link));
  }

  root.childNodes.forEach((child) => walk(child, false, undefined));
  return normalizeRuns(runs);
}
