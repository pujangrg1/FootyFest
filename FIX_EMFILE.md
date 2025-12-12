# Fix EMFILE Error: Too Many Open Files

## Quick Fix (Recommended)

**Install Watchman** - This is the best solution:

```bash
brew install watchman
```

Then restart Expo:
```bash
npm start
```

## Alternative Solutions

### Option 1: Increase File Limit Manually

Before running `npm start`, run this in your terminal:

```bash
ulimit -n 4096
npm start
```

**Note:** This only works for the current terminal session. You'll need to run `ulimit -n 4096` each time.

### Option 2: Make File Limit Permanent (macOS)

Add this to your `~/.zshrc` or `~/.bash_profile`:

```bash
ulimit -n 4096
```

Then restart your terminal or run:
```bash
source ~/.zshrc
```

### Option 3: Use Tunnel Mode

Tunnel mode sometimes handles file watching differently:

```bash
npm run start:tunnel
```

## Why This Happens

Metro bundler watches thousands of files in `node_modules` for changes. macOS has a default limit of ~256 open file descriptors, which gets exceeded.

**Watchman** solves this by using a more efficient file watching system that doesn't rely on individual file descriptors.

## Verify Watchman Installation

After installing Watchman, verify it's working:

```bash
watchman --version
```

You should see a version number. If not, Watchman isn't installed correctly.

