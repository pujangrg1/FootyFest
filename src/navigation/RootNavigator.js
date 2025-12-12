import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { useDispatch, useSelector } from 'react-redux';
import { auth } from '../../firebase/config';
import { setUser, clearAuth } from '../store/slices/authSlice';
import { authService } from '../services/auth';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import LoadingScreen from '../screens/auth/LoadingScreen';
import TournamentListScreen from '../screens/tournament/TournamentListScreen';
import CreateTournamentScreen from '../screens/tournament/CreateTournamentScreen';
import TournamentDetailsScreen from '../screens/tournament/TournamentDetailsScreen';
import MatchDetailsScreen from '../screens/tournament/MatchDetailsScreen';
import TeamHomeScreen from '../screens/team/TeamHomeScreen';
import SpectatorHomeScreen from '../screens/spectator/SpectatorHomeScreen';
import { MaterialIcons } from '@expo/vector-icons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Organizer Tabs
function OrganizerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'sports-soccer';
          if (route.name === 'Tournaments') iconName = 'emoji-events';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarStyle: { backgroundColor: '#1a1a2e', borderTopColor: '#2a2a3e' },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#888',
      })}
    >
      <Tab.Screen name="Tournaments" component={TournamentListScreen} />
      <Tab.Screen name="Create Tournament" component={CreateTournamentScreen} />
    </Tab.Navigator>
  );
}

// Organizer Stack (for role: organizer)
function OrganizerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrganizerHome" component={OrganizerTabs} />
      <Stack.Screen name="Tournament Details" component={TournamentDetailsScreen} />
      <Stack.Screen name="Match Details" component={MatchDetailsScreen} />
    </Stack.Navigator>
  );
}

// Team Stack (for role: team)
function TeamStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TeamHome" component={TeamHomeScreen} />
    </Stack.Navigator>
  );
}

// Spectator Stack (for role: spectator)
function SpectatorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SpectatorHome" component={SpectatorHomeScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const [initializing, setInitializing] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const dispatch = useDispatch();
  
  // Get role from Redux state (set during signup)
  const reduxUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    let timeout;
    let unsubscribe;

    // Add a timeout to prevent infinite loading
    timeout = setTimeout(() => {
      console.warn('Auth initialization timeout - showing login screen');
      setInitializing(false);
      setAuthenticated(false);
    }, 5000); // 5 second timeout

    // Check if auth is properly initialized
    if (!auth) {
      console.warn('Firebase Auth not properly initialized. Please configure Firebase in firebase/config.js');
      clearTimeout(timeout);
      setInitializing(false);
      setAuthenticated(false);
      return;
    }

    // On web, auth might not have onAuthStateChanged if it's a mock
    if (typeof auth.onAuthStateChanged !== 'function') {
      console.warn('Firebase Auth onAuthStateChanged not available, using onAuthStateChanged from firebase/auth');
      // Try to use onAuthStateChanged from firebase/auth directly
      if (typeof onAuthStateChanged === 'function') {
        // Will use onAuthStateChanged below
      } else {
        clearTimeout(timeout);
        setInitializing(false);
        setAuthenticated(false);
        return;
      }
    }

    const handleAuthStateChange = async (user) => {
      clearTimeout(timeout);
      if (user) {
        // Fetch user profile to get role
        try {
          const { profile } = await authService.getUserProfile(user.uid);
          const role = profile?.role || 'spectator';
          setUserRole(role);
          dispatch(setUser({ 
            uid: user.uid, 
            email: user.email, 
            phone: user.phoneNumber,
            role: role 
          }));
          setAuthenticated(true);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserRole('spectator');
          dispatch(setUser({ uid: user.uid, email: user.email, phone: user.phoneNumber, role: 'spectator' }));
          setAuthenticated(true);
        }
      } else {
        dispatch(clearAuth());
        setAuthenticated(false);
        setUserRole(null);
      }
      setInitializing(false);
    };

    try {
      // On web, getAuth returns an auth object without onAuthStateChanged method
      // Always use onAuthStateChanged from firebase/auth for consistency
      if (auth && auth.app) {
        // Real Firebase auth - use onAuthStateChanged from firebase/auth
        unsubscribe = onAuthStateChanged(auth, handleAuthStateChange, (error) => {
          clearTimeout(timeout);
          console.error('Auth state change error:', error);
          dispatch(clearAuth());
          setAuthenticated(false);
          setUserRole(null);
          setInitializing(false);
        });
      } else if (typeof auth.onAuthStateChanged === 'function') {
        // Mock auth - use its method directly
        unsubscribe = auth.onAuthStateChanged(handleAuthStateChange);
      } else {
        // Fallback - no auth available
        console.warn('No valid auth available');
        clearTimeout(timeout);
        setInitializing(false);
        setAuthenticated(false);
      }
    } catch (error) {
      clearTimeout(timeout);
      console.error('Error setting up auth listener:', error);
      setInitializing(false);
      setAuthenticated(false);
    }

    return () => {
      clearTimeout(timeout);
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [dispatch]);

  if (initializing) {
    return <LoadingScreen />;
  }

  // Determine which stack to show based on user role
  // Priority: Redux state role (set during signup) > Firestore profile role
  const getAppComponent = () => {
    const effectiveRole = (reduxUser?.role || userRole || '').toLowerCase();
    console.log('Effective role:', effectiveRole, 'Redux role:', reduxUser?.role, 'Firestore role:', userRole);
    
    // Check for team-related roles (team, manager, teams)
    if (effectiveRole === 'team' || effectiveRole === 'manager' || effectiveRole === 'teams') {
      return TeamStack;
    }
    // Check for spectator role
    if (effectiveRole === 'spectator') {
      return SpectatorStack;
    }
    // Default to organizer view for 'organizer' role or any other role
    return OrganizerStack;
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {authenticated ? (
        <Stack.Screen name="App" component={getAppComponent()} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}


