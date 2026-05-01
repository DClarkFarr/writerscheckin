#!/bin/bash

################################################################################
# deploy/lib/logging.sh - Timestamped logging functions
#
# Provides structured output with timestamps and status indicators
#
################################################################################

# Source colors if available
if [[ -f "$(dirname "${BASH_SOURCE[0]}")/colors.sh" ]]; then
    source "$(dirname "${BASH_SOURCE[0]}")/colors.sh"
fi

################################################################################
# Logging Functions
################################################################################

# Get current timestamp in HH:MM:SS format
_get_timestamp() {
    date '+%H:%M:%S'
}

# Log info message with timestamp
log_info() {
    local message="$1"
    local timestamp=$(_get_timestamp)
    echo "[${timestamp}] ${message}"
}

# Log success message with checkmark
log_success() {
    local message="$1"
    local timestamp=$(_get_timestamp)
    echo -e "[${timestamp}] ${GREEN}✓${RESET} ${message}"
}

# Log error message with cross mark
log_error() {
    local message="$1"
    local timestamp=$(_get_timestamp)
    echo -e "[${timestamp}] ${RED}❌ Error: ${message}${RESET}" >&2
}

# Log phase header
log_phase() {
    local phase_name="$1"
    local timestamp=$(_get_timestamp)
    echo ""
    echo -e "[${timestamp}] ${BLUE}→${RESET} Phase: ${phase_name}"
}

# Log warning message
log_warn() {
    local message="$1"
    local timestamp=$(_get_timestamp)
    echo -e "[${timestamp}] ${YELLOW}⚠${RESET}  ${message}"
}

# Calculate duration between two timestamps
calculate_duration() {
    local start_seconds="$1"
    local end_seconds="$2"
    local duration=$((end_seconds - start_seconds))
    
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    
    if [[ $minutes -gt 0 ]]; then
        printf "%dm %ds" "$minutes" "$seconds"
    else
        printf "%ds" "$seconds"
    fi
}

# Log final summary
log_summary() {
    local success="$1"
    local duration="$2"
    local timestamp=$(_get_timestamp)
    
    if [[ "$success" == "true" ]]; then
        echo ""
        echo -e "[${timestamp}] ${GREEN}✅ Deployment completed successfully in ${duration}${RESET}"
    else
        echo ""
        echo -e "[${timestamp}] ${RED}❌ Deployment failed${RESET}"
    fi
}

# Log detailed message (for build output, etc.)
log_detail() {
    local message="$1"
    local timestamp=$(_get_timestamp)
    echo -e "[${timestamp}] ${CYAN}→${RESET}  ${message}"
}
