#!/bin/bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"

projects=("$@")

if [[ ${#projects[@]} -eq 0 ]]; then
    # Auto-detect based on the most recent pull/HEAD change.
    auto_detected="$("${SCRIPT_DIR}/detect-changes.sh")"
    if [[ -z "${auto_detected}" ]]; then
        log_info "No changes detected in web/ or express/"
        exit "${EXIT_SUCCESS}"
    fi
    # shellcheck disable=SC2206
    projects=(${auto_detected})
fi

log_phase "Building Changed Projects"

for project in "${projects[@]}"; do
    if [[ ! -d "${REPO_ROOT}/${project}" ]]; then
        log_error "Project directory not found: ${REPO_ROOT}/${project}"
        exit "${EXIT_BUILD_FAILED}"
    fi

    log_detail "Building ${project}/..."
    if ! (cd "${REPO_ROOT}/${project}" && npm run build); then
        log_error "${project}/ build failed"
        exit "${EXIT_BUILD_FAILED}"
    fi
    log_success "${project}/ build completed"
done

exit "${EXIT_SUCCESS}"
