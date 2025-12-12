#!/bin/bash

# Script to connect and push Footy Fest app to GitHub repository
# Repository: https://github.com/pujangrg1/FootyFest

echo "Setting up Git repository and pushing to GitHub..."

# Initialize git repository (if not already initialized)
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
fi

# Add remote repository
echo "Adding remote repository..."
git remote remove origin 2>/dev/null  # Remove if exists
git remote add origin https://github.com/pujangrg1/FootyFest.git

# Verify remote
echo "Verifying remote configuration..."
git remote -v

# Add all files
echo "Staging all files..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "No changes to commit. Repository is up to date."
    echo ""
    echo "⚠️  If you want to force push, run:"
    echo "   git push -u origin main --force"
else
    # Create initial commit
    echo "Creating initial commit..."
    git commit -m "Initial commit: Footy Fest app with production deployment setup

- Complete React Native (Expo) app for soccer tournament management
- Production web deployment configuration (Vercel, Netlify, Firebase, AWS)
- Environment variables support
- Error tracking utility
- Security headers and CSP configuration
- CI/CD pipeline with GitHub Actions
- Comprehensive deployment documentation"

    # Push to GitHub
    echo "Pushing to GitHub..."
    git branch -M main
    git push -u origin main
    
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "Repository: https://github.com/pujangrg1/FootyFest"
fi

