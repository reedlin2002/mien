<p align="center"><img src="docs/logo.svg" alt="" width="88"></p>

<h1 align="center">mien</h1>

<p align="center">Lay out your GitHub profile README like a slide.<br><b>What you see is what GitHub shows.</b></p>

<p align="center">
  <a href="https://reedlin2002.github.io/mien/editor/"><img src="https://img.shields.io/badge/open_the_editor-2a1206?style=for-the-badge" alt="Open the editor"></a>
  <img src="https://img.shields.io/badge/widgets-14-f26b3a" alt="14 widgets">
  <img src="https://img.shields.io/badge/license-MIT-97ca00" alt="MIT license">
  <img src="https://img.shields.io/badge/PRs-welcome-4c1" alt="PRs welcome">
</p>

<!-- Demo GIF goes here once the site is live: a stats card dragged in, a corner pulled to 50%, dark mode, Copy to GitHub, paste, commit. -->

## How it works

<table>
  <tr>
    <td width="33%" valign="top"><b>1. Drag</b><br>Pick a banner, a stats card, your skills or a line of text, and drop it on the page. An orange line shows where it lands.</td>
    <td width="33%" valign="top"><b>2. Resize</b><br>Pull a corner. Widths snap to steps GitHub renders exactly, so nothing jumps after you commit.</td>
    <td width="33%" valign="top"><b>3. Copy</b><br>One button copies your README and opens it on GitHub. Paste, commit, done. No login.</td>
  </tr>
</table>

## What you can put on it

Banners · typing text · GitHub stats · top languages · streaks · contribution chart · repository cards · LeetCode · skill icons · social badges · view counter · followers · any image or GIF, plus headings, paragraphs, bold and links.

Every widget comes from an open-source project, and its author is credited right in the editor.

## Why it never breaks on GitHub

GitHub strips styling from READMEs: no `style`, no positioning, no scripts. What survives is `align`, `width`, tables and `<picture>` for light and dark variants. Instead of letting you place things anywhere and hoping, mien only lets you build layouts GitHub can render: rows stacked down the page, cells side by side, widths that snap.

The canvas is drawn with GitHub's own markdown CSS at a profile README's real width and font size, and CI sends compiled READMEs through GitHub's Markdown API to check that nothing the layout depends on gets stripped.

## Add your widget

Run a README widget? Describe it in one JSON file in [`registry/widgets`](registry/widgets) and open a pull request. The settings panel is generated from it. See [CONTRIBUTING.md](CONTRIBUTING.md).

```json
{
  "id": "my-widget",
  "urlTemplate": "https://my-widget.dev/api?user={username}&theme={theme}",
  "params": [{ "key": "theme", "type": "enum", "preview": true, "options": [ … ] }]
}
```

## Development

```sh
npm install
npm run dev        # site at /, editor at /editor/
npm test           # set GITHUB_TOKEN to also run the GitHub render checks
npm run build
```

React, TypeScript, Vite, Tailwind, dnd-kit and zustand. The layout model (`src/model`), compiler (`src/compile`) and drop geometry (`src/canvas/dropTarget.ts`) are plain functions with their own tests.

Every README mien exports starts with an invisible `<!-- made with mien -->` comment, so usage can be counted with GitHub code search. You can switch it off when you export.

---

<p align="center">MIT license · made by <a href="https://github.com/reedlin2002">@reedlin2002</a></p>
