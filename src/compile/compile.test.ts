import { describe, expect, it } from 'vitest';
import { MARKER } from '../config';
import { emptyDoc } from '../model/doc';
import type { Align, Block, CellWidth, Doc } from '../model/types';
import type { WidgetDef } from '../widgets/types';
import { fillTemplate, resolveParams, widgetSrc } from '../widgets/urls';
import { compile } from './compile';

const card: WidgetDef = {
  id: 'card',
  name: 'Card',
  category: 'stats',
  author: 'a',
  homepage: 'https://example.com',
  urlTemplate: 'https://img.test/card?user={username}&icons={icons}&theme={theme}',
  linkTemplate: 'https://github.com/{username}',
  defaultWidth: 50,
  aspectRatio: 2,
  params: [
    { key: 'username', type: 'username' },
    { key: 'icons', type: 'boolean', default: true }
  ],
  theme: { param: 'theme', light: 'default', dark: 'dark' }
};

const banner: WidgetDef = {
  id: 'banner',
  name: 'Banner',
  category: 'header',
  author: 'a',
  homepage: 'https://example.com',
  urlTemplate: 'https://img.test/banner?text={text}',
  defaultWidth: 100,
  aspectRatio: 7,
  params: [{ key: 'text', type: 'text', default: 'Hi, {username}' }]
};

const badge: WidgetDef = {
  id: 'badge',
  name: 'Badge',
  category: 'badges',
  author: 'a',
  homepage: 'https://example.com',
  urlTemplate: 'https://img.test/badge',
  linkTemplate: '{link}',
  defaultWidth: 'auto',
  aspectRatio: 4,
  params: [{ key: 'link', type: 'url', default: '' }]
};

const image: WidgetDef = {
  id: 'image',
  name: 'Image',
  category: 'media',
  author: 'a',
  homepage: 'https://example.com',
  urlTemplate: '{src}',
  defaultWidth: 50,
  aspectRatio: 1,
  params: [{ key: 'src', type: 'url', required: true }]
};

const lookup = (id: string) => [card, banner, badge, image].find((w) => w.id === id);

type CellSpec = [string, CellWidth] | [Block, CellWidth];

function doc(rows: { align?: Align; cells: CellSpec[] }[], patch: Partial<Doc> = {}): Doc {
  return {
    ...emptyDoc(),
    username: 'octo',
    marker: false,
    ...patch,
    rows: rows.map((r, i) => ({
      id: `r${i}`,
      align: r.align ?? 'center',
      cells: r.cells.map(([what, width], j) => ({
        id: `r${i}c${j}`,
        width,
        block: typeof what === 'string' ? { type: 'widget', widgetId: what, params: {} } : what
      }))
    }))
  };
}

const CARD =
  '<a href="https://github.com/octo"><picture>' +
  '<source media="(prefers-color-scheme: dark)" srcset="https://img.test/card?user=octo&amp;icons=true&amp;theme=dark">' +
  '<img src="https://img.test/card?user=octo&amp;icons=true&amp;theme=default" alt="Card" width="50%">' +
  '</picture></a>';

describe('compile', () => {
  it('outputs nothing but a newline for an empty document', () => {
    expect(compile(doc([]), lookup)).toBe('\n');
  });

  it('wraps a themed widget in <picture> and links it', () => {
    expect(compile(doc([{ cells: [['card', 50]] }]), lookup)).toBe(`<p align="center">${CARD}</p>\n`);
  });

  it('leaves a widget without a link or theme as a bare image', () => {
    expect(compile(doc([{ align: 'left', cells: [['banner', 100]] }]), lookup)).toBe(
      '<p align="left"><img src="https://img.test/banner?text=Hi%2C%20octo" alt="Banner" width="100%"></p>\n'
    );
  });

  it('joins cells in a row without whitespace so percentages add up exactly', () => {
    const out = compile(doc([{ cells: [['card', 50], ['card', 50]] }]), lookup);
    expect(out).toBe(`<p align="center">${CARD}${CARD}</p>\n`);
  });

  it('separates rows with a blank line so each is its own HTML block', () => {
    const out = compile(doc([{ cells: [['banner', 100]] }, { align: 'right', cells: [['card', 50]] }]), lookup);
    expect(out.split('\n\n')).toHaveLength(2);
    expect(out).toContain('\n\n<p align="right">');
  });

  it('puts the marker first when it is on', () => {
    const out = compile(doc([{ cells: [['card', 50]] }], { marker: true }), lookup);
    expect(out.startsWith(`${MARKER}\n\n<p`)).toBe(true);
  });

  it('skips widgets missing from the registry, and rows left empty by that', () => {
    expect(compile(doc([{ cells: [['gone', 50]] }, { cells: [['banner', 100], ['gone', 20]] }]), lookup)).toBe(
      '<p align="center"><img src="https://img.test/banner?text=Hi%2C%20octo" alt="Banner" width="100%"></p>\n'
    );
  });

  it('escapes attribute values', () => {
    const quoted = { ...banner, name: 'A "quoted" <name>' };
    const out = compile(doc([{ cells: [['banner', 100]] }]), () => quoted);
    expect(out).toContain('alt="A &quot;quoted&quot; &lt;name&gt;"');
  });
});

describe('widget urls', () => {
  it('encodes values and leaves unknown placeholders alone', () => {
    expect(fillTemplate('/x?a={a}&b={b}', { a: 'x y&z' })).toBe('/x?a=x%20y%26z&b={b}');
  });

  it('takes the username from the document, not from params', () => {
    expect(resolveParams(card, { username: 'someone-else' }, 'octo').username).toBe('octo');
  });

  it('uses the stored param over the default', () => {
    expect(widgetSrc(card, { icons: false }, 'octo')).toBe('https://img.test/card?user=octo&icons=false&theme=default');
  });

  it('picks the theme value for the color mode', () => {
    expect(widgetSrc(card, {}, 'octo', 'dark')).toContain('theme=dark');
  });
});

const h1 = (text: string): Block => ({ type: 'text', kind: 'h1', runs: [{ text }] });
const para: Block = { type: 'text', kind: 'p', runs: [{ text: 'I ' }, { text: 'build', bold: true }, { text: ' things', href: 'https://x.dev' }] };

describe('text', () => {
  it('turns a lone text cell into an aligned heading', () => {
    expect(compile(doc([{ cells: [[h1('Hi <there> & you'), 100]] }]), lookup)).toBe('<h1 align="center">Hi &lt;there&gt; &amp; you</h1>\n');
  });

  it('keeps bold and links, which GitHub renders inside HTML', () => {
    expect(compile(doc([{ align: 'left', cells: [[para, 50]] }]), lookup)).toBe(
      '<p align="left">I <b>build</b><a href="https://x.dev"> things</a></p>\n'
    );
  });

  it('turns line breaks into <br> so the HTML block never ends early', () => {
    const lines: Block = { type: 'text', kind: 'p', runs: [{ text: 'one\n\ntwo' }] };
    expect(compile(doc([{ cells: [[lines, 100]] }]), lookup)).toBe('<p align="center">one<br><br>two</p>\n');
  });

  it('drops empty text', () => {
    expect(compile(doc([{ cells: [[h1(''), 100]] }]), lookup)).toBe('\n');
  });
});

describe('tables', () => {
  it('puts text beside a widget in a table, the image filling its cell', () => {
    expect(compile(doc([{ cells: [[h1('Hi'), 50], ['banner', 50]] }]), lookup)).toBe(
      '<table align="center"><tr><td width="50%" align="center"><h1>Hi</h1></td>' +
        '<td width="50%" align="center"><img src="https://img.test/banner?text=Hi%2C%20octo" alt="Banner" width="100%"></td></tr></table>\n'
    );
  });
});

describe('natural-size widgets', () => {
  it('leaves out the width and spaces badges apart', () => {
    const linked: Block = { type: 'widget', widgetId: 'badge', params: { link: 'https://x.dev/me' } };
    expect(compile(doc([{ cells: [[linked, 'auto'], ['badge', 'auto']] }]), lookup)).toBe(
      '<p align="center"><a href="https://x.dev/me"><img src="https://img.test/badge" alt="Badge"></a> <img src="https://img.test/badge" alt="Badge"></p>\n'
    );
  });

  it('skips widgets whose required params are empty', () => {
    expect(compile(doc([{ cells: [['image', 50]] }]), lookup)).toBe('\n');
    const set: Block = { type: 'widget', widgetId: 'image', params: { src: 'https://i.test/cat.gif' } };
    expect(compile(doc([{ cells: [[set, 50]] }]), lookup)).toBe('<p align="center"><img src="https://i.test/cat.gif" alt="Image" width="50%"></p>\n');
  });

  it('refuses script links', () => {
    const evil: Block = { type: 'widget', widgetId: 'badge', params: { link: 'javascript:alert(1)' } };
    expect(compile(doc([{ cells: [[evil, 'auto']] }]), lookup)).not.toContain('javascript');
  });
});
