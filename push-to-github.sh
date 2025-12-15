#!/bin/bash

# Script to push to GitHub using personal access token
# Usage: ./push-to-github.sh

echo "Pushing to GitHub..."
echo ""
echo "You'll be prompted for your GitHub username and password."
echo "For password, use your Personal Access Token (not your GitHub password)."
echo ""
echo "To create a token: https://github.com/settings/tokens"
echo ""

# Push to GitHub
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "Repository: https://github.com/pujangrg1/FootyFest"
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "   1. You have a Personal Access Token"
    echo "   2. The token has 'repo' scope"
    echo "   3. Your username and token are correct"
    echo ""
    echo "Alternative: Use SSH instead of HTTPS"
    echo "   git remote set-url origin git@github.com:pujangrg1/FootyFest.git"
fi

