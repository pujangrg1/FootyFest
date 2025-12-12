#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const fs = require('fs');

// Get all arguments passed to this script
const args = process.argv.slice(2);

console.log('🚀 Starting Expo...\n');

// Check if watchman is available
let hasWatchman = false;
try {
  execSync('which watchman', { stdio: 'ignore' });
  hasWatchman = true;
  console.log('✅ Watchman detected - file watching optimized\n');
} catch (e) {
  console.log('⚠️  Watchman not found. For best performance, install it:');
  console.log('   1. Install Homebrew: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
  console.log('   2. Install Watchman: brew install watchman\n');
}

// Try to increase file limit using launchctl (macOS)
if (!hasWatchman) {
  try {
    // On macOS, we can try to increase the limit
    const maxFiles = execSync('launchctl limit maxfiles', { encoding: 'utf8' });
    console.log(`📊 Current file limit: ${maxFiles.trim()}\n`);
  } catch (e) {
    // Ignore if launchctl fails
  }
}

// Start Expo with all arguments
const expoProcess = spawn('npx', ['expo', 'start', ...args], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    // Reduce file watching by setting these environment variables
    EXPO_NO_METRO_LAZY: '1',
    // Increase Node.js memory
    NODE_OPTIONS: '--max-old-space-size=4096',
  },
});

expoProcess.on('error', (error) => {
  console.error('\n❌ Error starting Expo:', error.message);
  if (error.code === 'EMFILE') {
    console.error('\n💡 SOLUTION: Install Watchman to fix file watching issues:');
    console.error('   1. Install Homebrew: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
    console.error('   2. Install Watchman: brew install watchman');
    console.error('   3. Restart Expo: npm start\n');
  }
  process.exit(1);
});

expoProcess.on('exit', (code) => {
  process.exit(code || 0);
});

