# Footy Fest App

A React Native (Expo) app for organizing and managing local 7v7 soccer tournaments.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (optional, can use npx)
- For iOS: Xcode (Mac only)
- For Android: Android Studio

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase:
   - Create a Firebase project at https://console.firebase.google.com
   - Copy your Firebase config to `firebase/config.js`
   - Replace the placeholder values with your actual Firebase credentials

## Running the App

### Fix "Too Many Open Files" Error

If you encounter the `EMFILE: too many open files` error, try one of these solutions:

**Option 1: Install Watchman (BEST SOLUTION - Recommended)**
Watchman handles file watching efficiently and prevents the EMFILE error:
```bash
brew install watchman
```
Then run `npm start` normally.

**Option 2: Use the startup script**
The `start.sh` script automatically increases the file limit:
```bash
npm start
# or
bash start.sh
```

**Option 3: Increase file limit manually in your terminal**
```bash
ulimit -n 4096
npx expo start
```
Note: This only works for the current terminal session.

### Start the Development Server

**Recommended: Install Watchman first** (best solution for file watching):
```bash
brew install watchman
```

Then start the app:
```bash
npm start
```

**Or use tunnel mode** (for QR code scanning):
```bash
npm run start:tunnel
```

**Or use LAN mode**:
```bash
npm run start:lan
```

Then:
- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan QR code with Expo Go app on your phone

## Project Structure

```
soccer-tournament-app/
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/         # Screen components
│   ├── navigation/      # Navigation setup
│   ├── services/        # Firebase services
│   ├── store/           # Redux store
│   └── utils/           # Helper functions
├── firebase/            # Firebase configuration
└── App.js               # Main app entry point
```

## Features

- User authentication (email/password and phone)
- Tournament creation and management
- Team registration and management
- Player management with formations
- Live score updates
- Tournament announcements
- Team invitations (email, QR code, team codes)

## Firebase Setup

1. Create a Firebase project
2. Enable Authentication (Email/Password and Phone)
3. Create Firestore database
4. Enable Realtime Database for live scores
5. Enable Storage for images
6. Copy your config to `firebase/config.js`

## Web Deployment

Footy Fest can be deployed as a web application to various hosting platforms.

### Quick Start

1. **Build for production:**
   ```bash
   npm run build:web
   ```

2. **Test production build locally:**
   ```bash
   npm run serve:web
   ```

3. **Deploy to your preferred platform:**
   - **Vercel:** `vercel --prod`
   - **Netlify:** `netlify deploy --prod`
   - **Firebase:** `firebase deploy --only hosting`
   - **AWS Amplify:** `amplify publish`

### Detailed Deployment Guide

For comprehensive deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Production URL

Once deployed, your app will be available at:
- Vercel: `https://your-app.vercel.app`
- Netlify: `https://your-app.netlify.app`
- Firebase: `https://your-app.web.app`
- Custom domain: `https://yourdomain.com` (after DNS configuration)

### Environment Variables

For production deployment, set the following environment variables in your hosting platform:

- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`
- `REACT_APP_FIREBASE_DATABASE_URL`
- `NODE_ENV=production`

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions.

## Troubleshooting

### Package Version Warnings
If you see version warnings, run:
```bash
npx expo install --fix
```

### File Watching Issues
- Install Watchman: `brew install watchman`
- Or increase file limit: `ulimit -n 4096`

### Metro Bundler Issues
- Clear cache: `npx expo start -c`
- Reset Metro: `npx expo start --clear`

### QR Code "No usable data found" Error on iOS

If you get "No usable data found" when scanning the QR code:

**Solution 1: Use Tunnel Mode (Recommended)**
This works even if your device and computer are on different networks:
```bash
npx expo start --tunnel
```
Then scan the QR code with the Expo Go app (not the Camera app).

**Solution 2: Ensure Same Network**
- Make sure your iOS device and computer are on the same Wi-Fi network
- Try disconnecting and reconnecting to Wi-Fi on both devices

**Solution 3: Use Expo Go App Directly**
- Open the Expo Go app on your iOS device
- Tap "Enter URL manually"
- Enter the URL shown in the terminal (e.g., `exp://192.168.1.100:8081`)

**Solution 4: Check Firewall**
- Make sure your firewall isn't blocking port 8081
- Try temporarily disabling firewall to test

**Solution 5: Use LAN Mode Explicitly**
```bash
npx expo start --lan
```

