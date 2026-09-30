// Sends compiled READMEs through GitHub's own Markdown renderer and checks that
// nothing the layout depends on was stripped. This is what "the canvas shows what
// GitHub shows" rests on, so CI runs it; locally it needs GITHUB_TOKEN and is
// skipped otherwise.

import { describe, expect, it } from 'vitest';
import { emptyDoc, textCell, widgetCell } from '../model/doc';
import type { Align, Doc, WidthStep } from '../model/types';
import { compile } from './compile';

const token = process.env.GITHUB_TOKEN;

async function render(markdown: string): Promise<string> {
  const res = await fetch('https://api.github.com/markdown', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    body: JSON.stringify({ text: markdown, mode: 'gfm', context: 'octocat/octocat' })
  });
  if (!res.ok) throw new Error(`GitHub markdown API: ${res.status} ${await res.text()}`);
  return res.text();
}

function doc(rows: { align: Align; cells: [string, WidthStep][] }[]): Doc {
  return {
    ...emptyDoc(),
    username: 'octocat',
    rows: rows.map((r, i) => ({
      id: `r${i}`,
      align: r.align,
      cells: r.cells.map(([id, width]) => widgetCell(id, width))
    }))
  };
}

const count = (html: string, pattern: RegExp) => html.match(new RegExp(pattern, 'g'))?.length ?? 0;

describe.skipIf(!token)('GitHub keeps what the layout needs', () => {
  const sample = doc([
    { align: 'center', cells: [['capsule-banner', 100]] },
    { align: 'center', cells: [['github-stats', 50], ['github-stats', 50]] },
    { align: 'right', cells: [['capsule-banner', 33]] }
  ]);

  it('keeps row alignment, widths, dark variants and links', async () => {
    const html = await render(compile(sample));

    expect(count(html, /<p align="center">/)).toBe(2);
    expect(count(html, /<p align="right">/)).toBe(1);
    expect(count(html, /width="100%"/)).toBe(1);
    expect(count(html, /width="50%"/)).toBe(2);
    expect(count(html, /width="33%"/)).toBe(1);
    expect(count(html, /<source media="\(prefers-color-scheme: dark\)"/)).toBe(2);
    expect(count(html, /<a href="https:\/\/github\.com\/octocat">/)).toBe(2);
  });

  it('puts no whitespace between cells in a row', async () => {
    const html = await render(compile(sample));
    expect(html).not.toMatch(/<\/a>\s+<a href/);
  });

  it('hides the marker from the rendered page', async () => {
    const html = await render(compile(sample));
    expect(html).not.toContain('made with');
  });

  it('keeps aligned headings, bold, links and line breaks', async () => {
    const text: Doc = {
      ...emptyDoc(),
      username: 'octocat',
      marker: false,
      rows: [
        { id: 'a', align: 'center', cells: [textCell('h1', [{ text: 'Hi ' }, { text: 'there', bold: true }])] },
        { id: 'b', align: 'left', cells: [textCell('p', [{ text: 'one\ntwo ' }, { text: 'site', href: 'https://example.com' }])] }
      ]
    };
    const html = await render(compile(text));
    expect(html).toContain('<h1 align="center">Hi <b>there</b></h1>');
    expect(html).toMatch(/<p align="left">one<br>two <a href="https:\/\/example\.com"[^>]*>site<\/a><\/p>/);
  });

  it('keeps table alignment and cell widths when text sits beside a widget', async () => {
    const mixed: Doc = {
      ...emptyDoc(),
      username: 'octocat',
      marker: false,
      rows: [{ id: 't', align: 'center', cells: [{ ...textCell('p', [{ text: 'About me' }]), width: 50 }, widgetCell('github-stats', 50)] }]
    };
    const html = await render(compile(mixed));
    expect(html).toMatch(/<table align="center"/);
    expect(count(html, /<td width="50%" align="center">/)).toBe(2);
    expect(html).toMatch(/<img [^>]*width="100%"/);
  });

  it('leaves natural-size badges without a width and keeps the space between them', async () => {
    const badges: Doc = {
      ...emptyDoc(),
      username: 'octocat',
      marker: false,
      rows: [{ id: 'b', align: 'center', cells: [widgetCell('profile-views', 'auto'), widgetCell('followers-badge', 'auto')] }]
    };
    const html = await render(compile(badges));
    expect(html).not.toMatch(/width="/);
    expect(html).toMatch(/<\/a> <a/);
  });
});
