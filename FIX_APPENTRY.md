# Fix: Unable to resolve AppEntry

## The Problem
The Metro config was blocking ALL node_modules, including the `expo` package itself, which prevented Metro from finding `AppEntry.js`.

## The Fix
Updated `metro.config.js` to:
- Allow direct dependencies (like `expo`) to be resolved
- Only block nested node_modules (node_modules inside node_modules)
- Keep necessary directories accessible

## Next Steps

1. **Stop the Expo server** (Ctrl+C)

2. **Clear all caches:**
   ```bash
   rm -rf node_modules/.cache
   rm -rf .expo
   npx expo start -c
   ```

3. **If that doesn't work, reinstall dependencies:**
   ```bash
   rm -rf node_modules
   npm install
   npx expo start -c
   ```

The app should now load correctly!

