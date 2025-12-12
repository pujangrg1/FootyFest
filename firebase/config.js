import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { Platform } from 'react-native';

// Only import AsyncStorage on mobile platforms
let AsyncStorage = null;
if (Platform.OS !== 'web') {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
}

// Ensure Firebase modules are loaded
// Only log in development to reduce console noise in production
if (process.env.NODE_ENV !== 'production') {
  console.log('Firebase modules loaded:', {
    hasGetAuth: typeof getAuth === 'function',
    hasInitializeAuth: typeof initializeAuth === 'function',
    hasAsyncStorage: Platform.OS !== 'web' ? (AsyncStorage !== null) : true,
    platform: Platform.OS
  });
}

// Firebase configuration
// Reads from environment variables in production, falls back to hardcoded values for development
// For production, set these environment variables in your hosting platform:
// REACT_APP_FIREBASE_API_KEY, REACT_APP_FIREBASE_AUTH_DOMAIN, etc.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDQ6tjsesDYZax3UXcUWQFtESG-CxIlYX8",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "soccer-tournament-d956a.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "soccer-tournament-d956a",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "soccer-tournament-d956a.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "364991861304",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:364991861304:web:47177888bab3441c930ccd",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://soccer-tournament-d956a-default-rtdb.firebaseio.com/"
};

// Check if Firebase config is valid (not using placeholders)
const isConfigValid = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_API_KEY" &&
  firebaseConfig.apiKey.length > 10 &&
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== "YOUR_PROJECT_ID" &&
  firebaseConfig.projectId.length > 0 &&
  firebaseConfig.databaseURL && 
  firebaseConfig.databaseURL !== "YOUR_DATABASE_URL" &&
  firebaseConfig.databaseURL.includes('firebaseio.com');

// Only log config check in development
if (process.env.NODE_ENV !== 'production') {
  console.log('🔍 Firebase config check:');
  console.log('  - API Key exists:', !!firebaseConfig.apiKey);
  console.log('  - Project ID exists:', !!firebaseConfig.projectId);
  console.log('  - Database URL exists:', !!firebaseConfig.databaseURL);
  console.log('  - Config is valid:', isConfigValid);
}

// Initialize Firebase app only if config is valid
let app = null;
if (isConfigValid) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Firebase app initialized successfully');
      }
    } else {
      app = getApps()[0];
      if (process.env.NODE_ENV !== 'production') {
        console.log('Using existing Firebase app');
      }
    }
  } catch (error) {
    console.error('Firebase app initialization failed:', error.message);
    console.error('Error details:', error);
  }
} else {
  console.warn('Firebase config is invalid - check your config values');
}

// Initialize Auth - Platform-specific initialization
let auth;

if (!app || !isConfigValid) {
  // Mock auth for invalid config
  auth = {
    currentUser: null,
    app: null,
    onAuthStateChanged: (callback) => {
      setTimeout(() => callback(null), 0);
      return () => {};
    },
  };
} else {
  try {
    if (Platform.OS === 'web') {
      // On web, use getAuth directly (uses browser localStorage automatically)
      auth = getAuth(app);
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Firebase Auth initialized for web (browser localStorage)');
      }
    } else {
      // On mobile, use initializeAuth with AsyncStorage persistence
      auth = getAuth(app);
      try {
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ Firebase Auth initialized with AsyncStorage persistence');
        }
      } catch (persistError) {
        // If already initialized, that's okay
        if (process.env.NODE_ENV !== 'production') {
          if (persistError.message && persistError.message.includes('already')) {
            console.log('✅ Firebase Auth already initialized with persistence');
          } else {
            console.log('✅ Firebase Auth initialized (persistence may be limited)');
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Firebase Auth initialization failed:', error.message);
    // Create mock auth
    auth = {
      currentUser: null,
      app: null,
      onAuthStateChanged: (callback) => {
        setTimeout(() => callback(null), 0);
        return () => {};
      },
    };
  }
}

// Initialize Firestore - use getFirestore on web, initializeFirestore on mobile
let db = null;
if (app && isConfigValid) {
  try {
    if (Platform.OS === 'web') {
      // On web, use getFirestore (simpler, works with browser)
      db = getFirestore(app);
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Firestore initialized for web');
      }
    } else {
      // On mobile, use initializeFirestore with long polling
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
      });
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Firestore initialized for mobile');
      }
    }
  } catch (error) {
    console.warn('Firestore initialization failed:', error.message);
  }
}

// Initialize Storage
let storage = null;
if (app && isConfigValid) {
  try {
    storage = getStorage(app);
  } catch (error) {
    console.warn('Storage initialization failed:', error.message);
  }
}

// Initialize Realtime Database (only if databaseURL is valid)
let realtimeDb = null;
if (app && isConfigValid && firebaseConfig.databaseURL && !firebaseConfig.databaseURL.includes('YOUR_DATABASE')) {
  try {
    realtimeDb = getDatabase(app);
  } catch (error) {
    console.warn('Realtime Database initialization failed:', error.message);
  }
}

export { auth, db, storage, realtimeDb };
export default app;

