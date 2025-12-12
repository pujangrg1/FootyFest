# Firebase Setup Instructions

## Current Status

The app is currently using placeholder Firebase configuration values. You need to set up a Firebase project and add your credentials.

## Steps to Configure Firebase

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

### 2. Add Your App to Firebase

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the iOS icon (🍎) to add an iOS app
5. Enter your bundle identifier: `com.soccertournament.app`
6. Register the app
7. Download the `GoogleService-Info.plist` file (you'll need this later)

### 3. Enable Firebase Services

#### Authentication
1. Go to "Authentication" in the left sidebar
2. Click "Get started"
3. Enable "Email/Password" sign-in method
4. Enable "Phone" sign-in method (optional, for phone authentication)

#### Firestore Database
1. Go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Start in "test mode" (for development)
4. Choose a location for your database

#### Realtime Database (for live scores)
1. Go to "Realtime Database" in the left sidebar
2. Click "Create database"
3. Start in "test mode"
4. Choose a location

#### Storage (for team logos and player photos)
1. Go to "Storage" in the left sidebar
2. Click "Get started"
3. Start in "test mode"

### 4. Get Your Firebase Config

1. In Firebase Console, go to Project Settings
2. Scroll down to "Your apps" section
3. Find your web app (or add one if you don't have it)
4. Copy the config values

### 5. Update firebase/config.js

Open `firebase/config.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com"
};
```

### 6. Security Rules (Important!)

After setting up, update your Firestore security rules:

1. Go to Firestore Database → Rules
2. Update rules for development (replace with proper rules for production):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Testing Without Firebase

If you want to test the app UI without setting up Firebase:

1. The app will show warnings in the console
2. Authentication screens will appear but won't work
3. You can still navigate through the UI to see the design

## Next Steps

After configuring Firebase:
1. Restart the Expo server
2. The auth error should be resolved
3. You can test login/signup functionality

