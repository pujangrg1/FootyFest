import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, FlatList, Image, Platform } from 'react-native';
import { Text, Card, Button, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { getTeamsForCurrentUser, updateTeamPlayers, getTeamTournaments, getTeamMatches } from '../../services/teams';
import { getMatchesForTournament, subscribeToMatchesForTournament } from '../../services/matches';
import { getTournamentById } from '../../services/tournaments';
import { authService } from '../../services/auth';
import { clearAuth } from '../../store/slices/authSlice';
import MatchTimer from '../../components/MatchTimer';
import CreateTeamScreen from './CreateTeamScreen';
import RoleSwitcher from '../../components/RoleSwitcher';

export default function TeamHomeScreen() {
  const dispatch = useDispatch();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [hasTeam, setHasTeam] = useState(false);

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    setLoading(true);
    try {
      const teams = await getTeamsForCurrentUser();
      if (teams && teams.length > 0) {
        setTeam(teams[0]); // Get the first team for this user
        setHasTeam(true);
      } else {
        setHasTeam(false);
      }
    } catch (error) {
      console.error('Error loading team:', error);
      Alert.alert('Error', 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamCreated = (newTeam) => {
    setTeam(newTeam);
    setHasTeam(true);
  };

  const handleSignOut = () => {
    console.log('Sign out button clicked (Team page)');
    
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If no team exists, show create team screen
  if (!hasTeam) {
    return <CreateTeamScreen onTeamCreated={handleTeamCreated} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="headlineSmall" style={styles.teamName}>
              {team?.name || 'My Team'}
            </Text>
            <Text style={styles.subtitle}>Est. {team?.yearEstablished || 'N/A'}</Text>
          </View>
          <View style={styles.headerActions}>
            <RoleSwitcher />
            {Platform.OS === 'web' ? (
              <Button
                mode="outlined"
                onPress={handleSignOut}
                icon="logout"
                textColor="#ff4444"
                buttonColor="rgba(255, 68, 68, 0.1)"
                style={styles.signOutButtonWeb}
                compact
              >
                Sign Out
              </Button>
            ) : (
              <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
                <Ionicons name="log-out-outline" size={24} color="#ff4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 0 && styles.activeTab]}
            onPress={() => setActiveTab(0)}
          >
            <Ionicons 
              name="people" 
              size={20} 
              color={activeTab === 0 ? '#4CAF50' : '#ccc'} 
            />
            <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]}>
              Squad
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 1 && styles.activeTab]}
            onPress={() => setActiveTab(1)}
          >
            <Ionicons 
              name="football" 
              size={20} 
              color={activeTab === 1 ? '#4CAF50' : '#ccc'} 
            />
            <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>
              Matches
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 2 && styles.activeTab]}
            onPress={() => setActiveTab(2)}
          >
            <Ionicons 
              name="trophy" 
              size={20} 
              color={activeTab === 2 ? '#4CAF50' : '#ccc'} 
            />
            <Text style={[styles.tabText, activeTab === 2 && styles.activeTabText]}>
              Tables
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 3 && styles.activeTab]}
            onPress={() => setActiveTab(3)}
          >
            <Ionicons 
              name="grid" 
              size={20} 
              color={activeTab === 3 ? '#4CAF50' : '#ccc'} 
            />
            <Text style={[styles.tabText, activeTab === 3 && styles.activeTabText]}>
              Formation
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.content}>
          {activeTab === 0 && (
            <SquadTab team={team} onTeamUpdate={setTeam} />
          )}
          {activeTab === 1 && (
            <MatchesTab teamName={team?.name} />
          )}
          {activeTab === 2 && (
            <TablesTab teamName={team?.name} />
          )}
          {activeTab === 3 && (
            <FormationTab team={team} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// Squad Tab Component
function SquadTab({ team, onTeamUpdate }) {
  const [players, setPlayers] = useState([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerJersey, setNewPlayerJersey] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState('');
  const [showPositionPicker, setShowPositionPicker] = useState(false);

  const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

  useEffect(() => {
    if (team?.players) {
      setPlayers(team.players);
    }
  }, [team]);

  const addPlayer = async () => {
    if (!newPlayerName.trim() || !newPlayerJersey.trim() || !newPlayerPosition) {
      Alert.alert('Error', 'Please fill in all player details');
      return;
    }

    const jerseyExists = players.some(p => p.jerseyNumber === newPlayerJersey.trim());
    if (jerseyExists) {
      Alert.alert('Error', 'This jersey number is already assigned');
      return;
    }

    const newPlayer = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      jerseyNumber: newPlayerJersey.trim(),
      position: newPlayerPosition,
    };

    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);

    try {
      const updatedTeam = await updateTeamPlayers(team.id, updatedPlayers);
      onTeamUpdate(updatedTeam);
      setNewPlayerName('');
      setNewPlayerJersey('');
      setNewPlayerPosition('');
      setShowAddPlayer(false);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add player');
      setPlayers(players); // Revert
    }
  };

  const removePlayer = async (playerId) => {
    Alert.alert(
      'Remove Player',
      'Are you sure you want to remove this player?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedPlayers = players.filter(p => p.id !== playerId);
            setPlayers(updatedPlayers);

            try {
              const updatedTeam = await updateTeamPlayers(team.id, updatedPlayers);
              onTeamUpdate(updatedTeam);
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to remove player');
              setPlayers(team.players); // Revert
            }
          },
        },
      ]
    );
  };

  // Group players by position
  const goalkeepers = players.filter(p => p.position === 'Goalkeeper');
  const defenders = players.filter(p => p.position === 'Defender');
  const midfielders = players.filter(p => p.position === 'Midfielder');
  const forwards = players.filter(p => p.position === 'Forward');

  const renderPositionGroup = (title, positionPlayers, color) => {
    if (positionPlayers.length === 0) return null;
    
    return (
      <View style={styles.positionGroup}>
        <Text style={[styles.positionTitle, { color }]}>{title}</Text>
        {positionPlayers.map(player => (
          <View key={player.id} style={styles.playerCard}>
            {player.photoURL ? (
              <Image source={{ uri: player.photoURL }} style={styles.playerPhotoDisplay} />
            ) : (
              <View style={[styles.jerseyBadge, { backgroundColor: color }]}>
                <Text style={styles.jerseyNumber}>{player.jerseyNumber}</Text>
              </View>
            )}
            <View style={styles.playerInfoColumn}>
              <Text style={styles.playerName}>{player.name}</Text>
              {player.photoURL && (
                <Text style={[styles.playerJerseySmall, { color }]}>#{player.jerseyNumber}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => removePlayer(player.id)}>
              <Ionicons name="close-circle" size={22} color="#ff4444" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Team Info */}
      <Card style={styles.infoCard}>
        <Card.Content>
          {/* Team Logo and Name */}
          <View style={styles.teamHeaderSection}>
            {team?.logo ? (
              <Image source={{ uri: team.logo }} style={styles.teamLogoDisplay} />
            ) : (
              <View style={styles.teamLogoPlaceholder}>
                <Ionicons name="football" size={40} color="#6C63FF" />
              </View>
            )}
          </View>
          <View style={styles.teamInfoRow}>
            <Ionicons name="person" size={20} color="#6C63FF" />
            <Text style={styles.infoLabel}>Manager/Captain:</Text>
            <Text style={styles.infoValue}>{team?.managerName || 'N/A'}</Text>
          </View>
          <View style={styles.teamInfoRow}>
            <Ionicons name="calendar" size={20} color="#6C63FF" />
            <Text style={styles.infoLabel}>Established:</Text>
            <Text style={styles.infoValue}>{team?.yearEstablished || 'N/A'}</Text>
          </View>
          <View style={styles.teamInfoRow}>
            <Ionicons name="people" size={20} color="#6C63FF" />
            <Text style={styles.infoLabel}>Squad Size:</Text>
            <Text style={styles.infoValue}>{players.length} players</Text>
          </View>
          {team?.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText}>{team.description}</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Squad List */}
      <View style={styles.squadHeader}>
        <Text style={styles.squadTitle}>Squad ({players.length})</Text>
        <Button
          mode="outlined"
          onPress={() => setShowAddPlayer(!showAddPlayer)}
          icon={showAddPlayer ? 'close' : 'plus'}
          textColor="#4CAF50"
          style={styles.addButton}
        >
          {showAddPlayer ? 'Cancel' : 'Add Player'}
        </Button>
      </View>

      {/* Add Player Form */}
      {showAddPlayer && (
        <Card style={styles.addPlayerCard}>
          <Card.Content>
            <TextInput
              label="Player Name"
              value={newPlayerName}
              onChangeText={setNewPlayerName}
              style={styles.input}
              theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
            />
            <TextInput
              label="Jersey Number"
              value={newPlayerJersey}
              onChangeText={setNewPlayerJersey}
              keyboardType="number-pad"
              style={styles.input}
              theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
            />
            <TouchableOpacity onPress={() => setShowPositionPicker(!showPositionPicker)}>
              <View pointerEvents="none">
                <TextInput
                  label="Position"
                  value={newPlayerPosition}
                  editable={false}
                  right={<TextInput.Icon icon="chevron-down" />}
                  style={styles.input}
                  theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
                />
              </View>
            </TouchableOpacity>
            {showPositionPicker && (
              <View style={styles.positionPickerContainer}>
                {POSITIONS.map((pos) => (
                  <TouchableOpacity
                    key={pos}
                    style={[
                      styles.positionOption,
                      newPlayerPosition === pos && styles.positionOptionSelected
                    ]}
                    onPress={() => {
                      setNewPlayerPosition(pos);
                      setShowPositionPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.positionOptionText,
                      newPlayerPosition === pos && styles.positionOptionTextSelected
                    ]}>
                      {pos}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Button mode="contained" onPress={addPlayer} style={styles.saveButton}>
              Add Player
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Players by Position */}
      {players.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.emptyText}>No players added yet. Add your squad members!</Text>
          </Card.Content>
        </Card>
      ) : (
        <View>
          {renderPositionGroup('Goalkeepers', goalkeepers, '#FF6B6B')}
          {renderPositionGroup('Defenders', defenders, '#4ECDC4')}
          {renderPositionGroup('Midfielders', midfielders, '#45B7D1')}
          {renderPositionGroup('Forwards', forwards, '#96CEB4')}
        </View>
      )}
    </ScrollView>
  );
}

// Matches Tab Component
function MatchesTab({ teamName }) {
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tournamentDurations, setTournamentDurations] = useState({}); // tournamentId -> matchDuration

  useEffect(() => {
    if (!teamName) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribeFunctions = [];

    const setupListeners = async () => {
      try {
        const tournamentsData = await getTeamTournaments(teamName);
        setTournaments(tournamentsData);
        
        // Load tournament durations
        const durations = {};
        for (const tournament of tournamentsData) {
          try {
            const tournamentData = await getTournamentById(tournament.id);
            if (tournamentData) {
              durations[tournament.id] = tournamentData.matchDuration || 40;
            }
          } catch (error) {
            console.error('Error loading tournament duration:', error);
            durations[tournament.id] = 40; // Default
          }
        }
        setTournamentDurations(durations);
        
        // Set up real-time listeners for matches in each tournament
        unsubscribeFunctions = tournamentsData.map((tournament) => {
          return subscribeToMatchesForTournament(tournament.id, (tournamentMatches) => {
            // Filter matches for this team
            const teamMatches = tournamentMatches
              .filter(m => m.team1Name === teamName || m.team2Name === teamName)
              .map(m => ({ ...m, tournamentId: tournament.id, tournamentName: tournament.name }));
            
            // Update all matches by replacing matches from this tournament with the latest data
            setMatches(prevMatches => {
              // Remove old matches from this tournament
              const otherMatches = prevMatches.filter(m => m.tournamentId !== tournament.id);
              // Add new/updated matches from this tournament (this ensures all match details are up-to-date)
              const updatedMatches = [...otherMatches, ...teamMatches];
              
              // Sort by status priority: Live > Scheduled > Completed
              // Within each status, sort by scheduled time
              updatedMatches.sort((a, b) => {
                // Status priority: live = 0, scheduled = 1, completed = 2
                const getStatusPriority = (status) => {
                  if (status === 'live') return 0;
                  if (status === 'scheduled') return 1;
                  return 2; // completed or any other status
                };
                
                const statusA = getStatusPriority(a.status);
                const statusB = getStatusPriority(b.status);
                
                // If different statuses, sort by status priority
                if (statusA !== statusB) {
                  return statusA - statusB;
                }
                
                // If same status, sort by scheduled time
                if (!a.scheduledTime) return 1;
                if (!b.scheduledTime) return -1;
                return new Date(a.scheduledTime) - new Date(b.scheduledTime);
              });
              
              return updatedMatches;
            });
          });
        });
      } catch (error) {
        console.error('Error loading matches:', error);
      } finally {
        setLoading(false);
      }
    };

    setupListeners();

    // Cleanup listeners on unmount or when teamName changes
    return () => {
      unsubscribeFunctions.forEach(unsub => {
        if (unsub && typeof unsub === 'function') {
          unsub();
        }
      });
    };
  }, [teamName]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading matches...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Active Tournaments */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>
            <Ionicons name="trophy" size={20} color="#6C63FF" /> Active Tournaments
          </Text>
          {tournaments.length === 0 ? (
            <Text style={styles.emptyText}>Not participating in any tournaments yet.</Text>
          ) : (
            tournaments.map((tournament) => (
              <View key={tournament.id} style={styles.tournamentItem}>
                <Text style={styles.tournamentName}>{tournament.name}</Text>
                <Text style={styles.tournamentDates}>
                  {tournament.startDate && tournament.endDate
                    ? `${format(new Date(tournament.startDate), 'MMM dd')} - ${format(new Date(tournament.endDate), 'MMM dd, yyyy')}`
                    : 'Dates TBD'}
                </Text>
                <Text style={styles.tournamentLocation}>
                  <Ionicons name="location" size={14} color="#ccc" /> {tournament.location || 'Location TBD'}
                </Text>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Matches */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>
            <Ionicons name="football" size={20} color="#6C63FF" /> Upcoming & Past Matches
          </Text>
          {matches.length === 0 ? (
            <Text style={styles.emptyText}>No matches scheduled yet.</Text>
          ) : (
            matches.map((match) => (
              <View key={match.id} style={styles.matchItem}>
                <View style={styles.matchTeams}>
                  <View style={styles.teamColumn}>
                    <Text style={[
                      styles.matchTeamName,
                      match.team1Name === teamName && styles.myTeamName
                    ]}>
                      {match.team1Name}
                    </Text>
                    {/* Events for Team 1 */}
                    {match.events && match.events.filter(e => {
                      const isTeam1 = e.team === 'team1' || e.teamName === match.team1Name;
                      return isTeam1;
                    }).length > 0 && (
                      <View style={styles.eventsList}>
                        {match.events
                          .filter(e => e.team === 'team1' || e.teamName === match.team1Name)
                          .map((event, idx) => {
                            const eventIcon = event.type === 'goal' ? 'football' : 
                                            event.type === 'card' ? 'card' : 
                                            event.type === 'injury' ? 'medkit' : 
                                            'information-circle';
                            const eventColor = event.type === 'goal' ? '#4CAF50' : 
                                             event.type === 'card' ? (event.cardType === 'Red Card' ? '#ff4444' : '#ffa500') : 
                                             event.type === 'injury' ? '#ff6b6b' : 
                                             '#6C63FF';
                            return (
                              <View key={event.id || `${match.id}-team1-event-${idx}`} style={styles.eventItem}>
                                <Ionicons name={eventIcon} size={12} color={eventColor} />
                                <Text style={styles.eventText}>
                                  {event.player || 'Player'}{event.minute ? ` ${event.minute}'` : ''}
                                </Text>
                              </View>
                            );
                          })}
                      </View>
                    )}
                  </View>
                  <View style={styles.matchScoreContainer}>
                    {(match.score1 !== null && match.score1 !== undefined) || 
                     (match.score2 !== null && match.score2 !== undefined) ? (
                      <Text style={styles.matchScore}>
                        {match.score1 ?? 0} - {match.score2 ?? 0}
                      </Text>
                    ) : (
                      <Text style={styles.matchVs}>vs</Text>
                    )}
                  </View>
                  <View style={styles.teamColumn}>
                    <Text style={[
                      styles.matchTeamName,
                      match.team2Name === teamName && styles.myTeamName
                    ]}>
                      {match.team2Name}
                    </Text>
                    {/* Events for Team 2 */}
                    {match.events && match.events.filter(e => {
                      const isTeam2 = e.team === 'team2' || e.teamName === match.team2Name;
                      return isTeam2;
                    }).length > 0 && (
                      <View style={styles.eventsList}>
                        {match.events
                          .filter(e => e.team === 'team2' || e.teamName === match.team2Name)
                          .map((event, idx) => {
                            const eventIcon = event.type === 'goal' ? 'football' : 
                                            event.type === 'card' ? 'card' : 
                                            event.type === 'injury' ? 'medkit' : 
                                            'information-circle';
                            const eventColor = event.type === 'goal' ? '#4CAF50' : 
                                             event.type === 'card' ? (event.cardType === 'Red Card' ? '#ff4444' : '#ffa500') : 
                                             event.type === 'injury' ? '#ff6b6b' : 
                                             '#6C63FF';
                            return (
                              <View key={event.id || `${match.id}-team2-event-${idx}`} style={styles.eventItem}>
                                <Ionicons name={eventIcon} size={12} color={eventColor} />
                                <Text style={styles.eventText}>
                                  {event.player || 'Player'}{event.minute ? ` ${event.minute}'` : ''}
                                </Text>
                              </View>
                            );
                          })}
                      </View>
                    )}
                  </View>
                </View>
                {match.scheduledTime && (
                  <Text style={styles.matchTime}>
                    {format(new Date(match.scheduledTime), 'MMM dd, yyyy h:mm a')}
                  </Text>
                )}
                
                {/* Match Timer - Show when live */}
                {match.status === 'live' && (
                  <MatchTimer
                    key={`timer-${match.id}-${match.timer?.startTime || 'no-timer'}`}
                    match={match}
                    matchDuration={tournamentDurations[match.tournamentId] || match.matchDuration || 40}
                    isOrganizer={false}
                  />
                )}
                
                {/* Half Time Status - Show when timer is paused */}
                {match.status === 'live' && match.timer?.isPaused && (
                  <View style={styles.halfTimeBadge}>
                    <Ionicons name="pause-circle" size={16} color="#ffa500" />
                    <Text style={styles.halfTimeText}>Half Time</Text>
                  </View>
                )}
                
                <View style={[
                  styles.statusBadge,
                  match.status === 'completed' && styles.statusCompleted,
                  match.status === 'live' && styles.statusLive,
                ]}>
                  <Text style={styles.statusText}>{match.status || 'scheduled'}</Text>
                </View>
                
              </View>
            ))
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

// Tables Tab Component
function TablesTab({ teamName }) {
  const [tournaments, setTournaments] = useState([]);
  const [standingsData, setStandingsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load standings when tab is focused
  useFocusEffect(
    useCallback(() => {
      loadStandings();
    }, [teamName])
  );

  const loadStandings = async () => {
    if (!teamName) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get tournaments this team is participating in
      const tournamentsData = await getTeamTournaments(teamName);
      setTournaments(tournamentsData);

      // For each tournament, calculate standings
      const allStandings = [];
      for (const tournament of tournamentsData) {
        const matches = await getMatchesForTournament(tournament.id);
        
        // Get all teams in this tournament
        const openTeams = tournament.openTeams || [];
        const teams35Plus = tournament.teams35Plus || [];
        
        // Calculate standings for each category
        if (openTeams.length > 0) {
          const openResult = calculateStandings(openTeams, matches);
          allStandings.push({
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            category: 'Open Category',
            standings: openResult.standings,
            hasCompletedMatches: openResult.hasCompletedMatches,
          });
        }
        
        if (teams35Plus.length > 0) {
          const plus35Result = calculateStandings(teams35Plus, matches);
          allStandings.push({
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            category: '35+ Category',
            standings: plus35Result.standings,
            hasCompletedMatches: plus35Result.hasCompletedMatches,
          });
        }
      }
      
      setStandingsData(allStandings);
    } catch (error) {
      console.error('Error loading standings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate standings from completed matches
  const calculateStandings = (teams, allMatches) => {
    const teamStats = {};
    
    // Initialize stats for all teams
    teams.forEach(teamName => {
      teamStats[teamName] = {
        name: teamName,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      };
    });

    // Process completed matches
    const completedMatches = allMatches.filter(m => m.status === 'completed');
    const hasCompletedMatches = completedMatches.length > 0;
    
    completedMatches.forEach(match => {
      const team1 = match.team1Name;
      const team2 = match.team2Name;
      const score1 = parseInt(match.score1) || 0;
      const score2 = parseInt(match.score2) || 0;

      // Only process if both teams are in our list
      if (teamStats[team1] && teamStats[team2]) {
        // Update played
        teamStats[team1].played += 1;
        teamStats[team2].played += 1;

        // Update goals
        teamStats[team1].goalsFor += score1;
        teamStats[team1].goalsAgainst += score2;
        teamStats[team2].goalsFor += score2;
        teamStats[team2].goalsAgainst += score1;

        // Determine winner and update points
        if (score1 > score2) {
          // Team 1 wins
          teamStats[team1].wins += 1;
          teamStats[team1].points += 3;
          teamStats[team2].losses += 1;
        } else if (score2 > score1) {
          // Team 2 wins
          teamStats[team2].wins += 1;
          teamStats[team2].points += 3;
          teamStats[team1].losses += 1;
        } else {
          // Draw
          teamStats[team1].draws += 1;
          teamStats[team1].points += 1;
          teamStats[team2].draws += 1;
          teamStats[team2].points += 1;
        }
      }
    });

    // Convert to array and sort by points (then goal difference, then goals for)
    const sortedStandings = Object.values(teamStats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.goalsFor - a.goalsAgainst;
      const gdB = b.goalsFor - b.goalsAgainst;
      if (gdB !== gdA) return gdB - gdA;
      return b.goalsFor - a.goalsFor;
    });
    
    return { standings: sortedStandings, hasCompletedMatches };
  };

  const renderTable = (data) => {
    const { tournamentName, category, standings, hasCompletedMatches } = data;
    
    if (standings.length === 0) return null;

    return (
      <Card key={`${data.tournamentId}-${category}`} style={styles.tableCard}>
        <Card.Content>
          <Text style={styles.tableTournamentName}>{tournamentName}</Text>
          <Text style={styles.tableCategory}>{category}</Text>
          
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.posCell]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.teamCell]}>Team</Text>
            <Text style={[styles.tableHeaderCell, styles.statCell]}>P</Text>
            <Text style={[styles.tableHeaderCell, styles.statCell]}>W</Text>
            <Text style={[styles.tableHeaderCell, styles.statCell]}>D</Text>
            <Text style={[styles.tableHeaderCell, styles.statCell]}>L</Text>
            <Text style={[styles.tableHeaderCell, styles.statCell]}>GF</Text>
            <Text style={[styles.tableHeaderCell, styles.statCell]}>GA</Text>
            <Text style={[styles.tableHeaderCell, styles.ptsCell]}>PTS</Text>
          </View>

          {/* Table Rows */}
          {standings.map((team, index) => (
            <View 
              key={team.name} 
              style={[
                styles.tableRow,
                hasCompletedMatches && index === 0 && styles.firstPlaceRow,
                hasCompletedMatches && index === 1 && styles.secondPlaceRow,
                hasCompletedMatches && index === 2 && styles.thirdPlaceRow,
                team.name === teamName && styles.myTeamRow,
              ]}
            >
              <Text style={[styles.tableCell, styles.posCell, styles.posText]}>
                {hasCompletedMatches ? index + 1 : 0}
              </Text>
              <Text 
                style={[
                  styles.tableCell, 
                  styles.teamCell, 
                  styles.teamText,
                  team.name === teamName && styles.myTeamText
                ]} 
                numberOfLines={1}
              >
                {team.name}
              </Text>
              <Text style={[styles.tableCell, styles.statCell]}>{team.played}</Text>
              <Text style={[styles.tableCell, styles.statCell, styles.winText]}>{team.wins}</Text>
              <Text style={[styles.tableCell, styles.statCell, styles.drawText]}>{team.draws}</Text>
              <Text style={[styles.tableCell, styles.statCell, styles.lossText]}>{team.losses}</Text>
              <Text style={[styles.tableCell, styles.statCell]}>{team.goalsFor}</Text>
              <Text style={[styles.tableCell, styles.statCell]}>{team.goalsAgainst}</Text>
              <Text style={[styles.tableCell, styles.ptsCell, styles.ptsText]}>{team.points}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading standings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {tournaments.length === 0 ? (
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.emptyText}>
              Not participating in any tournaments yet. Standings will appear here once you join a tournament.
            </Text>
          </Card.Content>
        </Card>
      ) : standingsData.length === 0 ? (
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.emptyText}>
              No standings available yet. Standings will update once matches are completed.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <>
          {/* My Position Summary */}
          {standingsData.map(data => {
            const myPosition = data.standings.findIndex(t => t.name === teamName) + 1;
            const myStats = data.standings.find(t => t.name === teamName);
            if (!myStats) return null;
            
            return (
              <Card key={`summary-${data.tournamentId}-${data.category}`} style={styles.summaryCard}>
                <Card.Content>
                  <View style={styles.summaryHeader}>
                    <Text style={styles.summaryTournament}>{data.tournamentName}</Text>
                    <Text style={styles.summaryCategory}>{data.category}</Text>
                  </View>
                  <View style={styles.summaryStats}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryNumber}>{myPosition}</Text>
                      <Text style={styles.summaryLabel}>Position</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryNumber}>{myStats.points}</Text>
                      <Text style={styles.summaryLabel}>Points</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryNumber}>{myStats.played}</Text>
                      <Text style={styles.summaryLabel}>Played</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryNumber, { color: '#4CAF50' }]}>{myStats.wins}</Text>
                      <Text style={styles.summaryLabel}>Wins</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            );
          })}

          {/* Full Tables */}
          {standingsData.map(data => renderTable(data))}
        </>
      )}
    </ScrollView>
  );
}

// Formation Tab Component
function FormationTab({ team }) {
  const [players, setPlayers] = useState([]);
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [assignedPlayers, setAssignedPlayers] = useState(null);
  const [selectedPlayerForSwap, setSelectedPlayerForSwap] = useState(null);

  useEffect(() => {
    if (team?.players) {
      setPlayers(team.players);
      generateRecommendations(team.players);
    }
  }, [team]);

  // Auto-assign players when formation changes
  useEffect(() => {
    if (selectedFormation && players.length > 0) {
      assignPlayersToFormation(selectedFormation, players);
      setSelectedPlayerForSwap(null); // Reset selection when formation changes
    }
  }, [selectedFormation, players]);

  // Analyze players by position
  const analyzePlayers = (players) => {
    const analysis = {
      goalkeepers: players.filter(p => p.position === 'Goalkeeper'),
      defenders: players.filter(p => p.position === 'Defender'),
      midfielders: players.filter(p => p.position === 'Midfielder'),
      forwards: players.filter(p => p.position === 'Forward'),
    };
    return analysis;
  };

  // Generate formation recommendations
  const generateRecommendations = (players) => {
    if (!players || players.length === 0) {
      setRecommendations([]);
      return;
    }

    const analysis = analyzePlayers(players);
    const total = players.length;
    const gkCount = analysis.goalkeepers.length;
    const defCount = analysis.defenders.length;
    const midCount = analysis.midfielders.length;
    const fwdCount = analysis.forwards.length;

    const recs = [];

    // Defensive Formations
    if (defCount >= 3 && midCount >= 2) {
      recs.push({
        name: '3-2-1',
        type: 'defensive',
        description: 'Strong defensive formation with 3 defenders. Best for protecting a lead or playing against strong attacking teams.',
        positions: { defenders: 3, midfielders: 2, forwards: 1 },
        suitability: calculateSuitability(defCount, midCount, fwdCount, 3, 2, 1),
        icon: '🛡️',
      });
    }

    if (defCount >= 2 && midCount >= 3) {
      recs.push({
        name: '2-3-1',
        type: 'defensive',
        description: 'Defensive formation with strong midfield control. Good for maintaining possession and counter-attacking.',
        positions: { defenders: 2, midfielders: 3, forwards: 1 },
        suitability: calculateSuitability(defCount, midCount, fwdCount, 2, 3, 1),
        icon: '🛡️',
      });
    }

    if (defCount >= 3 && midCount >= 1 && fwdCount >= 2) {
      recs.push({
        name: '3-1-2',
        type: 'defensive',
        description: 'Balanced defensive formation. Solid at the back with attacking options.',
        positions: { defenders: 3, midfielders: 1, forwards: 2 },
        suitability: calculateSuitability(defCount, midCount, fwdCount, 3, 1, 2),
        icon: '⚖️',
      });
    }

    // Balanced Formations
    if (defCount >= 2 && midCount >= 2 && fwdCount >= 2) {
      recs.push({
        name: '2-2-2',
        type: 'balanced',
        description: 'Well-balanced formation. Equal strength in defense, midfield, and attack. Versatile and adaptable.',
        positions: { defenders: 2, midfielders: 2, forwards: 2 },
        suitability: calculateSuitability(defCount, midCount, fwdCount, 2, 2, 2),
        icon: '⚖️',
      });
    }

    if (defCount >= 2 && midCount >= 2 && fwdCount >= 1) {
      recs.push({
        name: '2-2-1',
        type: 'balanced',
        description: 'Balanced formation with defensive stability. Good for teams with strong midfield.',
        positions: { defenders: 2, midfielders: 2, forwards: 1 },
        suitability: calculateSuitability(defCount, midCount, fwdCount, 2, 2, 1),
        icon: '⚖️',
      });
    }

    // Offensive Formations
    if (defCount >= 2 && midCount >= 1 && fwdCount >= 3) {
      recs.push({
        name: '2-1-3',
        type: 'offensive',
        description: 'Attacking formation with 3 forwards. Best for teams that need to score goals and have strong forwards.',
        positions: { defenders: 2, midfielders: 1, forwards: 3 },
        suitability: calculateSuitability(defCount, midCount, fwdCount, 2, 1, 3),
        icon: '⚡',
      });
    }

    if (defCount >= 1 && midCount >= 3 && fwdCount >= 2) {
      recs.push({
        name: '1-3-2',
        type: 'offensive',
        description: 'Very attacking formation. High risk, high reward. Best when you need to score.',
        positions: { defenders: 1, midfielders: 3, forwards: 2 },
        suitability: calculateSuitability(defCount, midCount, fwdCount, 1, 3, 2),
        icon: '⚡',
      });
    }

    if (defCount >= 2 && midCount >= 1 && fwdCount >= 2) {
      recs.push({
        name: '2-1-2',
        type: 'offensive',
        description: 'Attacking formation with good forward options. Balanced between attack and defense.',
        positions: { defenders: 2, midfielders: 1, forwards: 2 },
        suitability: calculateSuitability(defCount, midCount, fwdCount, 2, 1, 2),
        icon: '⚡',
      });
    }

    // Sort by suitability (highest first)
    recs.sort((a, b) => b.suitability - a.suitability);
    setRecommendations(recs);

    // Auto-select best recommendation
    if (recs.length > 0) {
      setSelectedFormation(recs[0]);
    }
  };

  // Calculate how suitable a formation is based on available players
  const calculateSuitability = (defCount, midCount, fwdCount, reqDef, reqMid, reqFwd) => {
    let score = 100;
    
    // Penalize if we don't have enough players for a position
    if (defCount < reqDef) score -= (reqDef - defCount) * 20;
    if (midCount < reqMid) score -= (reqMid - midCount) * 20;
    if (fwdCount < reqFwd) score -= (reqFwd - fwdCount) * 20;
    
    // Bonus if we have extra players (flexibility)
    if (defCount > reqDef) score += Math.min((defCount - reqDef) * 5, 10);
    if (midCount > reqMid) score += Math.min((midCount - reqMid) * 5, 10);
    if (fwdCount > reqFwd) score += Math.min((fwdCount - reqFwd) * 5, 10);
    
    return Math.max(0, Math.min(100, score));
  };

  // Assign players to formation positions
  const assignPlayersToFormation = (formation, allPlayers) => {
    const analysis = analyzePlayers(allPlayers);
    const { defenders: reqDef, midfielders: reqMid, forwards: reqFwd } = formation.positions;
    
    const assignment = {
      goalkeeper: null,
      defenders: [],
      midfielders: [],
      forwards: [],
      substitutes: [],
    };

    const usedPlayerIds = new Set();

    // Assign goalkeeper (required)
    if (analysis.goalkeepers.length > 0) {
      assignment.goalkeeper = analysis.goalkeepers[0];
      usedPlayerIds.add(analysis.goalkeepers[0].id);
    }

    // Assign defenders - prioritize actual defenders
    const availableDefenders = analysis.defenders.filter(p => !usedPlayerIds.has(p.id));
    const defendersToAssign = Math.min(reqDef, availableDefenders.length);
    assignment.defenders = availableDefenders.slice(0, defendersToAssign);
    assignment.defenders.forEach(p => usedPlayerIds.add(p.id));
    
    // If we need more defenders, use midfielders who can play defense
    if (defendersToAssign < reqDef) {
      const needed = reqDef - defendersToAssign;
      const availableMidfielders = analysis.midfielders.filter(p => !usedPlayerIds.has(p.id));
      const flexibleMidfielders = availableMidfielders.slice(0, needed);
      assignment.defenders = [...assignment.defenders, ...flexibleMidfielders];
      flexibleMidfielders.forEach(p => usedPlayerIds.add(p.id));
    }

    // Assign midfielders - prioritize actual midfielders
    const availableMidfielders = analysis.midfielders.filter(p => !usedPlayerIds.has(p.id));
    const midfieldersToAssign = Math.min(reqMid, availableMidfielders.length);
    assignment.midfielders = availableMidfielders.slice(0, midfieldersToAssign);
    assignment.midfielders.forEach(p => usedPlayerIds.add(p.id));
    
    // If we need more midfielders, use forwards who can play midfield
    if (midfieldersToAssign < reqMid) {
      const needed = reqMid - midfieldersToAssign;
      const availableForwards = analysis.forwards.filter(p => !usedPlayerIds.has(p.id));
      const flexibleForwards = availableForwards.slice(0, needed);
      assignment.midfielders = [...assignment.midfielders, ...flexibleForwards];
      flexibleForwards.forEach(p => usedPlayerIds.add(p.id));
    }

    // Assign forwards - prioritize actual forwards
    const availableForwards = analysis.forwards.filter(p => !usedPlayerIds.has(p.id));
    const forwardsToAssign = Math.min(reqFwd, availableForwards.length);
    assignment.forwards = availableForwards.slice(0, forwardsToAssign);
    assignment.forwards.forEach(p => usedPlayerIds.add(p.id));
    
    // If we need more forwards, use remaining midfielders
    if (forwardsToAssign < reqFwd) {
      const needed = reqFwd - forwardsToAssign;
      const remainingMidfielders = analysis.midfielders.filter(p => !usedPlayerIds.has(p.id));
      const flexibleMidfielders = remainingMidfielders.slice(0, needed);
      assignment.forwards = [...assignment.forwards, ...flexibleMidfielders];
      flexibleMidfielders.forEach(p => usedPlayerIds.add(p.id));
    }

    // Remaining players go to substitutes
    assignment.substitutes = allPlayers.filter(p => !usedPlayerIds.has(p.id));

    setAssignedPlayers(assignment);
  };

  // Handle player swap
  const handlePlayerSwap = (player, fromPosition, fromIndex) => {
    if (!assignedPlayers) return;

    // If no player is selected, select this player
    if (!selectedPlayerForSwap) {
      setSelectedPlayerForSwap({ player, fromPosition, fromIndex });
      return;
    }

    // If same player is clicked, deselect
    if (selectedPlayerForSwap.player.id === player.id && 
        selectedPlayerForSwap.fromPosition === fromPosition &&
        selectedPlayerForSwap.fromIndex === fromIndex) {
      setSelectedPlayerForSwap(null);
      return;
    }

    // Perform swap
    const newAssignment = { ...assignedPlayers };
    const selected = selectedPlayerForSwap.player;
    const target = player;

    // Remove selected player from its current position
    if (selectedPlayerForSwap.fromPosition === 'goalkeeper') {
      newAssignment.goalkeeper = null;
    } else {
      const fromArray = [...newAssignment[selectedPlayerForSwap.fromPosition]];
      fromArray.splice(selectedPlayerForSwap.fromIndex, 1);
      newAssignment[selectedPlayerForSwap.fromPosition] = fromArray;
    }

    // Remove target player from its current position
    if (fromPosition === 'goalkeeper') {
      newAssignment.goalkeeper = null;
    } else if (fromPosition === 'substitutes') {
      const fromSubs = [...newAssignment.substitutes];
      fromSubs.splice(fromIndex, 1);
      newAssignment.substitutes = fromSubs;
    } else {
      const fromArray = [...newAssignment[fromPosition]];
      fromArray.splice(fromIndex, 1);
      newAssignment[fromPosition] = fromArray;
    }

    // Add selected player to target position
    if (fromPosition === 'goalkeeper') {
      newAssignment.goalkeeper = selected;
    } else if (fromPosition === 'substitutes') {
      newAssignment.substitutes = [...newAssignment.substitutes, selected];
    } else {
      const toArray = [...newAssignment[fromPosition]];
      toArray.splice(fromIndex, 0, selected);
      newAssignment[fromPosition] = toArray;
    }

    // Add target player to selected player's original position
    if (selectedPlayerForSwap.fromPosition === 'goalkeeper') {
      newAssignment.goalkeeper = target;
    } else if (selectedPlayerForSwap.fromPosition === 'substitutes') {
      newAssignment.substitutes = [...newAssignment.substitutes, target];
    } else {
      const toArray = [...newAssignment[selectedPlayerForSwap.fromPosition]];
      toArray.splice(selectedPlayerForSwap.fromIndex, 0, target);
      newAssignment[selectedPlayerForSwap.fromPosition] = toArray;
    }

    setAssignedPlayers(newAssignment);
    setSelectedPlayerForSwap(null);
  };

  // Move player to substitutes
  const moveToSubstitutes = (player, fromPosition, fromIndex) => {
    if (!assignedPlayers) return;

    const newAssignment = { ...assignedPlayers };

    // Remove from current position
    if (fromPosition === 'goalkeeper') {
      newAssignment.goalkeeper = null;
    } else {
      const fromArray = [...newAssignment[fromPosition]];
      fromArray.splice(fromIndex, 1);
      newAssignment[fromPosition] = fromArray;
    }

    // Add to substitutes
    newAssignment.substitutes = [...newAssignment.substitutes, player];

    setAssignedPlayers(newAssignment);
    setSelectedPlayerForSwap(null);
  };

  // Move player from substitutes to a position
  const moveFromSubstitutes = (player, toPosition, toIndex) => {
    if (!assignedPlayers) return;

    const newAssignment = { ...assignedPlayers };

    // Remove from substitutes
    const subs = [...newAssignment.substitutes];
    const subIndex = subs.findIndex(p => p.id === player.id);
    if (subIndex !== -1) {
      subs.splice(subIndex, 1);
      newAssignment.substitutes = subs;
    }

    // Add to target position
    if (toPosition === 'goalkeeper') {
      // If there's already a goalkeeper, move it to substitutes
      if (newAssignment.goalkeeper) {
        newAssignment.substitutes = [...newAssignment.substitutes, newAssignment.goalkeeper];
      }
      newAssignment.goalkeeper = player;
    } else {
      const toArray = [...newAssignment[toPosition]];
      // Insert at the specified index, or append if index is beyond array length
      if (toIndex >= 0 && toIndex <= toArray.length) {
        toArray.splice(toIndex, 0, player);
      } else {
        toArray.push(player);
      }
      newAssignment[toPosition] = toArray;
    }

    setAssignedPlayers(newAssignment);
    setSelectedPlayerForSwap(null);
  };

  // Render formation diagram with assigned players
  const renderFormation = (formation) => {
    if (!formation || !assignedPlayers) return null;

    const { defenders, midfielders, forwards } = formation.positions;
    
    return (
      <View style={styles.formationDiagram}>
        {/* Goalkeeper */}
        <View style={styles.formationRow}>
          {assignedPlayers.goalkeeper ? (
            <View style={[styles.positionDot, styles.gkDot, styles.positionDotWithPlayer]}>
              <Text style={styles.positionLabelSmall}>
                {assignedPlayers.goalkeeper.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
              <Text style={styles.positionLabelTiny}>#{assignedPlayers.goalkeeper.jerseyNumber}</Text>
            </View>
          ) : (
            <View style={[styles.positionDot, styles.gkDot]}>
              <Text style={styles.positionLabel}>GK</Text>
            </View>
          )}
        </View>
        
        {/* Defenders */}
        <View style={styles.formationRow}>
          {Array.from({ length: defenders }).map((_, i) => {
            const player = assignedPlayers.defenders[i];
            return player ? (
              <View key={`def-${i}`} style={[styles.positionDot, styles.defDot, styles.positionDotWithPlayer]}>
                <Text style={styles.positionLabelSmall}>
                  {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </Text>
                <Text style={styles.positionLabelTiny}>#{player.jerseyNumber}</Text>
              </View>
            ) : (
              <View key={`def-${i}`} style={[styles.positionDot, styles.defDot]}>
                <Text style={styles.positionLabel}>D</Text>
              </View>
            );
          })}
        </View>
        
        {/* Midfielders */}
        <View style={styles.formationRow}>
          {Array.from({ length: midfielders }).map((_, i) => {
            const player = assignedPlayers.midfielders[i];
            return player ? (
              <View key={`mid-${i}`} style={[styles.positionDot, styles.midDot, styles.positionDotWithPlayer]}>
                <Text style={styles.positionLabelSmall}>
                  {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </Text>
                <Text style={styles.positionLabelTiny}>#{player.jerseyNumber}</Text>
              </View>
            ) : (
              <View key={`mid-${i}`} style={[styles.positionDot, styles.midDot]}>
                <Text style={styles.positionLabel}>M</Text>
              </View>
            );
          })}
        </View>
        
        {/* Forwards */}
        <View style={styles.formationRow}>
          {Array.from({ length: forwards }).map((_, i) => {
            const player = assignedPlayers.forwards[i];
            return player ? (
              <View key={`fwd-${i}`} style={[styles.positionDot, styles.fwdDot, styles.positionDotWithPlayer]}>
                <Text style={styles.positionLabelSmall}>
                  {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </Text>
                <Text style={styles.positionLabelTiny}>#{player.jerseyNumber}</Text>
              </View>
            ) : (
              <View key={`fwd-${i}`} style={[styles.positionDot, styles.fwdDot]}>
                <Text style={styles.positionLabel}>F</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const analysis = analyzePlayers(players);

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Player Analysis */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            <Ionicons name="analytics" size={20} color="#6C63FF" /> Squad Analysis
          </Text>
          <View style={styles.analysisGrid}>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisNumber}>{analysis.goalkeepers.length}</Text>
              <Text style={styles.analysisLabel}>Goalkeepers</Text>
            </View>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisNumber}>{analysis.defenders.length}</Text>
              <Text style={styles.analysisLabel}>Defenders</Text>
            </View>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisNumber}>{analysis.midfielders.length}</Text>
              <Text style={styles.analysisLabel}>Midfielders</Text>
            </View>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisNumber}>{analysis.forwards.length}</Text>
              <Text style={styles.analysisLabel}>Forwards</Text>
            </View>
          </View>
          <Text style={styles.totalPlayers}>Total Players: {players.length}</Text>
        </Card.Content>
      </Card>

      {players.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.emptyText}>
              Add players to your squad to get formation recommendations.
            </Text>
          </Card.Content>
        </Card>
      ) : players.length < 7 ? (
        <Card style={styles.warningCard}>
          <Card.Content>
            <Text style={styles.warningText}>
              ⚠️ You need at least 7 players (including 1 goalkeeper) for a 7v7 formation.
              Currently you have {players.length} players.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <>
          {/* Selected Formation */}
          {selectedFormation && (
            <Card style={styles.selectedFormationCard}>
              <Card.Content>
                <View style={styles.formationHeader}>
                  <Text variant="titleLarge" style={styles.formationName}>
                    {selectedFormation.icon} {selectedFormation.name}
                  </Text>
                  <View style={[
                    styles.formationTypeBadge,
                    selectedFormation.type === 'defensive' && styles.defensiveBadge,
                    selectedFormation.type === 'balanced' && styles.balancedBadge,
                    selectedFormation.type === 'offensive' && styles.offensiveBadge,
                  ]}>
                    <Text style={styles.formationTypeText}>
                      {selectedFormation.type.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.formationDescription}>
                  {selectedFormation.description}
                </Text>
                <View style={styles.suitabilityBar}>
                  <Text style={styles.suitabilityLabel}>Suitability: {selectedFormation.suitability}%</Text>
                  <View style={styles.suitabilityBarBg}>
                    <View 
                      style={[
                        styles.suitabilityBarFill,
                        { width: `${selectedFormation.suitability}%` }
                      ]}
                    />
                  </View>
                </View>
                {renderFormation(selectedFormation)}
                
                {/* Assigned Players List */}
                {assignedPlayers && (
                  <View style={styles.assignedPlayersSection}>
                    <View style={styles.assignedPlayersHeader}>
                      <Text style={styles.assignedPlayersTitle}>Lineup</Text>
                      {selectedPlayerForSwap && (
                        <Text style={styles.swapHint}>
                          Tap a player to swap, or tap SUB to move to substitutes
                        </Text>
                      )}
                    </View>
                    
                    {/* Goalkeeper */}
                    {assignedPlayers.goalkeeper && (
                      <TouchableOpacity
                        onPress={() => handlePlayerSwap(assignedPlayers.goalkeeper, 'goalkeeper', 0)}
                        style={[
                          styles.playerAssignmentRow,
                          selectedPlayerForSwap?.fromPosition === 'goalkeeper' && styles.playerRowSelected
                        ]}
                      >
                        <View style={[styles.positionBadge, styles.gkBadge]}>
                          <Text style={styles.positionBadgeText}>GK</Text>
                        </View>
                        <Text style={styles.assignedPlayerName}>
                          #{assignedPlayers.goalkeeper.jerseyNumber} {assignedPlayers.goalkeeper.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => moveToSubstitutes(assignedPlayers.goalkeeper, 'goalkeeper', 0)}
                          style={styles.subButton}
                        >
                          <Text style={styles.subButtonText}>SUB</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    )}
                    
                    {/* Defenders */}
                    {assignedPlayers.defenders.map((player, index) => (
                      <TouchableOpacity
                        key={`def-assign-${index}`}
                        onPress={() => handlePlayerSwap(player, 'defenders', index)}
                        style={[
                          styles.playerAssignmentRow,
                          selectedPlayerForSwap?.fromPosition === 'defenders' && 
                          selectedPlayerForSwap?.fromIndex === index && 
                          styles.playerRowSelected
                        ]}
                      >
                        <View style={[styles.positionBadge, styles.defBadge]}>
                          <Text style={styles.positionBadgeText}>D{index + 1}</Text>
                        </View>
                        <Text style={styles.assignedPlayerName}>
                          #{player.jerseyNumber} {player.name}
                        </Text>
                        {player.position !== 'Defender' && (
                          <Text style={styles.flexiblePosition}>({player.position})</Text>
                        )}
                        <TouchableOpacity
                          onPress={() => moveToSubstitutes(player, 'defenders', index)}
                          style={styles.subButton}
                        >
                          <Text style={styles.subButtonText}>SUB</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                    
                    {/* Midfielders */}
                    {assignedPlayers.midfielders.map((player, index) => (
                      <TouchableOpacity
                        key={`mid-assign-${index}`}
                        onPress={() => handlePlayerSwap(player, 'midfielders', index)}
                        style={[
                          styles.playerAssignmentRow,
                          selectedPlayerForSwap?.fromPosition === 'midfielders' && 
                          selectedPlayerForSwap?.fromIndex === index && 
                          styles.playerRowSelected
                        ]}
                      >
                        <View style={[styles.positionBadge, styles.midBadge]}>
                          <Text style={styles.positionBadgeText}>M{index + 1}</Text>
                        </View>
                        <Text style={styles.assignedPlayerName}>
                          #{player.jerseyNumber} {player.name}
                        </Text>
                        {player.position !== 'Midfielder' && (
                          <Text style={styles.flexiblePosition}>({player.position})</Text>
                        )}
                        <TouchableOpacity
                          onPress={() => moveToSubstitutes(player, 'midfielders', index)}
                          style={styles.subButton}
                        >
                          <Text style={styles.subButtonText}>SUB</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                    
                    {/* Forwards */}
                    {assignedPlayers.forwards.map((player, index) => (
                      <TouchableOpacity
                        key={`fwd-assign-${index}`}
                        onPress={() => handlePlayerSwap(player, 'forwards', index)}
                        style={[
                          styles.playerAssignmentRow,
                          selectedPlayerForSwap?.fromPosition === 'forwards' && 
                          selectedPlayerForSwap?.fromIndex === index && 
                          styles.playerRowSelected
                        ]}
                      >
                        <View style={[styles.positionBadge, styles.fwdBadge]}>
                          <Text style={styles.positionBadgeText}>F{index + 1}</Text>
                        </View>
                        <Text style={styles.assignedPlayerName}>
                          #{player.jerseyNumber} {player.name}
                        </Text>
                        {player.position !== 'Forward' && (
                          <Text style={styles.flexiblePosition}>({player.position})</Text>
                        )}
                        <TouchableOpacity
                          onPress={() => moveToSubstitutes(player, 'forwards', index)}
                          style={styles.subButton}
                        >
                          <Text style={styles.subButtonText}>SUB</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                    
                    {/* Substitutes */}
                    {assignedPlayers.substitutes.length > 0 && (
                      <>
                        <Text style={styles.substitutesTitle}>
                          Substitutes ({assignedPlayers.substitutes.length})
                          {selectedPlayerForSwap && (
                            <Text style={styles.swapHintSmall}> - Tap to add to lineup</Text>
                          )}
                        </Text>
                        {assignedPlayers.substitutes.map((player, index) => {
                          // Determine best position for this player
                          const getBestPosition = () => {
                            if (player.position === 'Goalkeeper') return 'goalkeeper';
                            if (player.position === 'Defender') {
                              // Find first empty defender spot or add to end
                              const reqDef = selectedFormation?.positions?.defenders || 0;
                              if (assignedPlayers.defenders.length < reqDef) {
                                return { position: 'defenders', index: assignedPlayers.defenders.length };
                              }
                            }
                            if (player.position === 'Midfielder') {
                              const reqMid = selectedFormation?.positions?.midfielders || 0;
                              if (assignedPlayers.midfielders.length < reqMid) {
                                return { position: 'midfielders', index: assignedPlayers.midfielders.length };
                              }
                            }
                            if (player.position === 'Forward') {
                              const reqFwd = selectedFormation?.positions?.forwards || 0;
                              if (assignedPlayers.forwards.length < reqFwd) {
                                return { position: 'forwards', index: assignedPlayers.forwards.length };
                              }
                            }
                            // Default: try to add to any position that needs players
                            const reqDef = selectedFormation?.positions?.defenders || 0;
                            const reqMid = selectedFormation?.positions?.midfielders || 0;
                            const reqFwd = selectedFormation?.positions?.forwards || 0;
                            if (assignedPlayers.defenders.length < reqDef) {
                              return { position: 'defenders', index: assignedPlayers.defenders.length };
                            }
                            if (assignedPlayers.midfielders.length < reqMid) {
                              return { position: 'midfielders', index: assignedPlayers.midfielders.length };
                            }
                            if (assignedPlayers.forwards.length < reqFwd) {
                              return { position: 'forwards', index: assignedPlayers.forwards.length };
                            }
                            return null;
                          };

                          const bestPos = getBestPosition();
                          
                          return (
                            <TouchableOpacity
                              key={`sub-${index}`}
                              onPress={() => {
                                if (bestPos) {
                                  moveFromSubstitutes(player, bestPos.position, bestPos.index);
                                } else {
                                  handlePlayerSwap(player, 'substitutes', index);
                                }
                              }}
                              style={[
                                styles.playerAssignmentRow,
                                selectedPlayerForSwap?.fromPosition === 'substitutes' && 
                                selectedPlayerForSwap?.fromIndex === index && 
                                styles.playerRowSelected
                              ]}
                            >
                              <View style={[styles.positionBadge, styles.subBadge]}>
                                <Text style={styles.positionBadgeText}>SUB</Text>
                              </View>
                              <Text style={styles.assignedPlayerName}>
                                #{player.jerseyNumber} {player.name} ({player.position})
                              </Text>
                              {bestPos && (
                                <TouchableOpacity
                                  onPress={() => moveFromSubstitutes(player, bestPos.position, bestPos.index)}
                                  style={styles.addButton}
                                >
                                  <Ionicons name="add-circle" size={20} color="#4CAF50" />
                                </TouchableOpacity>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </>
                    )}
                  </View>
                )}
              </Card.Content>
            </Card>
          )}

          {/* All Recommendations */}
          <Card style={styles.recommendationsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                <Ionicons name="bulb" size={20} color="#6C63FF" /> Recommended Formations
              </Text>
              {recommendations.map((formation, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedFormation(formation)}
                  style={[
                    styles.recommendationItem,
                    selectedFormation?.name === formation.name && styles.recommendationItemSelected
                  ]}
                >
                  <View style={styles.recommendationHeader}>
                    <Text style={styles.recommendationName}>
                      {formation.icon} {formation.name}
                    </Text>
                    <View style={[
                      styles.formationTypeBadgeSmall,
                      formation.type === 'defensive' && styles.defensiveBadge,
                      formation.type === 'balanced' && styles.balancedBadge,
                      formation.type === 'offensive' && styles.offensiveBadge,
                    ]}>
                      <Text style={styles.formationTypeTextSmall}>
                        {formation.type}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.recommendationDesc} numberOfLines={2}>
                    {formation.description}
                  </Text>
                  <View style={styles.recommendationFooter}>
                    <Text style={styles.suitabilityText}>
                      Suitability: {formation.suitability}%
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#6C63FF" />
                  </View>
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>

          {/* Formation Tips */}
          <Card style={styles.tipsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                <Ionicons name="information-circle" size={20} color="#6C63FF" /> Formation Tips
              </Text>
              <View style={styles.tipItem}>
                <Text style={styles.tipTitle}>🛡️ Defensive Formations</Text>
                <Text style={styles.tipText}>
                  Use when protecting a lead, playing against strong teams, or in the final minutes of a match.
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipTitle}>⚖️ Balanced Formations</Text>
                <Text style={styles.tipText}>
                  Best for most situations. Provides stability in defense while maintaining attacking options.
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipTitle}>⚡ Offensive Formations</Text>
                <Text style={styles.tipText}>
                  Use when you need to score goals, are trailing, or playing against weaker teams.
                </Text>
              </View>
            </Card.Content>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f0f1e',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f0f1e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f1e',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a1a2e',
  },
  teamName: {
    color: '#fff',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#6C63FF',
    fontSize: 12,
    marginTop: 2,
  },
  signOutButton: {
    padding: 8,
  },
  signOutButtonWeb: {
    borderColor: '#ff4444',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#1a1a2e',
    marginBottom: 16,
    borderRadius: 12,
  },
  teamInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoLabel: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 100,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  descriptionContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#0f0f1e',
    borderRadius: 8,
  },
  descriptionText: {
    color: '#ccc',
    fontSize: 14,
    fontStyle: 'italic',
  },
  squadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  squadTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    borderColor: '#4CAF50',
  },
  addPlayerCard: {
    backgroundColor: '#1a1a2e',
    marginBottom: 16,
    borderRadius: 12,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  positionPickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  positionOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  positionOptionSelected: {
    backgroundColor: '#e8f5e9',
  },
  positionOptionText: {
    fontSize: 14,
    color: '#000',
  },
  positionOptionTextSelected: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: '#4CAF50',
  },
  positionGroup: {
    marginBottom: 16,
  },
  positionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  jerseyBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jerseyNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  emptyCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
  },
  emptyText: {
    color: '#ccc',
    textAlign: 'center',
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tournamentItem: {
    backgroundColor: '#0f0f1e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6C63FF',
  },
  tournamentName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tournamentDates: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 4,
  },
  tournamentLocation: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
  },
  matchItem: {
    backgroundColor: '#0f0f1e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  teamColumn: {
    flex: 1,
    alignItems: 'center',
  },
  matchTeamName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  eventsList: {
    marginTop: 4,
    alignItems: 'center',
    gap: 4,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0f0f1e',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  eventText: {
    color: '#ccc',
    fontSize: 11,
    fontWeight: '500',
  },
  myTeamName: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  matchScoreContainer: {
    paddingHorizontal: 16,
  },
  matchScore: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  matchVs: {
    color: '#6C63FF',
    fontSize: 14,
  },
  matchTime: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
  },
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#ffa500',
    marginTop: 8,
  },
  statusCompleted: {
    backgroundColor: '#4CAF50',
  },
  statusLive: {
    backgroundColor: '#ff4444',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  halfTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffa500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  halfTimeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  halfTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffa500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  halfTimeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  matchEventsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
  },
  matchEventsTitle: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  matchEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  matchEventText: {
    color: '#ccc',
    fontSize: 12,
  },
  myTeamEvent: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  // Tables Tab Styles
  tableCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: 16,
  },
  tableTournamentName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tableCategory: {
    color: '#6C63FF',
    fontSize: 14,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#6C63FF',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  tableHeaderCell: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
    alignItems: 'center',
  },
  firstPlaceRow: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  secondPlaceRow: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#6C63FF',
  },
  thirdPlaceRow: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#ffa500',
  },
  myTeamRow: {
    backgroundColor: 'rgba(76, 175, 80, 0.25)',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 8,
  },
  tableCell: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  posCell: {
    width: 24,
  },
  teamCell: {
    flex: 1,
    textAlign: 'left',
    paddingRight: 8,
  },
  statCell: {
    width: 28,
  },
  ptsCell: {
    width: 32,
  },
  posText: {
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  teamText: {
    fontWeight: '600',
  },
  myTeamText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  winText: {
    color: '#4CAF50',
  },
  drawText: {
    color: '#ffa500',
  },
  lossText: {
    color: '#ff4444',
  },
  ptsText: {
    fontWeight: 'bold',
    color: '#4CAF50',
    fontSize: 14,
  },
  summaryCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  summaryHeader: {
    marginBottom: 12,
  },
  summaryTournament: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryCategory: {
    color: '#6C63FF',
    fontSize: 12,
    marginTop: 2,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    color: '#6C63FF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: '#ccc',
    fontSize: 11,
    marginTop: 4,
  },
  // Team Logo Display
  teamHeaderSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  teamLogoDisplay: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#6C63FF',
  },
  teamLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0f0f1e',
    borderWidth: 2,
    borderColor: '#6C63FF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Player Photo Display
  playerPhotoDisplay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  playerInfoColumn: {
    flex: 1,
  },
  playerJerseySmall: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  // Formation Tab Styles
  analysisGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    marginBottom: 16,
  },
  analysisItem: {
    alignItems: 'center',
  },
  analysisNumber: {
    color: '#6C63FF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  analysisLabel: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
  },
  totalPlayers: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  warningCard: {
    backgroundColor: '#ffa500',
    borderRadius: 12,
    marginBottom: 16,
  },
  warningText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedFormationCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  formationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  formationName: {
    color: '#fff',
    fontWeight: 'bold',
  },
  formationTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  defensiveBadge: {
    backgroundColor: '#ff4444',
  },
  balancedBadge: {
    backgroundColor: '#ffa500',
  },
  offensiveBadge: {
    backgroundColor: '#4CAF50',
  },
  formationTypeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  formationDescription: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  suitabilityBar: {
    marginBottom: 20,
  },
  suitabilityLabel: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 6,
  },
  suitabilityBarBg: {
    height: 8,
    backgroundColor: '#2a2a3e',
    borderRadius: 4,
    overflow: 'hidden',
  },
  suitabilityBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  formationDiagram: {
    backgroundColor: '#0f0f1e',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  formationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  positionDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  gkDot: {
    backgroundColor: '#ffa500',
  },
  defDot: {
    backgroundColor: '#ff4444',
  },
  midDot: {
    backgroundColor: '#6C63FF',
  },
  fwdDot: {
    backgroundColor: '#4CAF50',
  },
  positionLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  positionDotWithPlayer: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  positionLabelSmall: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  positionLabelTiny: {
    color: '#fff',
    fontSize: 8,
    marginTop: 2,
  },
  assignedPlayersSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
  },
  assignedPlayersHeader: {
    marginBottom: 12,
  },
  assignedPlayersTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  swapHint: {
    color: '#6C63FF',
    fontSize: 11,
    fontStyle: 'italic',
  },
  swapHintSmall: {
    color: '#6C63FF',
    fontSize: 10,
    fontStyle: 'italic',
    fontWeight: 'normal',
  },
  playerAssignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f1e',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playerRowSelected: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  subButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ffa500',
    borderRadius: 4,
    marginLeft: 8,
  },
  subButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addButton: {
    marginLeft: 8,
  },
  positionBadge: {
    width: 40,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positionBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gkBadge: {
    backgroundColor: '#ffa500',
  },
  defBadge: {
    backgroundColor: '#ff4444',
  },
  midBadge: {
    backgroundColor: '#6C63FF',
  },
  fwdBadge: {
    backgroundColor: '#4CAF50',
  },
  subBadge: {
    backgroundColor: '#888',
  },
  assignedPlayerName: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  flexiblePosition: {
    color: '#ffa500',
    fontSize: 11,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  substitutesTitle: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  recommendationsCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: 16,
  },
  recommendationItem: {
    backgroundColor: '#0f0f1e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  recommendationItemSelected: {
    borderColor: '#4CAF50',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  formationTypeBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  formationTypeTextSmall: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  recommendationDesc: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 16,
  },
  recommendationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suitabilityText: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: 16,
  },
  tipItem: {
    marginBottom: 16,
  },
  tipTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipText: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 18,
  },
});

