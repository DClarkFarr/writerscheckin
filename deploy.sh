#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${SCRIPT_DIR}"
COMMAND_DIR="${REPO_ROOT}/deploy/commands"

source "${COMMAND_DIR}/common.sh"

run_command() {
    local command_path="$1"
    shift || true
    "${command_path}" "$@"
}

main() {
    local start_time
    start_time=$(date +%s)

    log_info "Starting deployment..."
    log_info "Repository root: ${REPO_ROOT}"
    log_info ""

    run_command "${COMMAND_DIR}/precheck.sh"

    local before_commit
    before_commit=$(git rev-parse HEAD)

    run_command "${COMMAND_DIR}/pull.sh"

    local after_commit
    after_commit=$(git rev-parse HEAD)

    local changed_projects
    changed_projects=$("${COMMAND_DIR}/detect-changes.sh" --before "${before_commit}" --after "${after_commit}")

    if [[ -z "${changed_projects}" ]]; then
        log_info "No changes detected in web/ or express/"
        local no_change_end
        no_change_end=$(date +%s)
        log_summary "true" "$(calculate_duration "${start_time}" "${no_change_end}")"
        return "${EXIT_SUCCESS}"
    fi

    log_success "Detected changes in: ${changed_projects}"
    # shellcheck disable=SC2086
    run_command "${COMMAND_DIR}/build-projects.sh" ${changed_projects}
    run_command "${COMMAND_DIR}/restart-server.sh"

    local end_time
    end_time=$(date +%s)
    log_summary "true" "$(calculate_duration "${start_time}" "${end_time}")"
}

trap 'log_error "Deployment interrupted"; exit "${EXIT_PRECHECK_FAILED}"' INT TERM

main "$@"
