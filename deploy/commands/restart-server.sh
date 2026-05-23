#!/bin/bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log_info "Restarting server..."
"${SCRIPT_DIR}/stop-server.sh"
"${SCRIPT_DIR}/start-server.sh"
log_info "Server restarted successfully."
