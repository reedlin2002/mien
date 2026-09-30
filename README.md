<!-- The project name is still provisional. -->

# readme-canvas

**Lay out your GitHub profile README like a slide.** Drag stats cards, banners, skill icons, badges and text onto a page, move them around, pull a corner to resize, and copy the result to your profile. You never see Markdown.

What you see on the canvas is what GitHub shows. The canvas is drawn with GitHub's own markdown CSS, at the width, font size and table rules of a real profile README, and it only lets you put things where GitHub can actually render them.

## Why another README generator?

GitHub strips almost all styling from READMEs: no `style`, no positioning, no scripts. What survives is `align`, `width`, tables, and `<picture>` for light and dark variants. Most generators either hand you a form and a wall of Markdown, or let you place things freely and then quietly move them when GitHub renders the page.

This editor goes the other way. Layouts are a tree of **rows** (stacked) and **cells** (side by side) whose only geometry is a width, snapped to steps GitHub renders faithfully (20–100%, or a badge's natural size). Dropping, moving and resizing all snap to that structure, so a layout that looks right on the canvas can't break on GitHub. A compiler turns the tree into the handful of HTML tags GitHub keeps.

## Features

- **Drag and drop** from a palette of widgets, with a blue insertion line showing where things land
- **Resize** with corner handles; widths snap to steps that fit beside their neighbours
- **Text** headings and paragraphs edited in place, with bold, links and emoji. Text beside a widget becomes a table, and the canvas shows GitHub's table borders instead of pretending they won't be there
- **Light and dark**: widgets left on "Auto" switch with the viewer's GitHub theme via `<picture>`; preview either mode with one click
- **14 widgets** from the community: github-readme-stats (stats, top languages, repo cards), streak stats, capsule-render banners, typing SVG, skill icons, profile summary cards, contribution chart, LeetCode card, shields.io social badges, profile view counter, followers badge, and any image or GIF
- **Settings generated from each widget's description**, with live previews for themes and layouts and an icon picker for skills
- **Templates** to start from, undo/redo, autosave, English and 繁體中文
- **No login, no backend.** Export copies the README and opens the right page on GitHub (creating your profile repository first if you don't have one)

## How the "what you see is what GitHub shows" claim is checked

- `src/compile/github-render.test.ts` sends compiled READMEs through GitHub's Markdown API in CI and fails if anything the layout depends on (`align`, `width`, `<picture>`, links, spacing between cells) gets stripped.
- The canvas renders the same elements the compiler emits: inline images for a row of widgets, headings for text, a table for mixed rows. With GitHub's CSS applied to both, every element of every template lands on the same pixel as the exported HTML, in light and dark mode. The canvas is sized like github.com's profile README (846px wide, 14px text) and scaled to fit your window.

## Adding a widget

Widgets are JSON files in [`registry/widgets`](registry/widgets). If you run a README widget service, send a pull request with one file describing its URL and settings; the editor builds the settings panel from it. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests; set GITHUB_TOKEN to also run the GitHub render checks
npm run build
```

React, TypeScript, Vite, Tailwind, dnd-kit and zustand. The layout model (`src/model`), compiler (`src/compile`) and drop geometry (`src/canvas/dropTarget.ts`) are plain functions with their own tests.

Every README it exports starts with an invisible `<!-- made with readme-canvas -->` comment so usage can be counted with GitHub code search. You can switch it off in the export dialog.
