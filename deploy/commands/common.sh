#!/bin/bash

# Shared bootstrap for deploy command scripts.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DEPLOY_DIR="${REPO_ROOT}/deploy"
LIB_DIR="${DEPLOY_DIR}/lib"

EXIT_SUCCESS=0
EXIT_PRECHECK_FAILED=1
EXIT_GIT_FAILED=2
EXIT_BUILD_FAILED=3
EXIT_RESTART_FAILED=4

if [[ ! -f "${LIB_DIR}/colors.sh" ]]; then
    echo "Error: Missing ${LIB_DIR}/colors.sh" >&2
    exit "${EXIT_PRECHECK_FAILED}"
fi

if [[ ! -f "${LIB_DIR}/logging.sh" ]]; then
    echo "Error: Missing ${LIB_DIR}/logging.sh" >&2
    exit "${EXIT_PRECHECK_FAILED}"
fi

if [[ ! -f "${LIB_DIR}/git.sh" ]]; then
    echo "Error: Missing ${LIB_DIR}/git.sh" >&2
    exit "${EXIT_PRECHECK_FAILED}"
fi

source "${LIB_DIR}/colors.sh"
source "${LIB_DIR}/logging.sh"
source "${LIB_DIR}/git.sh"
