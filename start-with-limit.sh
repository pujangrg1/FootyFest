#!/bin/bash

# Script to start Expo with increased file limit
# Use this if you can't install Watchman

echo "🚀 Starting Expo with increased file limit..."
echo ""

# Try to increase file limit
ulimit -n 4096 2>/dev/null || {
  echo "⚠️  Could not set ulimit. Current limit: $(ulimit -n)"
  echo ""
}

# Check current limit
CURRENT_LIMIT=$(ulimit -n)
echo "📊 File descriptor limit: $CURRENT_LIMIT"
echo ""

# Start Expo
echo "Starting Expo..."
npx expo start "$@"

