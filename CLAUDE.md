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
| `src/options.tsx` | Thin wrapper — delegates entirely to `src/tabs/setting.tsx`. |
| `src/contents/id-scu.ts` | Content script on `id.scu.edu.cn`. Password-modify-page redirect (SPA-aware via history monkey-patching + MutationObserver), and ID portal OCR captcha. |
| `src/contents/zhjw.ts` | **Main content script** on `zhjw.scu.edu.cn`. Dispatches to most feature modules based on URL path. |
| `src/contents/zhjw-beautify.ts` | Injects the magazine theme at `document_start` (before first paint) to avoid a flash of the original styles. Reads a localStorage mirror of `beautifySwitch`/`beautifyColor` synchronously, then reconciles with real settings and watches for changes. |
| `src/contents/zhjw-login.ts` | Content script on `zhjw.scu.edu.cn/*login*`. Redirects to unified auth (id.scu.edu.cn) when enabled. Runs at `document_start`. |
| `src/contents/acm-scu.ts` | Content script on `acm.scu.edu.cn/teach/`. OCR captcha for the ACM teaching site. |

### Feature Modules (`src/features/`)

Each feature follows an `init*` or `inject*` function pattern. They are pure DOM/JS injection modules — no framework rendering:

- **`homepage/`** — UI beautification (border colors, CSS overrides), daily quote modal, fail-course toggling, custom GPA/fail text, password popup removal. Called unconditionally from `zhjw.ts`.
- **`menu/`** — Injects custom sidebar menu entries (SCU+ 设置, version check) into the教务 system's `#menus` element.
- **`navbar/`** — Top navbar avatar/name hiding via CSS injection.
- **`score-analysis/`** — GPA calculation, credit-weighted scoring, score distribution charts (Chart.js).
- **`course-filter/`** — Custom course selection filters on the选课 page.
- **`course-table/`** — Course table export to image (`@zumer/snapdom`).
- **`course-evaluation/`** — One-click batch teaching evaluation.
- **`enhance-quit-course/`** — Shows course name in the退课 confirmation dialog.
- **`get-hidden-score/`** — Intercepts score table data before the official release date.
- **`scores-per-semester/`** — Per-semester score aggregation view.
- **`redirect-login/`** — Redirects the old教务 login page to unified auth.
- **`ocr/`** — Captcha image detection + OCR submission (id-captcha for unified auth, acm-captcha for ACM site). Sends base64 image to user-configured OCR endpoint.
- **`schedule/`** — Fetches the academic calendar (校历) from `jwc.scu.edu.cn/cdxl.htm` via background proxy and injects it into the top navbar.

### Shared Code

- **`src/script/config.ts`** — Settings CRUD backed by `@plasmohq/storage`. Returns `SettingItem` with defaults. In-memory cache avoids repeated storage reads. Also re-exports `SettingItem` for convenience (features can `import { getSetting, SettingItem } from "~script/config"`).
- **`src/script/utils.ts`** — Shared DOM helpers (`$`, `$all`, `xpath_query`), daily quote fetcher, version checker, course-table image download, and misc utilities (`sleep`, `randomInt`).
- **`src/script/ocr_external.ts`** — Converts an `<img>` element to base64 via canvas, POSTs to the user-configured OCR endpoint, and returns the recognized text. Called directly by OCR features (uses `fetch()` directly — see Communication Flow below).
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

**Exception — OCR**: The OCR feature calls `fetch()` directly from the content script because the user grants optional host permissions (`chrome.permissions.request`) for their OCR provider endpoint. The settings page (`tabs/setting.tsx`) has a `checkAndRequestPermission()` helper that handles this flow. Same-origin fetches (e.g., `get-hidden-score` fetching from `zhjw.scu.edu.cn`) also use `fetch()` directly — no proxy needed.

## Key Patterns

- **Path alias**: `~` → `src/` (e.g., `import { getSetting } from "~script/config"`).
- **Content script config**: Each content script exports `export const config: PlasmoCSConfig = { matches: [...], run_at: ... }`. Plasmo uses this to generate the manifest. `zhjw.ts` uses `all_frames: true` because the教务 system serves many sub-pages inside iframes — features guard themselves with URL path checks to avoid running in unintended frames. Only use `all_frames: true` if the target site genuinely uses iframes for its main content.
- **Settings are reactive-ish**: The `zhjw.ts` dispatcher reads settings once at page load. Features that need settings call `getSetting()` independently — the same cached instance is returned.
- **Feature toggles**: Most features are gated behind `setting.*Switch` boolean flags. New features should follow the same pattern: add a switch to `SettingItem`, add a form field in `tabs/setting.tsx`, and check it before injecting.
- **No framework in content scripts** (with exceptions): Most content script DOM manipulation is vanilla JS — no React rendering. However, a few features (`course-evaluation`, `get-hidden-score`) use `ReactDOM.createRoot()` to render React components into manually-created DOM containers within the host page. The popup and settings pages use React natively via Plasmo.
- **Settings import/export**: The settings page supports exporting settings as a JSON file and importing via drag-and-drop of a JSON file onto the settings form. This is handled in `tabs/setting.tsx` with `FileReader` and `JSON.parse`.
- **Version check**: The popup checks for updates via the GitHub Releases API (`api.github.com/repos/.../releases/latest`, configured in `package.json` → `checkForUpdateLink`) through the background proxy. The release's zip asset download URL is prefixed with `downloadProxyPrefix` (gh-proxy.org) for faster downloads in China. Version comparison is in `script/utils.ts` → `checkVersion()`, which returns an `UpdateCheckInfo` (result enum + latest version + download URL).
