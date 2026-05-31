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
| `src/contents/id-scu.ts` | Content script on `id.scu.edu.cn`. Password-popup bypass, two-factor bypass, and ID portal OCR captcha. |
| `src/contents/zhjw.ts` | **Main content script** on `zhjw.scu.edu.cn`. Dispatches to most feature modules based on URL path. |
| `src/contents/zhjw-login.ts` | Content script on `zhjw.scu.edu.cn/*login*`. Redirects to unified auth (id.scu.edu.cn) when enabled. Runs at `document_start`. |
| `src/contents/acm-scu.ts` | Content script on `acm.scu.edu.cn/teach/`. OCR captcha for the ACM teaching site. |

### Feature Modules (`src/features/`)

Each feature follows an `init*` or `inject*` function pattern. They are pure DOM/JS injection modules — no framework rendering:

- **`homepage/`** — UI beautification (border colors, CSS overrides), daily quote modal, fail-course toggling, custom GPA/fail text, password popup removal. Called unconditionally from `zhjw.ts`.
- **`menu/`** — Injects custom sidebar menu entries (培养方案, 选课通, SCU+ 设置, version check) into the教务 system's `#menus` element.
- **`navbar/`** — Top navbar avatar/name hiding via CSS injection.
- **`score-analysis/`** — GPA calculation, credit-weighted scoring, score distribution charts (Chart.js).
- **`course-score/`** (选课通) — Course rating system with historical data stored in `localStorage`.
- **`course-filter/`** — Custom course selection filters on the选课 page.
- **`course-table/`** — Course table export to image (`@zumer/snapdom`).
- **`course-evaluation/`** — One-click batch teaching evaluation.
- **`enhance-quit-course/`** — Shows course name in the退课 confirmation dialog.
- **`get-hidden-score/`** — Intercepts score table data before the official release date.
- **`scores-per-semester/`** — Per-semester score aggregation view.
- **`redirect-login/`** — Redirects the old教务 login page to unified auth.
- **`ocr/`** — Captcha image detection + OCR submission (id-captcha for unified auth, acm-captcha for ACM site). Sends base64 image to user-configured OCR endpoint.
- **`bypass-two-factor/`** — Intercepts fetch/XHR responses for `/2factor/select` and patches `userTwoFactory: true → false` to skip SMS verification. Monitors both `fetch` and `XMLHttpRequest` globally.

### Shared Code

- **`src/script/config.ts`** — Settings CRUD backed by `@plasmohq/storage`. Returns `SettingItem` with defaults. In-memory cache avoids repeated storage reads.
- **`src/common/types.ts`** — `SettingItem` class (all user-configurable toggles/values with defaults), `CourseData` and `ScoreData` interfaces.
- **`src/constants/actions.ts`** — Message action enum for `chrome.runtime.sendMessage`.
- **`src/constants/menuIds.ts`** — Menu element IDs injected into the教务 sidebar.

### Communication Flow

Content scripts cannot make cross-origin requests directly. Instead they send messages to `background.ts`:

```
content script → chrome.runtime.sendMessage({action: Actions.REQUEST, url, accept})
              → background.ts proxies via fetch()
              → responds with {success, data} or {success: false, error}
```

## Key Patterns

- **Path alias**: `~` → `src/` (e.g., `import { getSetting } from "~script/config"`).
- **Content script config**: Each content script exports `export const config: PlasmoCSConfig = { matches: [...], run_at: ... }`. Plasmo uses this to generate the manifest. Do not use `all_frames: true` unless the feature genuinely needs iframes.
- **Settings are reactive-ish**: The `zhjw.ts` dispatcher reads settings once at page load. Features that need settings call `getSetting()` independently — the same cached instance is returned.
- **Feature toggles**: Most features are gated behind `setting.*Switch` boolean flags. New features should follow the same pattern: add a switch to `SettingItem`, add a form field in `tabs/setting.tsx`, and check it before injecting.
- **No framework in content scripts**: Content script DOM manipulation is vanilla JS — no React rendering (React is only used in `popup.tsx` and `tabs/setting.tsx`).
