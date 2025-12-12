import { collection, addDoc, query, where, getDocs, doc, updateDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { authService } from './auth';

const TEAMS_COLLECTION = 'teams';

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

// Helper function to convert team data from Firestore format
const convertTeamData = (data) => {
  const converted = { ...data };
  if (converted.createdAt) {
    converted.createdAt = convertTimestamp(converted.createdAt);
  }
  if (converted.updatedAt) {
    converted.updatedAt = convertTimestamp(converted.updatedAt);
  }
  if (!converted.players || !Array.isArray(converted.players)) {
    converted.players = [];
  }
  return converted;
};

// Check if team name already exists in the database
export async function checkTeamNameExists(teamName) {
  if (!teamName) return false;
  
  const normalizedName = teamName.trim().toLowerCase();
  const q = query(collection(db, TEAMS_COLLECTION));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.some(doc => {
    const data = doc.data();
    return data.name && data.name.trim().toLowerCase() === normalizedName;
  });
}

export async function createTeam({
  name,
  yearEstablished,
  description,
  players,
  managerName,
  logo,
}) {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be logged in to create a team');
  }

  // Check if team name already exists
  const nameExists = await checkTeamNameExists(name);
  if (nameExists) {
    throw new Error('A team with this name already exists. Please choose a different name.');
  }

  const teamData = {
    name: name.trim(),
    yearEstablished: yearEstablished || null,
    description: description || '',
    players: players || [],
    managerName: managerName || '',
    managerId: currentUser.uid,
    logo: logo || null,
    status: 'active',
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, TEAMS_COLLECTION), teamData);

  return {
    id: docRef.id,
    ...teamData,
    createdAt: new Date().toISOString(),
  };
}

export async function getTeamsForCurrentUser() {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    return [];
  }

  const q = query(
    collection(db, TEAMS_COLLECTION),
    where('managerId', '==', currentUser.uid)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return { id: doc.id, ...convertTeamData(data) };
  });
}

export async function getTeamById(teamId) {
  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  const teamDoc = await getDoc(teamRef);
  
  if (!teamDoc.exists()) {
    return null;
  }

  return { id: teamDoc.id, ...convertTeamData(teamDoc.data()) };
}

export async function getTeamByName(teamName) {
  if (!teamName) return null;
  
  const q = query(
    collection(db, TEAMS_COLLECTION),
    where('name', '==', teamName.trim())
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  const teamDoc = snapshot.docs[0];
  return { id: teamDoc.id, ...convertTeamData(teamDoc.data()) };
}

export async function updateTeam(teamId, updates) {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be logged in to update a team');
  }

  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  const teamDoc = await getDoc(teamRef);
  
  if (!teamDoc.exists()) {
    throw new Error('Team not found');
  }

  const teamData = teamDoc.data();
  if (teamData.managerId !== currentUser.uid) {
    throw new Error('You can only update your own teams');
  }

  // If updating name, check for duplicates (excluding current team)
  if (updates.name && updates.name.trim().toLowerCase() !== teamData.name.trim().toLowerCase()) {
    const nameExists = await checkTeamNameExists(updates.name);
    if (nameExists) {
      throw new Error('A team with this name already exists. Please choose a different name.');
    }
  }

  await updateDoc(teamRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  const updatedDoc = await getDoc(teamRef);
  return { id: updatedDoc.id, ...convertTeamData(updatedDoc.data()) };
}

export async function updateTeamPlayers(teamId, players) {
  return updateTeam(teamId, { players });
}

export async function deleteTeam(teamId) {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be logged in to delete a team');
  }

  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  const teamDoc = await getDoc(teamRef);
  
  if (!teamDoc.exists()) {
    throw new Error('Team not found');
  }

  const teamData = teamDoc.data();
  if (teamData.managerId !== currentUser.uid) {
    throw new Error('You can only delete your own teams');
  }

  await deleteDoc(teamRef);
  return true;
}

// Get all tournaments that this team is participating in
export async function getTeamTournaments(teamName) {
  if (!teamName) return [];
  
  // Query tournaments where this team is in openTeams or teams35Plus
  const tournamentsRef = collection(db, 'tournaments');
  const snapshot = await getDocs(tournamentsRef);
  
  const participatingTournaments = [];
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const openTeams = data.openTeams || [];
    const teams35Plus = data.teams35Plus || [];
    
    if (openTeams.includes(teamName) || teams35Plus.includes(teamName)) {
      participatingTournaments.push({
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        startDate: convertTimestamp(data.startDate),
        endDate: convertTimestamp(data.endDate),
      });
    }
  });
  
  return participatingTournaments;
}

// Get all teams (for spectators)
export async function getAllTeams() {
  const snapshot = await getDocs(collection(db, TEAMS_COLLECTION));
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return { id: doc.id, ...convertTeamData(data) };
  });
}

// Get all matches for a team
export async function getTeamMatches(teamName) {
  if (!teamName) return [];
  
  const matchesRef = collection(db, 'matches');
  const snapshot = await getDocs(matchesRef);
  
  const teamMatches = [];
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.team1Name === teamName || data.team2Name === teamName) {
      teamMatches.push({
        id: doc.id,
        ...data,
        scheduledTime: convertTimestamp(data.scheduledTime),
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      });
    }
  });
  
  // Sort by scheduled time
  teamMatches.sort((a, b) => {
    if (!a.scheduledTime) return 1;
    if (!b.scheduledTime) return -1;
    return new Date(a.scheduledTime) - new Date(b.scheduledTime);
  });
  
  return teamMatches;
}

