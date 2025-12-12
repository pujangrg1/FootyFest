# Firebase Quick Start Guide

Follow these steps to set up Firebase for user authentication and database storage.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `Footy Fest` (or any name you prefer)
4. Click **"Continue"**
5. **Disable Google Analytics** (optional, you can enable later if needed)
6. Click **"Create project"**
7. Wait for project creation (takes ~30 seconds)
8. Click **"Continue"**

## Step 2: Enable Authentication (Email/Password)

1. In the Firebase Console, click **"Authentication"** in the left sidebar
2. Click **"Get started"** (if you see it)
3. Click the **"Sign-in method"** tab
4. Click on **"Email/Password"**
5. **Enable** the first toggle (Email/Password)
6. Click **"Save"**

**Optional: Enable Phone Authentication**
- Click on **"Phone"**
- Enable it if you want phone sign-in
- Follow the setup instructions

## Step 3: Create Firestore Database

1. In the Firebase Console, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
4. Click **"Next"**
5. Choose a location (select the closest to you, e.g., `us-central` for US)
6. Click **"Enable"**
7. Wait for database creation (~30 seconds)

**Important:** Test mode allows read/write for 30 days. For production, you'll need to set up security rules later.

## Step 4: Get Your Firebase Config

1. In Firebase Console, click the **gear icon ⚙️** next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. If you don't have a web app, click the **"</>" (web)** icon to add one
5. Register your app:
   - App nickname: `Footy Fest Web` (or any name)
   - **Don't check** "Also set up Firebase Hosting"
   - Click **"Register app"**
6. You'll see your Firebase config - it looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

7. **Copy these values** - you'll need them in the next step

## Step 5: Get Realtime Database URL (for Live Scores)

1. In Firebase Console, click **"Realtime Database"** in the left sidebar
2. Click **"Create database"**
3. Select a location (same as Firestore or closest to you)
4. Click **"Next"**
5. Select **"Start in test mode"**
6. Click **"Enable"**
7. Once created, you'll see the database URL at the top, like:
   ```
   https://your-project-default-rtdb.firebaseio.com/
   ```
8. **Copy this URL**

## Step 6: Update Your App's Firebase Config

1. Open `firebase/config.js` in your project
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",           // From Step 4
  authDomain: "your-project.firebaseapp.com",  // From Step 4
  projectId: "your-project-id",            // From Step 4
  storageBucket: "your-project.appspot.com", // From Step 4
  messagingSenderId: "123456789",          // From Step 4
  appId: "1:123456789:web:abcdef",         // From Step 4
  databaseURL: "https://your-project-default-rtdb.firebaseio.com/" // From Step 5
};
```

**Example:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC1234567890abcdefghijklmnop",
  authDomain: "soccer-tournament-app.firebaseapp.com",
  projectId: "soccer-tournament-app",
  storageBucket: "soccer-tournament-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  databaseURL: "https://soccer-tournament-app-default-rtdb.firebaseio.com/"
};
```

## Step 7: Restart Your App

1. Stop the Expo server (Ctrl+C)
2. Clear cache and restart:
   ```bash
   npx expo start -c --tunnel
   ```
3. Reload the app in Expo Go

## Step 8: Test Sign Up

1. Open the app on your phone
2. Go to the Sign Up screen
3. Fill in:
   - Full Name
   - Phone (optional)
   - Email
   - Password
   - Select a Role
4. Click **"Sign Up"**
5. You should be successfully signed up and logged in!

## Step 9: Verify in Firebase Console

1. Go to Firebase Console → **Authentication** → **Users** tab
2. You should see your newly created user!
3. Go to **Firestore Database**
4. Click on **"users"** collection
5. You should see a document with your user's data (uid, email, displayName, role, etc.)

## Troubleshooting

### "Firebase is not configured" error
- Make sure you replaced ALL placeholder values in `firebase/config.js`
- Check for typos in the config values
- Restart the Expo server after changing config

### "Permission denied" error
- Make sure Firestore is in "test mode" (allows read/write for 30 days)
- Check Firestore Database → Rules tab

### Sign up works but can't see user in Firestore
- Check the browser console for errors
- Verify Firestore database was created successfully
- Check Firestore Rules allow writes

## Next Steps

Once authentication is working:
- Users can sign up and log in
- User data is stored in Firestore `users` collection
- You can view all users in Firebase Console
- You can add more features (tournaments, teams, etc.)

## Security Note

The current setup uses "test mode" which allows anyone to read/write for 30 days. For production, you'll need to:
1. Set up proper Firestore security rules
2. Set up proper Realtime Database rules
3. Enable App Check for additional security

But for now, test mode is perfect for development!

