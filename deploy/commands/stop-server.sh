#!/bin/bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"

log_phase "Stopping Server"

if pm2 stop all >/dev/null 2>&1; then
    pm2 delete all >/dev/null 2>&1 || true
    log_success "Stopped existing pm2 processes"
else
    log_info "No running pm2 processes to stop"
fi

exit "${EXIT_SUCCESS}"
