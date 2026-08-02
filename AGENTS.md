# Repository Guide

## Toolchain

- This is a Plasmo 0.90.5 browser extension. Plasmo generates manifests and registers content scripts; extension metadata belongs in `package.json` under `manifest`, not in a hand-written manifest.
- Use Node.js `>=22.13 <23` and pnpm 11.18.0. Install dependencies with `pnpm install --frozen-lockfile`; `pnpm-workspace.yaml` explicitly allows the native dependency build scripts Plasmo needs.
- Use `pnpm dev` for hot reload, `pnpm build` for the Chromium production build, and `pnpm build:firefox:amo` for the reproducible Firefox MV3 ZIP.
- There are no repository test, lint, or typecheck scripts. A production build is the main executable verification.
- Keep `tsconfig.json` extending `./node_modules/plasmo/templates/tsconfig.base.json`. The package-style path works in `tsc` but fails in Plasmo's older Parcel resolver under pnpm 11, producing misleading random local-import errors.
- `.plasmo/`, `.parcel-cache/`, and `build/` are generated and ignored; do not edit or submit them as source.

## Extension Wiring

- Plasmo entry points are `src/background.ts`, `src/popup.tsx`, `src/options.tsx`, and `src/contents/*`. `src/contents/zhjw.ts` is the main URL dispatcher and runs in all frames, so every added feature must retain explicit page/frame guards.
- Most `src/features/*` modules inject vanilla DOM/CSS. Keep that pattern unless integrating with an existing React-rendered feature; React is native only in the popup/settings pages and a few established feature roots.
- Cross-origin requests from content scripts go through `Actions.REQUEST` in `src/background.ts`; same-origin requests use `fetch` directly. Captcha OCR is intentionally fully local and must not acquire a network dependency.
- A new setting normally requires all three connections: a default/property in `src/common/types.ts`, a control in `src/tabs/setting.tsx`, and a dispatcher/injection guard. `getSetting()` is cached by `src/script/config.ts`.
- Theme-sensitive injected UI must use `var(--scu-*, fallback)`. `src/contents/zhjw-beautify.ts` runs at `document_start` and mirrors theme settings in localStorage to avoid first-paint flashes.
- The `~` alias resolves to `src/`.

## AMO Packaging

- `AMO_BUILD.md` is the reviewer-facing source of truth. Keep it aligned with Node `>=22.13 <23`, pnpm 11.18.0, CI, and `scripts/build-firefox-amo.sh`.
- The Firefox build script deliberately cleans prior output and reinstalls from `pnpm-lock.yaml`; its submitted binary is `build/firefox-mv3-prod.zip`.
- `pnpm package:amo-source` refuses any tracked or untracked worktree changes and archives committed `HEAD`. Run it only after the intended changes are committed; its output is `build/scu-plus-source-v<version>-<commit>.zip`.
