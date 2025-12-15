import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';

// Helper to check if auth is properly initialized (not a mock)
// Real Firebase auth has an 'app' property, mock auth doesn't
const isAuthValid = () => {
  return auth && auth.app && typeof auth.app === 'object';
};

export const authService = {
  // Email/Password Sign Up
  // roles can be a single role string or an array of roles
  signUpWithEmail: async (email, password, displayName, phone, roles = ['spectator']) => {
    try {
      // Check if auth is properly initialized (not a mock)
      if (!auth || !auth.app) {
        return { 
          user: null, 
          error: 'Firebase is not configured. Please set up Firebase and add your credentials to firebase/config.js. See FIREBASE_SETUP.md for instructions.' 
        };
      }

      // Normalize roles to array
      const rolesArray = Array.isArray(roles) ? roles : [roles];
      // Ensure at least one role
      if (rolesArray.length === 0) {
        rolesArray.push('spectator');
      }

      // Check if user already exists
      let userCredential;
      let isNewUser = false;
      
      try {
        // Try to sign in first
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        // User exists, update their roles
        const user = userCredential.user;
        
        if (db) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const existingRoles = userDoc.exists() 
              ? (userDoc.data().roles || (userDoc.data().role ? [userDoc.data().role] : ['spectator']))
              : ['spectator'];
            
            // Merge roles (avoid duplicates)
            const mergedRoles = [...new Set([...existingRoles, ...rolesArray])];
            
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: user.email,
              displayName: displayName || userDoc.data()?.displayName || '',
              phone: phone || userDoc.data()?.phone || null,
              roles: mergedRoles,
              photoURL: userDoc.data()?.photoURL || null,
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          } catch (dbError) {
            console.warn('Failed to update user document in Firestore:', dbError.message);
          }
        }
        
        return { user, error: null, isNewUser: false };
      } catch (signInError) {
        // User doesn't exist, create new account
        isNewUser = true;
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }

      const user = userCredential.user;

      // Update profile
      try {
        await updateProfile(user, { displayName });
      } catch (profileError) {
        console.warn('Failed to update profile:', profileError.message);
      }

      // Create user document in Firestore (only if db is available)
      if (db) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName,
            phone: phone || null,
            roles: rolesArray, // Store as array
            photoURL: null,
            createdAt: new Date().toISOString(),
          });
        } catch (dbError) {
          console.warn('Failed to create user document in Firestore:', dbError.message);
          // Continue even if Firestore fails - auth user is created
        }
      } else {
        console.warn('Firestore not available - user document not created');
      }

      return { user, error: null, isNewUser };
    } catch (error) {
      return { user: null, error: error.message, isNewUser: false };
    }
  },

  // Email/Password Sign In
  signInWithEmail: async (email, password) => {
    try {
      // Check if auth is properly initialized (not a mock)
      if (!auth || !auth.app) {
        return { 
          user: null, 
          error: 'Firebase is not configured. Please set up Firebase and add your credentials to firebase/config.js. See FIREBASE_SETUP.md for instructions.' 
        };
      }
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  },

  // Phone Sign In
  signInWithPhone: async (phoneNumber) => {
    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
      });

      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      return { confirmationResult, error: null };
    } catch (error) {
      return { confirmationResult: null, error: error.message };
    }
  },

  // Verify Phone Code
  verifyPhoneCode: async (confirmationResult, code) => {
    try {
      const userCredential = await confirmationResult.confirm(code);
      const user = userCredential.user;

      // Check if user document exists (only if db is available)
      if (db) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            // Create user document if it doesn't exist
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              phone: user.phoneNumber,
              email: null,
              displayName: null,
              roles: ['spectator'],
              photoURL: null,
              createdAt: new Date().toISOString(),
            });
          }
        } catch (dbError) {
          console.warn('Failed to create/check user document in Firestore:', dbError.message);
        }
      }

      return { user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  },

  // Sign Out
  signOut: async () => {
    try {
      await signOut(auth);
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Reset Password
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Get Current User
  getCurrentUser: () => {
    return auth.currentUser;
  },

  // Get User Profile
  getUserProfile: async (uid) => {
    try {
      if (!db) {
        return { profile: null, error: 'Firestore is not configured' };
      }
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        // Normalize roles: convert single role to array, ensure roles array exists
        let roles = data.roles;
        if (!roles) {
          roles = data.role ? [data.role] : ['spectator'];
        } else if (!Array.isArray(roles)) {
          roles = [roles];
        }
        return { profile: { ...data, roles }, error: null };
      }
      return { profile: null, error: 'User not found' };
    } catch (error) {
      return { profile: null, error: error.message };
    }
  },

  // Update User Profile
  updateUserProfile: async (uid, updates) => {
    try {
      if (!db) {
        return { error: 'Firestore is not configured' };
      }
      await setDoc(doc(db, 'users', uid), updates, { merge: true });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },
};

