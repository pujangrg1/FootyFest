#!/bin/bash

# Clear credentials and push with fresh token

echo "Clearing all cached GitHub credentials..."
git credential-osxkeychain erase <<EOF
host=github.com
protocol=https
EOF

# Also try to clear from git config
git config --global --unset-all credential.helper 2>/dev/null
git config --global credential.helper osxkeychain

echo ""
echo "✅ Credentials cleared!"
echo ""
echo "Now run: git push -u origin main"
echo ""
echo "When prompted:"
echo "  Username: pujangrg1"
echo "  Password: [Paste your NEW Personal Access Token with 'repo' scope]"
echo ""
echo "⚠️  Make sure your token has 'repo' scope checked!"
echo "   Create new token at: https://github.com/settings/tokens"

