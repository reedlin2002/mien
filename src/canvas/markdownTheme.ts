// GitHub's markdown CSS ships one file per color mode, each styling `.markdown-body`.
// The canvas needs both at once, switched by a toggle rather than by the OS, so each
// file is scoped under [data-color-mode] and injected into the `markdown` cascade
// layer: above Tailwind's reset so the page looks like GitHub, below utilities so
// the editor's own chrome can still override it.

import dark from 'github-markdown-css/github-markdown-dark.css?inline';
import light from 'github-markdown-css/github-markdown-light.css?inline';

export function scopeMarkdownCss(css: string, mode: 'light' | 'dark'): string {
  return css.replace(/\.markdown-body/g, `[data-color-mode="${mode}"] .markdown-body`);
}

// Tailwind's reset makes images blocks and strips list markers; GitHub keeps the
// browser defaults, and inline images are what lets widgets sit side by side.
const UNDO_RESET = `
[data-color-mode] .markdown-body :is(img, svg, video, picture) { display: inline; vertical-align: baseline; }
[data-color-mode] .markdown-body ul { list-style: disc; }
[data-color-mode] .markdown-body ol { list-style: decimal; }
`;

let installed = false;

export function installMarkdownTheme(): void {
  if (installed) return;
  installed = true;
  const style = document.createElement('style');
  style.dataset.source = 'github-markdown-css';
  // Declaring the layer order here, ahead of every other stylesheet, fixes where
  // `markdown` sits even though its rules arrive after Tailwind's.
  style.textContent =
    '@layer theme, base, markdown, components, utilities;\n' +
    `@layer markdown {\n${scopeMarkdownCss(light, 'light')}\n${scopeMarkdownCss(dark, 'dark')}\n${UNDO_RESET}\n}`;
  document.head.prepend(style);
}
