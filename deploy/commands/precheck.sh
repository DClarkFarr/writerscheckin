#!/bin/bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"

all_ok=true

log_phase "Pre-Deployment Checks"

if ! command -v git >/dev/null 2>&1; then
    log_error "git is not installed"
    all_ok=false
else
    log_success "git is installed"
fi

if ! command -v npm >/dev/null 2>&1; then
    log_error "npm is not installed"
    all_ok=false
else
    log_success "npm is installed"
fi

if ! command -v pm2 >/dev/null 2>&1; then
    log_error "pm2 is not installed. Install with: npm install -g pm2"
    all_ok=false
else
    log_success "pm2 is installed"
fi

if ! is_valid_git_repo; then
    log_error "Not in a valid git repository"
    all_ok=false
else
    log_success "Valid git repository detected"
fi

if ! check_working_directory_clean; then
    log_error "Working directory has uncommitted changes. Please commit or stash them first."
    all_ok=false
else
    log_success "Working directory is clean"
fi

if [[ "${all_ok}" == "false" ]]; then
    exit "${EXIT_PRECHECK_FAILED}"
fi

exit "${EXIT_SUCCESS}"
