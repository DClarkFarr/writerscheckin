#!/bin/bash

################################################################################
# deploy/lib/colors.sh - Terminal color utilities
#
# Provides ANSI color codes for structured output
#
################################################################################

# Standard colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'

# Reset to default
RESET='\033[0m'

# Bold variants
BOLD_GREEN='\033[1;32m'
BOLD_RED='\033[1;31m'
BOLD_YELLOW='\033[1;33m'

# Usage:
#   echo -e "${GREEN}Success message${RESET}"
#   echo -e "${RED}Error message${RESET}"
