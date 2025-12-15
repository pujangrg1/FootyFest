#!/bin/bash

# Push with workflow scope enabled

echo "Pushing to GitHub..."
echo ""
echo "Make sure your Personal Access Token has 'workflow' scope enabled!"
echo ""
echo "To update your token:"
echo "  1. Go to: https://github.com/settings/tokens"
echo "  2. Find your token and click 'Edit'"
echo "  3. Check 'workflow' scope"
echo "  4. Save"
echo ""
read -p "Press Enter when your token has 'workflow' scope..."

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "Repository: https://github.com/pujangrg1/FootyFest"
else
    echo ""
    echo "❌ Push failed. Make sure 'workflow' scope is enabled on your token."
fi

