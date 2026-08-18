# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development

```bash
plasmo dev        # Start dev server with hot reload
plasmo build      # Production build → build/chrome-mv3-prod/
plasmo package    # Package for distribution
```

This is a **Plasmo** browser extension (v0.90.5). Plasmo handles the manifest generation, content script registration, and build pipeline. Do not edit the manifest directly — configuration lives in `package.json` under `"manifest"`.

## Architecture

### Entry Points (Plasmo conventions)

| File | Role |
|------|------|
| `src/background.ts` | Service worker. Proxies cross-origin fetches from content scripts (via `Actions.REQUEST`), manages avatar image redirect rules via `declarativeNetRequest`, and opens the settings page. |
| `src/popup.tsx` | Browser action popup (React). Quick links to login, settings, and version check. |
| `src/options.tsx` | Thin wrapper — delegates entirely to `src/setting.tsx`. |
| `src/contents/id-scu.ts` | Content script on `id.scu.edu.cn`. Password-modify-page redirect (SPA-aware via history monkey-patching + MutationObserver), and ID portal OCR captcha. |
| `src/contents/zhjw.ts` | **Main content script** on `zhjw.scu.edu.cn`. Dispatches to most feature modules based on URL path. |
| `src/contents/zhjw-beautify.ts` | Injects the magazine theme at `document_start` (before first paint) to avoid a flash of the original styles. Reads a localStorage mirror of `beautifySwitch`/`beautifyColor`/`beautifyDarkMode` synchronously, then reconciles with real settings and watches for changes. |
| `src/contents/zhjw-login.ts` | Content script on `zhjw.scu.edu.cn/*login*`. Redirects to unified auth (id.scu.edu.cn) when enabled. Runs at `document_start`. |

### Feature Modules (`src/features/`)

Each feature follows an `init*` or `inject*` function pattern. They are pure DOM/JS injection modules — no framework rendering:

- **`homepage/`** — UI beautification (border colors, CSS overrides), daily quote modal, fail-course toggling, custom GPA/fail text, password popup removal. Called unconditionally from `zhjw.ts`.
- **`beautify/`** — The magazine theme itself. `theme.ts` holds the full CSS (all colors as `--scu-*` variables, with a `:root[data-scu-theme="dark"]` override block for dark mode); `index.ts` injects/removes it and resolves the dark mode setting (`beautifyDarkMode`: `"auto"` follows the OS via `matchMedia` listener, `"light"`, `"dark"`), setting `data-scu-theme` on `<html>` and brightening the user accent in dark mode. It also pins a concrete `background-color` inline on `<html>` (`!important`) so pages whose body is shorter than the viewport never show a white canvas; `palette.ts` is the shared palette/mode-resolution module also used by `popup.tsx` and `setting.tsx` (both support dark mode too). Injected UI in other features should use `var(--scu-*, fallback)` so it adapts automatically. The three beautify settings (switch/color/dark mode) are persisted immediately on change in the settings page — they don't wait for the 保存 button.
- **`menu/`** — Injects custom sidebar menu entries (SCU+ 设置, version check) into the教务 system's `#menus` element.
- **`navbar/`** — Top navbar avatar/name hiding via CSS injection.
- **`score-analysis/`** — GPA calculation, credit-weighted scoring, score distribution charts (Chart.js).
- **`course-filter/`** — Custom course selection filters on the选课 page.
- **`course-table/`** — Course table export to image (`@zumer/snapdom`).
- **`course-evaluation/`** — One-click batch teaching evaluation.
- **`enhance-quit-course/`** — Shows course name in the退课 confirmation dialog.
- **`scores-per-semester/`** — Per-semester score aggregation view.
- **`redirect-login/`** — Redirects the old教务 login page to unified auth.
- **`ocr/`** — Fully-local captcha OCR. **Unified auth (id-captcha)**: `model.ts` + `local-ocr.ts` load `assets/model_centroid.json` (traditional CV / centroid template matching, no CNN) and preprocess the captcha `<img>` through a canvas (top-left 80×26 crop, or upscale if smaller); low-confidence results return an empty string so the caller refreshes the captcha. **zhjw login (zhjw-captcha-ocr)**: `zhjw-ocr-adapter.ts` wraps the external OCR package `@scu-plus/zhjw-captcha-ocr` (CNN engine + `.scuocr` weights in a separate repo, pulled via pinned GitHub dependency, still fully on-device inference); `zhjw-captcha-ocr.ts` handles the DOM integration (locate captcha img/input, auto-fill, retry on mismatch).
- **`schedule/`** — Fetches the academic calendar (校历) from `jwc.scu.edu.cn/cdxl.htm` via background proxy and injects it into the top navbar.

### Shared Code

- **`src/script/config.ts`** — Settings CRUD backed by `@plasmohq/storage`. Returns `SettingItem` with defaults. In-memory cache avoids repeated storage reads. Also re-exports `SettingItem` for convenience (features can `import { getSetting, SettingItem } from "~script/config"`).
- **`src/script/utils.ts`** — Shared DOM helpers (`$`, `$all`, `xpath_query`), daily quote fetcher, version checker, course-table image download, and misc utilities (`sleep`, `randomInt`).
- **`src/common/index.ts`** — Re-exports from `utils.ts` + adds a `waitForElement()` helper. Most features import from `~common` rather than `~script/utils` directly.
- **`src/common/types.ts`** — `SettingItem` class (all user-configurable toggles/values with defaults), `CourseData` and `ScoreData` interfaces.
- **`src/constants/actions.ts`** — Message action enum for `chrome.runtime.sendMessage`.
- **`src/constants/menuIds.ts`** — Menu element IDs injected into the教务 sidebar.

### Communication Flow

Content scripts cannot make cross-origin requests directly (except to origins the user has granted optional host permissions for). Most cross-origin fetches go through the background proxy:

```
content script → chrome.runtime.sendMessage({action: Actions.REQUEST, url, accept})
              → background.ts proxies via fetch()
              → responds with {success, data} or {success: false, error}
```

Same-origin fetches (e.g., a feature fetching its own data from `zhjw.scu.edu.cn`) also use `fetch()` directly — no proxy needed.

**Exception — OCR**: The captcha OCR runs fully on-device (unified-auth template matching + the external zhjw OCR package, both local inference), so it needs neither the proxy nor extra host permissions.

## Key Patterns

- **Path alias**: `~` → `src/` (e.g., `import { getSetting } from "~script/config"`).
- **Content script config**: Each content script exports `export const config: PlasmoCSConfig = { matches: [...], run_at: ... }`. Plasmo uses this to generate the manifest. `zhjw.ts` uses `all_frames: true` because the教务 system serves many sub-pages inside iframes — features guard themselves with URL path checks to avoid running in unintended frames. Only use `all_frames: true` if the target site genuinely uses iframes for its main content.
- **Settings are reactive-ish**: The `zhjw.ts` dispatcher reads settings once at page load. Features that need settings call `getSetting()` independently — the same cached instance is returned.
- **Feature toggles**: Most features are gated behind `setting.*Switch` boolean flags. New features should follow the same pattern: add a switch to `SettingItem`, add a form field in `setting.tsx`, and check it before injecting.
- **No framework in content scripts** (with exceptions): Most content script DOM manipulation is vanilla JS — no React rendering. However, a few features (e.g., `course-evaluation`) use `ReactDOM.createRoot()` to render React components into manually-created DOM containers within the host page. The popup and settings pages use React natively via Plasmo.
- **Settings import/export**: The settings page supports exporting settings as a JSON file and importing via drag-and-drop of a JSON file onto the settings form. This is handled in `setting.tsx` with `FileReader` and `JSON.parse`.
- **Version check**: The popup checks for updates via the GitHub Releases API (`api.github.com/repos/.../releases/latest`, configured in `package.json` → `checkForUpdateLink`) through the background proxy. The release's zip asset download URL is prefixed with `downloadProxyPrefix` (gh-proxy.org) for faster downloads in China. Version comparison is in `script/utils.ts` → `checkVersion()`, which returns an `UpdateCheckInfo` (result enum + latest version + download URL).
