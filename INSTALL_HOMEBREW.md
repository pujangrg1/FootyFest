# Install Homebrew (Required for Watchman)

Homebrew is a package manager for macOS. Install it first, then install Watchman.

## Install Homebrew

Run this command in your terminal:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the on-screen instructions. This may take a few minutes.

## After Installation

1. Add Homebrew to your PATH (if prompted, run the commands shown in the terminal)
2. Verify installation:
   ```bash
   brew --version
   ```
3. Install Watchman:
   ```bash
   brew install watchman
   ```
4. Verify Watchman:
   ```bash
   watchman --version
   ```

## Then Start Expo

```bash
npm start
```

