import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Text, FAB, Card, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { getTournamentsForCurrentUser } from '../../services/tournaments';
import { setTournaments, setLoading, setError } from '../../store/slices/tournamentsSlice';
import { clearAuth } from '../../store/slices/authSlice';
import { authService } from '../../services/auth';
import { showAlert } from '../../utils/alert';

export default function TournamentListScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.tournaments);

  useEffect(() => {
    const fetchData = async () => {
      dispatch(setLoading(true));
      try {
        const tournaments = await getTournamentsForCurrentUser();
        dispatch(setTournaments(tournaments));
      } catch (e) {
        dispatch(setError(e.message));
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchData();
  }, [dispatch]);

  const handleSignOut = () => {
    console.log('Sign out button clicked');
    
    if (Platform.OS === 'web') {
      // Use browser confirm on web
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (!confirmed) {
        return;
      }
      
      // Proceed with sign out
      (async () => {
        try {
          console.log('Starting sign out...');
          const result = await authService.signOut();
          console.log('Sign out result:', result);
          
          if (result.error) {
            window.alert('Error: ' + result.error);
            return;
          }
          
          // Explicitly clear Redux state
          dispatch(clearAuth());
          console.log('Redux state cleared');
          
          // Navigation will be handled automatically by the auth state listener in RootNavigator
        } catch (error) {
          console.error('Sign out error:', error);
          window.alert('Failed to sign out: ' + error.message);
        }
      })();
    } else {
      // Use React Native Alert on mobile
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              try {
                const result = await authService.signOut();
                if (result.error) {
                  Alert.alert('Error', result.error);
                  return;
                }
                // Explicitly clear Redux state
                dispatch(clearAuth());
                // Navigation will be handled automatically by the auth state listener in RootNavigator
              } catch (error) {
                console.error('Sign out error:', error);
                Alert.alert('Error', 'Failed to sign out: ' + error.message);
              }
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with Sign Out */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            My Tournaments
          </Text>
          {Platform.OS === 'web' ? (
            <Button
              mode="outlined"
              onPress={handleSignOut}
              icon="logout"
              textColor="#ff4444"
              buttonColor="rgba(255, 68, 68, 0.1)"
              style={styles.signOutButtonWeb}
            >
              Sign Out
            </Button>
          ) : (
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
              <Ionicons name="log-out-outline" size={24} color="#ff4444" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          )}
        </View>
        {items.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tournaments yet. Create your first tournament!</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => navigation.navigate('Tournament Details', { tournamentId: item.id, tournament: item })}
                style={styles.cardTouchable}
              >
                <Card style={styles.card}>
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{item.name || 'Untitled Tournament'}</Text>
                    
                    <View style={styles.infoContainer}>
                      {/* Start Date */}
                      <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={16} color="#6C63FF" style={styles.infoIcon} />
                        <Text style={styles.infoLabel}>Start Date:</Text>
                        <Text style={styles.infoValue}>
                          {item.startDate
                            ? format(new Date(item.startDate), 'yyyy-MM-dd')
                            : 'TBD'}
                        </Text>
                      </View>

                      {/* End Date */}
                      <View style={styles.infoRow}>
                        <Ionicons name="calendar" size={16} color="#6C63FF" style={styles.infoIcon} />
                        <Text style={styles.infoLabel}>End Date:</Text>
                        <Text style={styles.infoValue}>
                          {item.endDate
                            ? format(new Date(item.endDate), 'yyyy-MM-dd')
                            : 'TBD'}
                        </Text>
                      </View>

                      {/* Total teams in Open */}
                      <View style={styles.infoRow}>
                        <Ionicons name="people" size={16} color="#6C63FF" style={styles.infoIcon} />
                        <Text style={styles.infoLabel}>Total teams in Open:</Text>
                        <Text style={styles.infoValue}>
                          {item.maxTeams ? item.maxTeams : 'TBD'}
                        </Text>
                      </View>

                      {/* Total teams in 35+ */}
                      <View style={styles.infoRow}>
                        <Ionicons name="people-outline" size={16} color="#6C63FF" style={styles.infoIcon} />
                        <Text style={styles.infoLabel}>Total teams in 35+:</Text>
                        <Text style={styles.infoValue}>
                          {item.maxTeams35Plus ? item.maxTeams35Plus : 'TBD'}
                        </Text>
                      </View>

                      {/* Venue */}
                      <View style={styles.infoRow}>
                        <Ionicons name="location" size={16} color="#6C63FF" style={styles.infoIcon} />
                        <Text style={styles.infoLabel}>Venue:</Text>
                        <Text style={styles.infoValue}>{item.location || 'TBD'}</Text>
                      </View>

                      {/* Duration */}
                      <View style={styles.infoRow}>
                        <Ionicons name="time" size={16} color="#6C63FF" style={styles.infoIcon} />
                        <Text style={styles.infoLabel}>Duration:</Text>
                        <Text style={styles.infoValue}>
                          {item.matchDuration ? `${item.matchDuration} min` : 'TBD'}
                        </Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            )}
          />
        )}
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('Create Tournament')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f0f1e',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#0f0f1e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  signOutButtonWeb: {
    borderColor: '#ff4444',
  },
  signOutText: {
    color: '#ff4444',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#4CAF50',
  },
  cardTouchable: {
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6C63FF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  infoContainer: {
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    minHeight: 20,
  },
  infoIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
    alignSelf: 'center',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6C63FF',
    marginRight: 8,
    width: 130,
    textAlign: 'left',
  },
  infoValue: {
    fontSize: 12,
    color: '#fff',
    flex: 1,
    textAlign: 'left',
  },
});


