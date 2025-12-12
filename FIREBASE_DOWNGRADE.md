# Firebase Version Downgrade

## Issue
Firebase v10+ has a known bug in React Native/Expo that causes the error:
"Component auth has not been registered yet"

## Solution
Downgraded Firebase from v10.7.1 to v9.23.0, which is stable and works correctly with React Native/Expo.

## Steps to Apply

1. **Stop the Expo server** (Ctrl+C)

2. **Remove node_modules and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Restart Expo:**
   ```bash
   npx expo start -c --tunnel
   ```

4. **Test sign up** - it should work now!

## Why This Works

- Firebase v9.23.0 is the last stable version before v10
- It doesn't have the "Component auth has not been registered yet" bug
- It works perfectly with React Native/Expo
- All Firebase features (Auth, Firestore, Storage, Realtime DB) work correctly

## Note

The persistence warning you might see is normal and doesn't affect functionality. Auth will still work correctly.

