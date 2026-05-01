#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOG_FILE="${RUN_LOG_FILE:-}"

set +e
node "${REPO_ROOT}/express/dist/src/server.js"
exit_code=$?
set -e

# Requirement: clear the current run log file when the server process exits.
if [[ -n "${LOG_FILE}" ]]; then
    : > "${LOG_FILE}" || true
fi

exit "${exit_code}"
