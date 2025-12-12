import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { authService } from './auth';

const TOURNAMENTS_COLLECTION = 'tournaments';

// Helper function to convert Firestore Timestamp to ISO string
const convertTimestamp = (timestamp) => {
  if (!timestamp) return null;
  // If it's already a string (ISO format), return it
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  // If it's a Firestore Timestamp object
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  // If it has seconds property (Firestore Timestamp format)
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString();
  }
  // If it's a Date object
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return timestamp;
};

// Helper function to convert tournament data from Firestore format
const convertTournamentData = (data) => {
  const converted = { ...data };
  // Convert all Timestamp fields to ISO strings
  if (converted.createdAt) {
    converted.createdAt = convertTimestamp(converted.createdAt);
  }
  if (converted.updatedAt) {
    converted.updatedAt = convertTimestamp(converted.updatedAt);
  }
  if (converted.startDate) {
    converted.startDate = convertTimestamp(converted.startDate);
  }
  if (converted.endDate) {
    converted.endDate = convertTimestamp(converted.endDate);
  }
  // Ensure all numeric fields are properly converted
  if (converted.maxTeams !== undefined) {
    converted.maxTeams = Number(converted.maxTeams) || 0;
  }
  if (converted.maxTeams35Plus !== undefined) {
    converted.maxTeams35Plus = Number(converted.maxTeams35Plus) || 0;
  }
  if (converted.playersPerTeam !== undefined) {
    converted.playersPerTeam = Number(converted.playersPerTeam) || 7;
  }
  if (converted.matchDuration !== undefined) {
    converted.matchDuration = Number(converted.matchDuration) || 40;
  }
  // Ensure teams arrays are properly initialized
  if (!converted.openTeams || !Array.isArray(converted.openTeams)) {
    converted.openTeams = [];
  }
  if (!converted.teams35Plus || !Array.isArray(converted.teams35Plus)) {
    converted.teams35Plus = [];
  }
  // Ensure groups array is properly initialized
  if (!converted.groups || !Array.isArray(converted.groups)) {
    converted.groups = [];
  }
  return converted;
};

export async function createTournament({ 
  name, 
  location, 
  description, 
  maxTeams,
  maxTeams35Plus,
  playersPerTeam,
  startDate,
  endDate,
  matchDuration,
  substitutionRules,
  organizerName,
  contactEmail,
}) {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be logged in to create a tournament');
  }

  const tournamentData = {
    name,
    location,
    description: description || '',
    maxTeams: maxTeams || 0,
    maxTeams35Plus: maxTeams35Plus || 0,
    playersPerTeam: playersPerTeam || 7,
    matchDuration: matchDuration || 40,
    substitutionRules: substitutionRules || 'Rolling Substitutions',
    organizerName: organizerName || '',
    contactEmail: contactEmail || '',
    organizerId: currentUser.uid,
    status: 'draft',
    createdAt: serverTimestamp(),
    startDate: startDate || null,
    endDate: endDate || null,
  };

  const docRef = await addDoc(collection(db, TOURNAMENTS_COLLECTION), tournamentData);

  return {
    id: docRef.id,
    ...tournamentData,
    createdAt: new Date().toISOString(),
  };
}

export async function getTournamentsForCurrentUser() {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    return [];
  }

  // Get user profile to check role
  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    const userRole = userData.role || 'spectator';

    // If user is admin, return all tournaments
    if (userRole === 'admin') {
      const snapshot = await getDocs(collection(db, TOURNAMENTS_COLLECTION));
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return { id: doc.id, ...convertTournamentData(data) };
      });
    }
  } catch (error) {
    // If we can't check the role, fall back to regular user behavior
    console.warn('Could not check user role:', error.message);
  }

  // Otherwise, return only tournaments created by the user
  const q = query(
    collection(db, TOURNAMENTS_COLLECTION),
    where('organizerId', '==', currentUser.uid),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return { id: doc.id, ...convertTournamentData(data) };
  });
}

// Get all tournaments (for spectators)
export async function getAllTournaments() {
  const snapshot = await getDocs(collection(db, TOURNAMENTS_COLLECTION));
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return { id: doc.id, ...convertTournamentData(data) };
  });
}

export async function updateTournament(tournamentId, updates) {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be logged in to update a tournament');
  }

  // Check if user is admin
  let isAdmin = false;
  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      isAdmin = userData.role === 'admin';
    }
  } catch (error) {
    // If we can't check the role, fall back to regular user behavior
    console.warn('Could not check user role:', error.message);
  }

  const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  const tournamentDoc = await getDoc(tournamentRef);
  
  if (!tournamentDoc.exists()) {
    throw new Error('Tournament not found');
  }

  const tournamentData = tournamentDoc.data();
  // Allow update if user is admin or is the organizer
  if (!isAdmin && tournamentData.organizerId !== currentUser.uid) {
    throw new Error('You can only update your own tournaments');
  }

  await updateDoc(tournamentRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  const updatedDoc = await getDoc(tournamentRef);
  return { id: updatedDoc.id, ...convertTournamentData(updatedDoc.data()) };
}

export async function getTournamentById(tournamentId) {
  const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  const tournamentDoc = await getDoc(tournamentRef);
  
  if (!tournamentDoc.exists()) {
    return null;
  }

  return { id: tournamentDoc.id, ...convertTournamentData(tournamentDoc.data()) };
}

export async function deleteTournament(tournamentId) {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be logged in to delete a tournament');
  }

  // Check if user is admin
  let isAdmin = false;
  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      isAdmin = userData.role === 'admin';
    }
  } catch (error) {
    // If we can't check the role, fall back to regular user behavior
    console.warn('Could not check user role:', error.message);
  }

  const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  const tournamentDoc = await getDoc(tournamentRef);
  
  if (!tournamentDoc.exists()) {
    throw new Error('Tournament not found');
  }

  const tournamentData = tournamentDoc.data();
  // Allow delete if user is admin or is the organizer
  if (!isAdmin && tournamentData.organizerId !== currentUser.uid) {
    throw new Error('You can only delete your own tournaments');
  }

  await deleteDoc(tournamentRef);
  return true;
}

export async function updateTournamentTeams(tournamentId, openTeams, teams35Plus) {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be logged in to update teams');
  }

  // Check if user is admin
  let isAdmin = false;
  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      isAdmin = userData.role === 'admin';
    }
  } catch (error) {
    // If we can't check the role, fall back to regular user behavior
    console.warn('Could not check user role:', error.message);
  }

  const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  const tournamentDoc = await getDoc(tournamentRef);
  
  if (!tournamentDoc.exists()) {
    throw new Error('Tournament not found');
  }

  const tournamentData = tournamentDoc.data();
  // Allow update if user is admin or is the organizer
  if (!isAdmin && tournamentData.organizerId !== currentUser.uid) {
    throw new Error('You can only update your own tournaments');
  }

  await updateDoc(tournamentRef, {
    openTeams: openTeams || [],
    teams35Plus: teams35Plus || [],
    updatedAt: serverTimestamp(),
  });

  const updatedDoc = await getDoc(tournamentRef);
  return { id: updatedDoc.id, ...convertTournamentData(updatedDoc.data()) };
}


