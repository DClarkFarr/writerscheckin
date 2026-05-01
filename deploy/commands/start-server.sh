#!/bin/bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"

log_phase "Starting Server"

LOG_DIR="${REPO_ROOT}/deploy/logs"
LOG_FILE="${LOG_DIR}/$(date '+%Y-%m-%d')-wci-server.log"

mkdir -p "${LOG_DIR}"

{
    echo ""
    echo "[========== Server Start Attempt ==========]"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting wci-server via PM2"
    echo "Log file: ${LOG_FILE}"
    echo "Command: pm2 start ${REPO_ROOT}/express/dist/src/server.js --name wci-server"
    echo "[========================================]"
} >> "${LOG_FILE}"

if ! pm2 start "${REPO_ROOT}/express/dist/src/server.js" \
    --name "wci-server" \
    --cwd "${REPO_ROOT}/express" \
    --instances 1 \
    --max-restarts 10 \
    --watch false \
    --time \
    --merge-logs \
    --output "${LOG_FILE}" \
    --error "${LOG_FILE}" >> "${LOG_FILE}" 2>&1; then
    log_error "Server start failed"
    log_info "Server log file: ${LOG_FILE}"
    log_info "Last 80 lines of the server log:"
    tail -n 80 "${LOG_FILE}" >&2 || true
    exit "${EXIT_RESTART_FAILED}"
fi

log_success "Server started successfully"
log_info "Server log file: ${LOG_FILE}"
exit "${EXIT_SUCCESS}"
