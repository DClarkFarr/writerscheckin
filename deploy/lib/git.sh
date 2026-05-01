#!/bin/bash

################################################################################
# deploy/lib/git.sh - Git utility functions
#
# Provides functions for git operations: pull, change detection, validation
#
################################################################################

# Source logging if available
if [[ -f "$(dirname "${BASH_SOURCE[0]}")/logging.sh" ]]; then
    source "$(dirname "${BASH_SOURCE[0]}")/logging.sh"
fi

################################################################################
# Git Utility Functions
################################################################################

# Check if working directory is clean (no uncommitted changes)
check_working_directory_clean() {
    local status_output
    status_output=$(git status --porcelain 2>&1)
    
    if [[ -n "$status_output" ]]; then
        return 1  # Not clean
    fi
    return 0  # Clean
}

# Capture current HEAD commit before pull
capture_before_commit() {
    git rev-parse HEAD 2>/dev/null || echo "unknown"
}

# Pull latest changes from origin
git_pull_origin() {
    local output
    local exit_code
    
    output=$(git pull origin 2>&1)
    exit_code=$?
    
    if [[ $exit_code -ne 0 ]]; then
        echo "$output" >&2
        return $exit_code
    fi
    
    echo "$output"
    return 0
}

# Detect which projects have changed between two commits
# Returns: space-separated project names that changed
detect_changed_projects() {
    local before_commit="$1"
    local after_commit="$2"
    local repo_root="$3"
    
    # Default to current HEAD if after_commit not provided
    [[ -z "$after_commit" ]] && after_commit="HEAD"
    
    local changed_projects=""
    local projects=("web" "express")

    # Run diff checks from repository root and use repository-relative pathspecs.
    local original_dir
    original_dir="$(pwd)"
    cd "$repo_root"
    
    for project in "${projects[@]}"; do
        # Check if files in this project path changed
        if git diff --quiet "$before_commit" "$after_commit" -- "$project/" 2>/dev/null; then
            # No changes in this project
            :
        else
            # Changes detected in this project
            changed_projects="$changed_projects $project"
        fi
    done

    cd "$original_dir"
    
    # Trim and return
    echo "$changed_projects" | xargs
}

# Check if git remote is reachable
check_git_remote_reachable() {
    # Try to fetch with dry-run (no actual fetch)
    if git fetch origin --dry-run &>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Get remote URL
get_remote_url() {
    git config --get remote.origin.url 2>/dev/null || echo "unknown"
}

# Check if repository is in valid git state
is_valid_git_repo() {
    git rev-parse --git-dir >/dev/null 2>&1
}
