// Writes README.md from docs/readme.mien.json with mien's own compiler, so the project
// README is exactly what the editor would export. Runs the source through Vite so the
// widget registry (loaded with import.meta.glob) resolves the same way as in the app.
//
//   npm run readme
import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' });
try {
  const { compile } = await server.ssrLoadModule('/src/compile/compile.ts');
  const { emptyDoc, instantiate } = await server.ssrLoadModule('/src/model/doc.ts');
  const spec = JSON.parse(readFileSync('docs/readme.mien.json', 'utf8'));
  const doc = { ...emptyDoc(), username: spec.username, marker: true, rows: instantiate(spec.rows) };
  writeFileSync('README.md', compile(doc));
  console.log('README.md written from docs/readme.mien.json');
} finally {
  await server.close();
}
