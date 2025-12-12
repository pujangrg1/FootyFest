#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🚀 Starting Expo in TUNNEL mode...');
console.log('📡 Tunnel mode uses Expo\'s servers for file watching, avoiding local file limits\n');

// Start Expo with tunnel mode
const expoProcess = spawn('npx', ['expo', 'start', '--tunnel'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    EXPO_NO_METRO_LAZY: '1',
    NODE_OPTIONS: '--max-old-space-size=4096',
  },
});

expoProcess.on('error', (error) => {
  console.error('\n❌ Error starting Expo:', error.message);
  process.exit(1);
});

expoProcess.on('exit', (code) => {
  process.exit(code || 0);
});

