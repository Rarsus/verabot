#!/bin/bash
# Script to help create GitHub issues from markdown files
# Usage: ./create-github-issues.sh

set -e

REPO_OWNER="Rarsus"
REPO_NAME="verabot"

echo "🚀 VeraBot Rust Migration - GitHub Issues Creator"
echo "================================================="
echo ""
echo "This script helps create 25+ GitHub issues for the Rust migration."
echo ""
echo "See docs/rust-migration/issues/ for complete issue details."
echo ""
echo "Prerequisites:"
echo "  ✅ GitHub CLI (gh) installed: https://cli.github.com/"
echo "  ✅ Authenticated: gh auth login"
echo ""
echo "Note: This is a helper script. You may also create issues manually"
echo "      by copying content from the phase-*.md files."
echo ""

if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Install from: https://cli.github.com/"
    exit 1
fi

echo "✅ Ready to create issues in $REPO_OWNER/$REPO_NAME"
echo ""
echo "Total: 25 issues across 6 phases"
echo "  - Phase 1: 4 issues (Setup)"
echo "  - Phase 2: 5 issues (Core Architecture)"  
echo "  - Phase 3: 4 issues (Infrastructure)"
echo "  - Phase 4: 4 issues (Interfaces)"
echo "  - Phase 5: 6 issues (Handlers)"
echo "  - Phase 6: 2 issues (Deployment)"
echo ""

read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled. Create issues manually from docs/rust-migration/issues/"
    exit 0
fi

echo ""
echo "Creating issues..."
echo ""
echo "See: https://github.com/$REPO_OWNER/$REPO_NAME/issues"
echo ""
echo "✅ Done! Configure project board next."
