#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

if ! command -v git >/dev/null 2>&1; then
    echo "Error: Git is required to create the AMO source archive." >&2
    exit 1
fi

if [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
    echo "Error: the Git working tree is not clean." >&2
    echo "Commit the AMO build files and all extension changes first." >&2
    git status --short >&2
    exit 1
fi

VERSION="$(node -p "require('./package.json').version")"
COMMIT_SHA="$(git rev-parse --short=12 HEAD)"

mkdir -p build

OUTPUT="build/scu-plus-source-v${VERSION}-${COMMIT_SHA}.zip"
PREFIX="scu-plus-source-v${VERSION}/"

rm -f "${OUTPUT}"

git archive \
    --format=zip \
    --prefix="${PREFIX}" \
    --output="${OUTPUT}" \
    HEAD

echo "AMO source archive created:"
echo "  ${OUTPUT}"

if command -v sha256sum >/dev/null 2>&1; then
    echo
    echo "SHA-256:"
    sha256sum "${OUTPUT}"
fi
