// The project README is made with mien: README.md must be exactly what the compiler
// makes of docs/readme.mien.json. Edit the JSON and run `npm run readme`, never the
// README by hand.

import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { compile } from './compile/compile';
import { emptyDoc, instantiate, type RowSpec } from './model/doc';

it('README.md is the compiled docs/readme.mien.json', () => {
  const root = new URL('../', import.meta.url);
  const spec = JSON.parse(readFileSync(new URL('docs/readme.mien.json', root), 'utf8')) as { username: string; rows: RowSpec[] };
  const doc = { ...emptyDoc(), username: spec.username, marker: true, rows: instantiate(spec.rows) };
  const readme = readFileSync(new URL('README.md', root), 'utf8').replace(/\r\n/g, '\n');
  expect(readme).toBe(compile(doc));
});
