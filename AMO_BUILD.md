# Reproducible Firefox AMO Build

SCU-Plus is built with Plasmo, TypeScript, React, and pnpm. These instructions reproduce the Firefox Manifest V3 extension on Linux.

## Requirements

* Ubuntu 24.04 LTS or a compatible Linux distribution
* Node.js 22.x, version 22.13.0 or newer (any compatible 22.x patch release)
* pnpm 11.18.0 exactly
* Plasmo 0.90.5, as locked by `pnpm-lock.yaml`

The build requires no private npm registry, API key, account, or proprietary build tool. Dependencies come from the public npm registry, except `@scu-plus/zhjw-captcha-ocr`, which is fetched from GitHub (pinned commit) during `pnpm install` and compiled by its `prepare` script (this needs network access to GitHub at install time).

Install the required pnpm version with npm:

```bash
npm install --global pnpm@11.18.0
```

Confirm the tool versions before building:

```bash
node --version
pnpm --version
```

The Node.js version must satisfy `>=22.13 <23` and the pnpm output must be `11.18.0`.

## Build

From the root of the source archive, run the complete build command:

```bash
chmod +x scripts/build-firefox-amo.sh
./scripts/build-firefox-amo.sh
```

The equivalent manual build commands are:

```bash
rm -rf build .plasmo .parcel-cache
pnpm install --frozen-lockfile
pnpm build --zip --target=firefox-mv3
```

The build produces:

```text
build/firefox-mv3-prod/
build/firefox-mv3-prod.zip
```

`build/firefox-mv3-prod.zip` is the extension package submitted to Mozilla Add-ons.

## Source Archive

The source archive submitted to Mozilla must include at least:

```text
src/
assets/
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
tsconfig.json
AMO_BUILD.md
scripts/build-firefox-amo.sh
scripts/package-amo-source.sh
```

It must not include downloaded dependencies, generated output, or caches:

```text
node_modules/
build/
.plasmo/
.parcel-cache/
```

After committing all intended source changes, create the source archive from a clean Git worktree with:

```bash
pnpm package:amo-source
```

This writes `build/scu-plus-source-v<version>-<commit>.zip` with a single `scu-plus-source-v<version>/` top-level directory. The packaging script intentionally refuses to run when tracked changes or untracked files are present, because it archives the committed `HEAD` revision with `git archive`.
