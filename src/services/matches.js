import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { authService } from './auth';

const MATCHES_COLLECTION = 'matches';

// Helper function to convert Firestore Timestamp to ISO string
const convertTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (typeof timestamp === 'string') return timestamp;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return timestamp;
};

// Helper function to convert match data from Firestore format
const convertMatchData = (data) => {
  const converted = { ...data };
  if (converted.scheduledTime) {
    converted.scheduledTime = convertTimestamp(converted.scheduledTime);
  }
  if (converted.createdAt) {
    converted.createdAt = convertTimestamp(converted.createdAt);
  }
  if (converted.updatedAt) {
    converted.updatedAt = convertTimestamp(converted.updatedAt);
  }
  // Ensure events array exists
  if (!converted.events || !Array.isArray(converted.events)) {
    converted.events = [];
  }
  // Convert timer data timestamps
  if (converted.timer) {
    if (converted.timer.startTime) {
      converted.timer.startTime = convertTimestamp(converted.timer.startTime);
    }
    if (converted.timer.pausedTime) {
      converted.timer.pausedTime = convertTimestamp(converted.timer.pausedTime);
    }
  }
  return converted;
};

export async function createMatch(tournamentId, matchData) {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be logged in to create a match');
  }

  const match = {
    tournamentId,
    team1Id: matchData.team1Id,
    team1Name: matchData.team1Name,
    team2Id: matchData.team2Id,
    team2Name: matchData.team2Name,
    scheduledTime: matchData.scheduledTime || null,
    field: matchData.field || null,
    status: matchData.status || 'scheduled',
    group: matchData.group || null,
    round: matchData.round || null,
    score1: matchData.score1 || null,
    score2: matchData.score2 || null,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, MATCHES_COLLECTION), match);
  return { id: docRef.id, ...match, createdAt: new Date().toISOString() };
}

export async function getMatchesForTournament(tournamentId) {
  if (!tournamentId) return [];

  const q = query(
    collection(db, MATCHES_COLLECTION),
    where('tournamentId', '==', tournamentId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return { id: doc.id, ...convertMatchData(data) };
  });
}

/**
 * Subscribe to real-time updates for matches in a tournament
 * @param {string} tournamentId - The tournament ID
 * @param {function} callback - Callback function that receives the matches array
 * @returns {function} Unsubscribe function
 */
export function subscribeToMatchesForTournament(tournamentId, callback) {
  if (!tournamentId || !callback) {
    console.warn('subscribeToMatchesForTournament: Invalid parameters');
    return () => {};
  }

  if (!db) {
    console.warn('Firestore not available');
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, MATCHES_COLLECTION),
    where('tournamentId', '==', tournamentId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const matches = snapshot.docs.map((doc) => {
        const data = doc.data();
        return { id: doc.id, ...convertMatchData(data) };
      });
      callback(matches);
    },
    (error) => {
      console.error('Error listening to matches:', error);
      callback([]);
    }
  );
}

/**
 * Subscribe to real-time updates for a single match
 * @param {string} matchId - The match ID
 * @param {function} callback - Callback function that receives the match object
 * @returns {function} Unsubscribe function
 */
export function subscribeToMatch(matchId, callback) {
  if (!matchId || !callback) {
    console.warn('subscribeToMatch: Invalid parameters');
    return () => {};
  }

  if (!db) {
    console.warn('Firestore not available');
    callback(null);
    return () => {};
  }

  const matchRef = doc(db, MATCHES_COLLECTION, matchId);

  return onSnapshot(
    matchRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        callback({ id: docSnapshot.id, ...convertMatchData(data) });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error listening to match:', error);
      callback(null);
    }
  );
}

export async function updateMatch(matchId, updates) {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be logged in to update a match');
  }

  const matchRef = doc(db, MATCHES_COLLECTION, matchId);
  const matchDoc = await getDoc(matchRef);
  
  if (!matchDoc.exists()) {
    throw new Error('Match not found');
  }

  await updateDoc(matchRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  const updatedDoc = await getDoc(matchRef);
  return { id: updatedDoc.id, ...convertMatchData(updatedDoc.data()) };
}

export async function deleteMatch(matchId) {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be logged in to delete a match');
  }

  const matchRef = doc(db, MATCHES_COLLECTION, matchId);
  await deleteDoc(matchRef);
  return true;
}

export async function deleteMatchesForTournament(tournamentId) {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be logged in to delete matches');
  }

  const matches = await getMatchesForTournament(tournamentId);
  const deletePromises = matches.map(match => deleteMatch(match.id));
  await Promise.all(deletePromises);
  return true;
}

export async function createMatchesBatch(tournamentId, matches) {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be logged in to create matches');
  }

  // Delete existing matches first
  await deleteMatchesForTournament(tournamentId);

  // Create new matches
  const createPromises = matches.map(matchData => createMatch(tournamentId, matchData));
  const createdMatches = await Promise.all(createPromises);
  return createdMatches;
}

export async function getMatchById(matchId) {
  if (!matchId) return null;

  const matchRef = doc(db, MATCHES_COLLECTION, matchId);
  const matchDoc = await getDoc(matchRef);
  
  if (!matchDoc.exists()) {
    return null;
  }

  return { id: matchDoc.id, ...convertMatchData(matchDoc.data()) };
}

