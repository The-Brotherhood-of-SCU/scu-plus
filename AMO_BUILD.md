# SCU-Plus Firefox Add-on Build Instructions

This document describes how to reproduce the Firefox add-on package submitted to Mozilla Add-ons.

## 1. Build environment

The submitted add-on is built with the following environment:

* Operating system: Ubuntu 24.04 LTS or a compatible Linux distribution
* CPU architecture: x86_64 or ARM64
* Node.js: 24.14.0
* npm: 11.9.0 or later
* pnpm: 11.18.0
* Plasmo: 0.90.5, installed from `pnpm-lock.yaml`

No proprietary or web-based build tools are required.

The build downloads dependencies only through the official npm registry. No private package registry, API key, account, or environment variable is required.

## 2. Install the required tools

Node.js 24.14.0 is available in Mozilla's default reviewer environment.

Verify the installed Node.js version:

```bash
node --version
```

The expected output is:

```text
v24.14.0
```

Install the required pnpm version through npm:

```bash
npm install --global pnpm@11.18.0
```

Verify the pnpm version:

```bash
pnpm --version
```

The expected output is:

```text
11.18.0
```

## 3. Build the Firefox extension

Open a terminal in the root directory of the submitted source code and run:

```bash
chmod +x scripts/build-firefox-amo.sh
./scripts/build-firefox-amo.sh
```

The script performs the following operations:

1. Verifies the Node.js and pnpm versions.
2. Removes previous Plasmo build artifacts.
3. Installs the exact dependency versions recorded in `pnpm-lock.yaml`.
4. Builds the production Firefox Manifest V3 extension.
5. Creates the Firefox ZIP package.

The equivalent manual commands are:

```bash
rm -rf build .plasmo
pnpm install --frozen-lockfile
pnpm build --zip --target=firefox-mv3
```

## 4. Build output

The unpacked production extension is generated at:

```text
build/firefox-mv3-prod/
```

The packaged extension is generated at:

```text
build/firefox-mv3-prod.zip
```

The file `build/firefox-mv3-prod.zip` is the add-on package submitted to Mozilla Add-ons.

## 5. Source code structure

The submitted source archive contains the original, ungenerated project files, including:

```text
assets/
src/
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
tsconfig.json
AMO_BUILD.md
scripts/build-firefox-amo.sh
```

The source archive intentionally excludes generated or downloaded files, including:

```text
node_modules/
build/
.plasmo/
.parcel-cache/
```

All first-party TypeScript, TSX, JavaScript, CSS, HTML, configuration files, and static assets required to reproduce the extension are included.

## 6. Important notes

Do not run the development command when reproducing the submitted package:

```text
pnpm dev
```

The submitted package must be generated using the production command:

```bash
pnpm build --zip --target=firefox-mv3
```

No generated files from a previous build are required. The build script deletes previous build output before starting.
