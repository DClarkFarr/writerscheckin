#!/bin/bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"

before_commit=""
after_commit="HEAD"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --before)
            before_commit="${2:-}"
            shift 2
            ;;
        --after)
            after_commit="${2:-HEAD}"
            shift 2
            ;;
        *)
            echo "Usage: $0 [--before <sha>] [--after <sha>]" >&2
            exit "${EXIT_PRECHECK_FAILED}"
            ;;
    esac
done

if [[ -z "${before_commit}" ]]; then
    before_commit=$(git rev-parse HEAD@{1} 2>/dev/null || git rev-parse HEAD)
fi

changed_projects=$(detect_changed_projects "${before_commit}" "${after_commit}" "${REPO_ROOT}")

echo "${changed_projects}"
exit "${EXIT_SUCCESS}"
