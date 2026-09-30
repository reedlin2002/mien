// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { htmlToRuns, normalizeRuns, runsToHtml, safeHref } from './text';

function parse(html: string) {
  const el = document.createElement('div');
  el.innerHTML = html;
  return htmlToRuns(el);
}

describe('runs', () => {
  it('merges neighbours with the same formatting and trims trailing breaks', () => {
    expect(normalizeRuns([{ text: 'a' }, { text: 'b' }, { text: '', bold: true }, { text: 'c', bold: true }, { text: '\n' }])).toEqual([
      { text: 'ab' },
      { text: 'c', bold: true }
    ]);
  });

  it('round-trips through the markup the canvas edits', () => {
    const runs = [{ text: 'Hi ' }, { text: 'there', bold: true }, { text: '\nsee ' }, { text: 'site', href: 'https://x.dev' }];
    expect(parse(runsToHtml(runs))).toEqual(runs);
  });
});

describe('reading edited markup', () => {
  it('understands what browsers produce for bold and new lines', () => {
    expect(parse('one<div>two</div><div><strong>three</strong></div>')).toEqual([
      { text: 'one\ntwo\n' },
      { text: 'three', bold: true }
    ]);
    expect(parse('<span style="font-weight: 700">x</span>&nbsp;y')).toEqual([{ text: 'x', bold: true }, { text: ' y' }]);
  });

  it('flattens other tags and drops unsafe links', () => {
    expect(parse('<i>a</i><a href="javascript:alert(1)">b</a>')).toEqual([{ text: 'ab' }]);
  });
});

describe('safeHref', () => {
  it('accepts web and mail links, completing bare domains', () => {
    expect(safeHref('https://x.dev')).toBe('https://x.dev');
    expect(safeHref('mailto:me@x.dev')).toBe('mailto:me@x.dev');
    expect(safeHref('x.dev/me')).toBe('https://x.dev/me');
    expect(safeHref('javascript:alert(1)')).toBeUndefined();
    expect(safeHref('')).toBeUndefined();
  });
});
