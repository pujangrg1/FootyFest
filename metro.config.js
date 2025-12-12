const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for Firebase v9+ "Component auth has not been registered yet" error
// Add 'cjs' to source extensions to handle Firebase's CommonJS modules
config.resolver.sourceExts.push('cjs');

// Disable unstable package exports (can cause module resolution issues)
config.resolver.unstable_enablePackageExports = false;

// Minimal config - let Metro handle file watching efficiently
// Only block git and build directories
config.resolver.blockList = [
  // Only block git and build directories
  /.*\/\.git\/.*/,
  /.*\/\.expo\/.*/,
  /.*\/ios\/build\/.*/,
  /.*\/android\/build\/.*/,
  /.*\/\.DS_Store/,
];

// Configure watcher with health checks
config.watcher = {
  additionalExts: ['js', 'jsx', 'ts', 'tsx', 'json', 'cjs'],
  healthCheck: {
    enabled: true,
    interval: 2000,
    timeout: 4000,
  },
};

module.exports = config;

