/**
 * Script to set a user as admin in Firestore
 * 
 * Usage:
 *   node scripts/set-admin-user.js <user-uid>
 * 
 * Or run interactively:
 *   node scripts/set-admin-user.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDQ6tjsesDYZax3UXcUWQFtESG-CxIlYX8",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "soccer-tournament-d956a.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "soccer-tournament-d956a",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "soccer-tournament-d956a.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "364991861304",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:364991861304:web:47177888bab3441c930ccd",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://soccer-tournament-d956a-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function findUserByEmail(email) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return snapshot.docs[0].id; // Return the UID
    }
    return null;
  } catch (error) {
    console.error('Error finding user by email:', error.message);
    return null;
  }
}

async function setAdminUser(userIdentifier) {
  try {
    let userId = userIdentifier;
    
    // If it's an email, try to find the user
    if (userIdentifier.includes('@')) {
      console.log(`Looking up user by email: ${userIdentifier}...`);
      userId = await findUserByEmail(userIdentifier);
      if (!userId) {
        console.error(`❌ User with email ${userIdentifier} not found in Firestore.`);
        console.log('Make sure the user has signed up and has a document in the "users" collection.');
        process.exit(1);
      }
      console.log(`✅ Found user with UID: ${userId}`);
    }
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error(`❌ User document not found for UID: ${userId}`);
      console.log('The user must have a document in the "users" collection.');
      console.log('Users are created automatically when they sign up.');
      process.exit(1);
    }
    
    const userData = userDoc.data();
    const currentRole = userData.role || 'spectator';
    
    if (currentRole === 'admin') {
      console.log(`ℹ️  User ${userId} is already an admin.`);
      console.log(`   Email: ${userData.email || 'N/A'}`);
      console.log(`   Display Name: ${userData.displayName || 'N/A'}`);
      process.exit(0);
    }
    
    await updateDoc(userRef, {
      role: 'admin',
      updatedAt: new Date().toISOString(),
    });
    
    console.log(`✅ Successfully set user as admin!`);
    console.log(`   UID: ${userId}`);
    console.log(`   Email: ${userData.email || 'N/A'}`);
    console.log(`   Display Name: ${userData.displayName || 'N/A'}`);
    console.log(`   Previous Role: ${currentRole}`);
    console.log(`   New Role: admin`);
    console.log('');
    console.log('The user can now see all tournaments in the app.');
    
  } catch (error) {
    console.error('❌ Error setting admin user:', error.message);
    process.exit(1);
  }
}

// Main execution
const userIdentifier = process.argv[2];

if (!userIdentifier) {
  console.log('Usage: node scripts/set-admin-user.js <user-uid-or-email>');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/set-admin-user.js abc123xyz');
  console.log('  node scripts/set-admin-user.js user@example.com');
  console.log('');
  console.log('To find a user UID:');
  console.log('  1. Go to Firebase Console → Authentication → Users');
  console.log('  2. Find the user and copy their UID');
  console.log('  3. Or use their email address if they have a document in Firestore');
  process.exit(1);
}

setAdminUser(userIdentifier)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });

