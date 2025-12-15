import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { Platform } from 'react-native';
import { logUserActivity } from './activityLog';

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

      // Check if user already exists - if they do, prevent signup
      let userCredential;
      let isNewUser = false;
      
      // First, check if email is already registered (without signing in)
      try {
        const signInMethods = await fetchSignInMethodsForEmail(auth, email);
        console.log('Sign-in methods for email:', signInMethods);
        
        if (signInMethods && signInMethods.length > 0) {
          // Email is already registered - check if user wants to add new roles
          console.log('Email is already registered, checking if user wants to add new roles...');
          
          if (db) {
            // We need to get the user ID to check Firestore, but we can't without signing in
            // So we'll try to sign in with the provided password to get the UID
            // If password is wrong, we'll return error
            try {
              console.log('Attempting to sign in to check existing user roles...');
              const tempCredential = await signInWithEmailAndPassword(auth, email, password);
              const tempUser = tempCredential.user;
              console.log('Successfully signed in to check roles for user:', tempUser.uid);
              
              // Check Firestore document
              const userDoc = await getDoc(doc(db, 'users', tempUser.uid));
              console.log('User document exists:', userDoc.exists());
              
              if (userDoc.exists()) {
                // User exists with profile - check if they're adding new roles
                const existingData = userDoc.data();
                const existingRoles = existingData.roles || (existingData.role ? [existingData.role] : ['spectator']);
                const existingRolesArray = Array.isArray(existingRoles) ? existingRoles : [existingRoles];
                
                // Normalize role names to lowercase for comparison
                const normalizedExistingRoles = existingRolesArray.map(r => String(r).toLowerCase().trim());
                const normalizedNewRoles = rolesArray.map(r => String(r).toLowerCase().trim());
                
                console.log('Checking roles for existing user:', {
                  existingRoles: existingRolesArray,
                  normalizedExisting: normalizedExistingRoles,
                  requestedRoles: rolesArray,
                  normalizedRequested: normalizedNewRoles
                });
                
                // Check if user is trying to add any new roles
                const newRoles = rolesArray.filter(role => {
                  const normalizedRole = String(role).toLowerCase().trim();
                  return !normalizedExistingRoles.includes(normalizedRole);
                });
                
                console.log('New roles to add:', newRoles);
                
                if (newRoles.length === 0) {
                  // User already has all the roles they're trying to add
                  console.log('User already has all requested roles');
                  await firebaseSignOut(auth);
                  return { 
                    user: null, 
                    error: 'You already have all the selected roles. Please sign in instead.', 
                    isNewUser: false 
                  };
                }
                
                // User is adding new roles - merge them (preserve original case from existing roles)
                const mergedRoles = [...new Set([...existingRolesArray, ...rolesArray])];
                console.log('Adding new roles to existing user:', {
                  existing: existingRolesArray,
                  new: rolesArray,
                  merged: mergedRoles,
                  addedRoles: newRoles
                });
                
                // Update user document with merged roles
                try {
                  await setDoc(doc(db, 'users', tempUser.uid), {
                    uid: tempUser.uid,
                    email: tempUser.email,
                    displayName: displayName || existingData.displayName || '',
                    phone: phone || existingData.phone || null,
                    roles: mergedRoles,
                    photoURL: existingData.photoURL || null,
                    updatedAt: new Date().toISOString(),
                  }, { merge: true });
                  
                  console.log('User roles updated successfully in Firestore');
                } catch (updateError) {
                  console.error('Error updating user roles in Firestore:', updateError);
                  await firebaseSignOut(auth);
                  return {
                    user: null,
                    error: 'Failed to update your roles. Please try again or contact support.',
                    isNewUser: false
                  };
                }
                
                // Update profile if display name provided
                if (displayName) {
                  try {
                    await updateProfile(tempUser, { displayName });
                  } catch (profileError) {
                    console.warn('Failed to update profile:', profileError.message);
                  }
                }
                
                // Log role addition
                logUserActivity({
                  userId: tempUser.uid,
                  email: tempUser.email,
                  activityType: 'role_change',
                  metadata: {
                    previousRoles: existingRolesArray,
                    newRoles: mergedRoles,
                    addedRoles: newRoles,
                    method: 'signup',
                  },
                }).catch(err => {
                  console.warn('Activity logging failed (non-critical):', err);
                });
                
                return { user: tempUser, error: null, isNewUser: false };
              } else {
                // User exists in Auth but not in Firestore - recreate profile
                console.log('User exists in Auth but not in Firestore, recreating document...');
                await setDoc(doc(db, 'users', tempUser.uid), {
                  uid: tempUser.uid,
                  email: tempUser.email,
                  displayName: displayName || '',
                  phone: phone || null,
                  roles: rolesArray,
                  photoURL: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                
                // Update profile
                try {
                  await updateProfile(tempUser, { displayName });
                } catch (profileError) {
                  console.warn('Failed to update profile:', profileError.message);
                }
                
                // Log signup
                logUserActivity({
                  userId: tempUser.uid,
                  email: tempUser.email,
                  activityType: 'signup',
                  metadata: {
                    displayName,
                    roles: rolesArray,
                    method: 'email',
                    note: 'Recreated profile for existing Auth user',
                  },
                }).catch(err => {
                  console.warn('Activity logging failed (non-critical):', err);
                });
                
                return { user: tempUser, error: null, isNewUser: true };
              }
            } catch (signInErr) {
              // Wrong password or other sign in error
              console.error('Sign in error during role check:', {
                code: signInErr.code,
                message: signInErr.message,
                fullError: signInErr
              });
              
              if (signInErr.code === 'auth/wrong-password' || 
                  signInErr.code === 'auth/invalid-credential' ||
                  signInErr.code === 'auth/invalid-email' ||
                  (signInErr.message && (
                    signInErr.message.includes('password') || 
                    signInErr.message.includes('credential') ||
                    signInErr.message.includes('invalid')
                  ))) {
                // User exists but password is wrong - they need to sign in with correct password
                // Don't sign out - they weren't signed in
                return { 
                  user: null, 
                  error: 'An account with this email already exists. To add new roles, please use your existing password. If you forgot your password, use "Forgot Password" to reset it.', 
                  isNewUser: false 
                };
              }
              // Some other error - allow signup to proceed (might be a different account)
              console.log('Sign in check failed with unexpected error, proceeding with new account creation:', signInErr.message);
            }
          } else {
            // No database - email exists, prevent signup
            return { 
              user: null, 
              error: 'An account with this email already exists. Please sign in instead.', 
              isNewUser: false 
            };
          }
        }
      } catch (fetchError) {
        // Error checking sign-in methods - proceed with account creation
        console.log('Could not check if email exists, proceeding with signup:', fetchError.message);
      }
      
      // Email is not registered or check failed - create new account
      console.log('Creating new account...');
      isNewUser = true;
      userCredential = await createUserWithEmailAndPassword(auth, email, password);

      const user = userCredential.user;

      // Update profile
      try {
        await updateProfile(user, { displayName });
      } catch (profileError) {
        console.warn('Failed to update profile:', profileError.message);
      }

      // Create user document in Firestore (only if db is available)
      // IMPORTANT: This must complete before returning to ensure RootNavigator can find the profile
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
          console.log('User document created successfully in Firestore');
          
          // Log new account creation (non-blocking - don't await)
          logUserActivity({
            userId: user.uid,
            email: user.email,
            activityType: 'signup',
            metadata: {
              displayName,
              roles: rolesArray,
              method: 'email',
            },
          }).catch(err => {
            console.warn('Activity logging failed (non-critical):', err);
          });
        } catch (dbError) {
          console.error('Failed to create user document in Firestore:', dbError.message);
          // This is critical - if we can't create the document, the user will be signed out
          // by RootNavigator. We should return an error.
          return { 
            user: null, 
            error: 'Failed to create user profile. Please try again.', 
            isNewUser: false 
          };
        }
      } else {
        console.warn('Firestore not available - user document not created');
        return { 
          user: null, 
          error: 'Database not available. Please try again.', 
          isNewUser: false 
        };
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
      const user = userCredential.user;
      
      // Verify user document exists in Firestore
      if (db) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            // User document doesn't exist - sign them out and return error
            await firebaseSignOut(auth);
            return { 
              user: null, 
              error: 'Your account has been deleted. Please contact support if you believe this is an error.' 
            };
          }
          
          // Update last login timestamp
          await setDoc(doc(db, 'users', user.uid), {
            lastLoginAt: serverTimestamp(),
            lastLoginAtISO: new Date().toISOString(),
          }, { merge: true });
          
          // Log successful login (non-blocking - don't await)
          logUserActivity({
            userId: user.uid,
            email: user.email,
            activityType: 'login',
            metadata: {
              method: 'email',
              platform: Platform.OS,
            },
          }).catch(err => {
            console.warn('Activity logging failed (non-critical):', err);
          });
        } catch (dbError) {
          console.warn('Error checking user document:', dbError.message);
          // If we can't check, allow login but log warning
        }
      }
      
      return { user, error: null };
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
          const isNewUser = !userDoc.exists();
          
          if (isNewUser) {
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
            
            // Log phone signup (non-blocking)
            logUserActivity({
              userId: user.uid,
              email: user.email || user.phoneNumber,
              activityType: 'signup',
              metadata: {
                method: 'phone',
                phone: user.phoneNumber,
              },
            }).catch(err => {
              console.warn('Activity logging failed (non-critical):', err);
            });
          } else {
            // Update last login and log phone login
            await setDoc(doc(db, 'users', user.uid), {
              lastLoginAt: serverTimestamp(),
              lastLoginAtISO: new Date().toISOString(),
            }, { merge: true });
            
            // Log phone login (non-blocking)
            logUserActivity({
              userId: user.uid,
              email: user.email || user.phoneNumber,
              activityType: 'login',
              metadata: {
                method: 'phone',
                platform: Platform.OS,
              },
            }).catch(err => {
              console.warn('Activity logging failed (non-critical):', err);
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
      const currentUser = auth.currentUser;
      await firebaseSignOut(auth);
      
      // Log logout if user was logged in (non-blocking)
      if (currentUser && db) {
        logUserActivity({
          userId: currentUser.uid,
          email: currentUser.email,
          activityType: 'logout',
          metadata: {
            platform: Platform.OS,
          },
        }).catch(err => {
          console.warn('Activity logging failed (non-critical):', err);
        });
      }
      
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
      // User document doesn't exist - return explicit error
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

