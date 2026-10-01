// Writes README.md and README.zh-TW.md from docs/readme*.mien.json with mien's own
// compiler, so the project READMEs are exactly what the editor would export. Runs the
// source through Vite so the widget registry (loaded with import.meta.glob) resolves the
// same way as in the app.
//
//   npm run readme
import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'vite';

const READMES = [
  ['docs/readme.mien.json', 'README.md'],
  ['docs/readme.zh-TW.mien.json', 'README.zh-TW.md']
];

const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' });
try {
  const { compile } = await server.ssrLoadModule('/src/compile/compile.ts');
  const { emptyDoc, instantiate } = await server.ssrLoadModule('/src/model/doc.ts');
  for (const [source, target] of READMES) {
    const spec = JSON.parse(readFileSync(source, 'utf8'));
    const doc = { ...emptyDoc(), username: spec.username, marker: true, rows: instantiate(spec.rows) };
    writeFileSync(target, compile(doc));
    console.log(`${target} written from ${source}`);
  }
} finally {
  await server.close();
}
