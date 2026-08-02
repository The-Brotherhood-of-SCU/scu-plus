#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

EXPECTED_NODE_MAJOR="22"
MINIMUM_NODE_MINOR="13"
EXPECTED_PNPM_VERSION="11.18.0"

echo "SCU-Plus Firefox AMO build"
echo "Project directory: ${ROOT_DIR}"

if ! command -v node >/dev/null 2>&1; then
    echo "Error: Node.js is not installed." >&2
    exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
    echo "Error: pnpm is not installed." >&2
    echo "Install it with:" >&2
    echo "  npm install --global pnpm@${EXPECTED_PNPM_VERSION}" >&2
    exit 1
fi

ACTUAL_NODE_VERSION="$(node --version)"
IFS=. read -r ACTUAL_NODE_MAJOR ACTUAL_NODE_MINOR _ <<< "${ACTUAL_NODE_VERSION#v}"

echo "Node.js: ${ACTUAL_NODE_VERSION}"

if [[ "${ACTUAL_NODE_MAJOR}" != "${EXPECTED_NODE_MAJOR}" ]] || (( ACTUAL_NODE_MINOR < MINIMUM_NODE_MINOR )); then
    echo "Error: Node.js >=22.13 <23 is required; got ${ACTUAL_NODE_VERSION}." >&2
    exit 1
fi

ACTUAL_PNPM_VERSION="$(pnpm --version)"
echo "pnpm:    ${ACTUAL_PNPM_VERSION}"

if [[ "${ACTUAL_PNPM_VERSION}" != "${EXPECTED_PNPM_VERSION}" ]]; then
    echo "Error: expected pnpm ${EXPECTED_PNPM_VERSION}, got ${ACTUAL_PNPM_VERSION}." >&2
    exit 1
fi

if [[ ! -f "package.json" || ! -f "pnpm-lock.yaml" ]]; then
    echo "Error: package.json or pnpm-lock.yaml is missing." >&2
    exit 1
fi

export CI=1
export NODE_ENV=production
export TZ=UTC
export LANG=C.UTF-8
export LC_ALL=C.UTF-8

echo "Removing previous build artifacts..."
rm -rf build .plasmo .parcel-cache

echo "Installing locked dependencies..."
pnpm install --frozen-lockfile

echo "Building Firefox Manifest V3 extension..."
pnpm build --zip --target=firefox-mv3

OUTPUT_DIRECTORY="build/firefox-mv3-prod"
OUTPUT_ARCHIVE="build/firefox-mv3-prod.zip"

if [[ ! -d "${OUTPUT_DIRECTORY}" ]]; then
    echo "Error: expected output directory was not generated:" >&2
    echo "  ${OUTPUT_DIRECTORY}" >&2
    exit 1
fi

if [[ ! -f "${OUTPUT_ARCHIVE}" ]]; then
    echo "Error: expected Firefox ZIP was not generated:" >&2
    echo "  ${OUTPUT_ARCHIVE}" >&2
    exit 1
fi

echo
echo "Build completed successfully."
echo "Unpacked extension: ${OUTPUT_DIRECTORY}"
echo "Extension archive:  ${OUTPUT_ARCHIVE}"

if command -v sha256sum >/dev/null 2>&1; then
    echo
    echo "SHA-256:"
    sha256sum "${OUTPUT_ARCHIVE}"
fi
