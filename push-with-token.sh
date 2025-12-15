#!/bin/bash

# Script to push to GitHub with Personal Access Token
# This script will help you push with a fresh token

echo "=========================================="
echo "GitHub Push Helper for Footy Fest"
echo "=========================================="
echo ""

# Clear any cached credentials
echo "Clearing cached credentials..."
git credential-osxkeychain erase <<EOF
host=github.com
protocol=https
EOF

echo ""
echo "To push to GitHub, you need a Personal Access Token."
echo ""
echo "📋 Steps to create a token:"
echo "   1. Go to: https://github.com/settings/tokens"
echo "   2. Click 'Generate new token' → 'Generate new token (classic)'"
echo "   3. Name: 'FootyFest Push'"
echo "   4. Expiration: Your choice"
echo "   5. Scopes: Check 'repo' (FULL CONTROL)"
echo "   6. Click 'Generate token'"
echo "   7. COPY THE TOKEN (starts with ghp_)"
echo ""
echo "⚠️  IMPORTANT: The token must have 'repo' scope checked!"
echo ""
read -p "Press Enter when you have your token ready..."

echo ""
echo "Now let's push to GitHub..."
echo ""
echo "When prompted:"
echo "  Username: pujangrg1"
echo "  Password: [Paste your Personal Access Token]"
echo ""

# Push to GitHub
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "Repository: https://github.com/pujangrg1/FootyFest"
else
    echo ""
    echo "❌ Push failed. Common issues:"
    echo ""
    echo "1. Token doesn't have 'repo' scope"
    echo "   → Make sure 'repo' is checked when creating the token"
    echo ""
    echo "2. Token is incorrect"
    echo "   → Double-check you copied the entire token"
    echo ""
    echo "3. Repository doesn't exist or you don't have access"
    echo "   → Verify: https://github.com/pujangrg1/FootyFest"
    echo ""
    echo "4. Try using GitHub CLI instead:"
    echo "   brew install gh"
    echo "   gh auth login"
    echo "   git push -u origin main"
fi

