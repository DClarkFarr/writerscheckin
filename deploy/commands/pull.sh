#!/bin/bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"

log_phase "Pulling Latest Changes from Origin"

if ! output=$(git pull origin 2>&1); then
    echo "${output}" >&2
    log_error "Git pull failed"
    exit "${EXIT_GIT_FAILED}"
fi

if [[ -n "${output}" ]]; then
    echo "${output}"
fi

log_success "Git pull completed"
exit "${EXIT_SUCCESS}"
