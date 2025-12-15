#!/bin/bash

# Install and setup GitHub CLI for easy authentication

echo "Setting up GitHub CLI..."

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install GitHub CLI
echo "Installing GitHub CLI..."
brew install gh

# Authenticate
echo ""
echo "Authenticating with GitHub..."
echo "This will open a browser for you to login..."
gh auth login

# Verify authentication
echo ""
echo "Verifying authentication..."
gh auth status

echo ""
echo "✅ GitHub CLI is ready!"
echo ""
echo "Now you can push:"
echo "  git push -u origin main"

