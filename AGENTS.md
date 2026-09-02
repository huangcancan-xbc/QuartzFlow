# Repository Guidelines

## Project Structure & Module Organization

QuartzFlow is a modular CSS theme for Obsidian. Edit source modules under `src/`; numeric prefixes define build order. Shared values belong in `02-tokens/`, Obsidian variable mappings in `03-core/`, document styles in `04-editor/`, application chrome in `05-app/`, reusable UI in `06-components/`, and opt-in visual behavior in `08-features/`. Keep final compatibility overrides in `99-safeguards.css`.

`build.mjs` concatenates these modules and embeds OFL-licensed fonts from `QuartzFlow/fonts/`. The installable package lives in `QuartzFlow/`. Its `theme.css` is generated and tracked for releases; never edit it directly. Store repository artwork in `assets/`.

## Build, Test, and Development Commands

- `npm run build` regenerates `QuartzFlow/theme.css`.
- `npm run dev` watches `src/` and rebuilds on change.
- `npm run audit` checks CSS structure, paths, font references, and release risks.
- `npm run check` builds and runs the full static audit.
- `npm run deploy -- --vault="<vault-path>"` copies the built stylesheet into a test vault.

Run `npm run check` and `git diff --check` before committing.

## Coding Style & Naming Conventions

Use two-space indentation and kebab-case filenames/custom properties. Prefer existing `--quartzflow-*` tokens and Obsidian CSS variables over hard-coded component values. Scope selectors to the smallest relevant surface. Avoid dependencies, remote assets, speculative abstractions, and `!important` unless Obsidian specificity makes it necessary.

## Testing Guidelines

There is no automated visual test suite. Manually verify light and dark modes in Obsidian 1.12 or newer. Check reading view, Live Preview, source mode, and every affected panel. Exercise hover, focus, active, drag, nested, and reduced-motion states where relevant. Include before/after screenshots for visual pull requests.

## Commit, Pull Request & Release Guidelines

Follow the existing concise Chinese scope-first commit style, such as `文件栏：优化嵌套拖放目标反馈`. Keep commits focused. Pull requests must describe user-visible changes, tested OS/Obsidian versions, related issues, and screenshots. Commit the rebuilt stylesheet with source changes.

For releases, keep the manifest version and Git tag identical, then attach `QuartzFlow/manifest.json` and `QuartzFlow/theme.css` to the GitHub Release.

## Security & Licensing

Keep local vault paths in ignored `.vault` files. Never commit personal vault content, machine-specific paths, remote font URLs, or `app://` references. Preserve the MIT attribution and bundled-font notices in `LICENSE` and `QuartzFlow/fonts/OFL-1.1.txt`.
