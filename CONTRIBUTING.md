# Contributing

## Running it locally

```sh
npm install
npm run dev        # site at /, editor at /editor/
npm test           # set GITHUB_TOKEN to also run the checks against GitHub's renderer
npm run build
npm run demo       # re-record public/demo.gif from the live editor (uses your installed Chrome)
```

React, TypeScript, Vite, Tailwind, dnd-kit and zustand. The layout model (`src/model`), the compiler (`src/compile`) and the drop geometry (`src/canvas/dropTarget.ts`) are plain functions with their own tests.

## The README is made with mien

`README.md` is compiled from `docs/readme.mien.json` by the same compiler the editor uses. Change the JSON, run `npm run readme`, and commit both; a test fails if they drift apart.

## Adding a widget

A widget is one JSON file in `registry/widgets/`, named after its `id`. No code is needed: the palette, the settings panel and the exported Markdown all come from this file.

```json
{
  "$schema": "../widget.schema.json",
  "id": "my-widget",
  "name": "My Widget",
  "description": "One line shown in the palette tooltip.",
  "category": "stats",
  "author": "your-github-name",
  "homepage": "https://github.com/you/my-widget",
  "urlTemplate": "https://my-widget.example/api?user={username}&theme={theme}&compact={compact}",
  "linkTemplate": "https://github.com/{username}",
  "defaultWidth": 50,
  "aspectRatio": 2.5,
  "params": [
    { "key": "username", "type": "username" },
    { "key": "theme", "type": "enum", "label": "Theme", "default": "auto", "preview": true,
      "options": [{ "value": "auto", "label": "Auto (light/dark)" }, { "value": "ocean", "label": "Ocean" }] },
    { "key": "compact", "type": "boolean", "label": "Compact", "default": false }
  ],
  "theme": { "param": "theme", "light": "default", "dark": "dark" }
}
```

### Fields

| Field | Meaning |
|---|---|
| `urlTemplate` | The image URL. `{key}` is replaced by the URL-encoded value of the param with that `key`. |
| `linkTemplate` | Optional. Where the image links to on GitHub. |
| `category` | Palette section: `header`, `stats`, `skills`, `badges` or `media`. |
| `defaultWidth` | Width when dropped: `20`, `25`, `33`, `50`, `66`, `75`, `100` (percent of the row) or `"auto"` (the image's own size, for badges). |
| `aspectRatio` | Width ÷ height of a typical image; only used to reserve space while it loads. |
| `theme` | Optional. When the user leaves `param` on `auto` (or you don't expose it), the export uses `<picture>` so GitHub shows `light` or `dark` to match the viewer. |

### Param types

| `type` | Control | Notes |
|---|---|---|
| `username` | none | Always the user's GitHub username. |
| `text` | text box | May use `{username}` in its default. |
| `url` | text box | Inserted without encoding; only `http(s):` and `mailto:` are allowed. |
| `enum` | buttons | Needs `options`. With `"preview": true`, each option is shown as the widget itself. An option's `set` can supply other template values (see `social-badge.json`). |
| `multi` | icon grid | Needs `options`; values joined with `separator` (default `,`). `thumbnailTemplate` draws each option. |
| `list` | list of text boxes | Joined with `separator` (default `;`). |
| `boolean` | switch | |
| `number` | slider | `min`, `max`, `step`. |
| `color` | color picker | Hex without `#`. |

Mark a param `"required": true` when the widget can't work without it (a repository name, an image URL). Until it's filled in, the canvas shows a placeholder and the widget is left out of the export.

### Checks

`npm test` validates every file against [`registry/widget.schema.json`](registry/widget.schema.json) and checks that every `{placeholder}` has a param, defaults are valid options, and themed widgets really differ between light and dark. Please also try your widget in the editor in both color modes.

Only add widgets that are free to use and render with nothing but a URL. Widgets that need a GitHub Action in the user's repository can't be set up from here.
