#!/bin/bash

# Temporary workaround: Push without workflow files, then add them back

echo "Temporary workaround: Removing workflow files from commit..."
echo ""

# Create a backup branch
git branch backup-main 2>/dev/null

# Remove workflow files from the last commit (but keep them in working directory)
git rm --cached .github/workflows/deploy-production.yml 2>/dev/null
git rm --cached .github/workflows/deploy-web.yml 2>/dev/null

# Amend the commit to exclude workflow files
git commit --amend --no-edit

echo ""
echo "Pushing without workflow files..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed (without workflow files)!"
    echo ""
    echo "To add workflow files later:"
    echo "  1. Update your token with 'workflow' scope"
    echo "  2. Run: git checkout backup-main -- .github/workflows/"
    echo "  3. Run: git add .github/workflows/"
    echo "  4. Run: git commit -m 'Add CI/CD workflows'"
    echo "  5. Run: git push"
else
    echo ""
    echo "❌ Push failed. Restoring original commit..."
    git reset --hard backup-main
fi

