// The project READMEs are made with mien: each must be exactly what the compiler makes
// of its docs/readme*.mien.json. Edit the JSON and run `npm run readme`, never the
// READMEs by hand.

import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { compile } from './compile/compile';
import { emptyDoc, instantiate, type RowSpec } from './model/doc';

const root = new URL('../', import.meta.url);

it.each([
  ['docs/readme.mien.json', 'README.md'],
  ['docs/readme.zh-TW.mien.json', 'README.zh-TW.md']
])('%s compiles to %s', (source, target) => {
  const spec = JSON.parse(readFileSync(new URL(source, root), 'utf8')) as { username: string; rows: RowSpec[] };
  const doc = { ...emptyDoc(), username: spec.username, marker: true, rows: instantiate(spec.rows) };
  const readme = readFileSync(new URL(target, root), 'utf8').replace(/\r\n/g, '\n');
  expect(readme).toBe(compile(doc));
});
