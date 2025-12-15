import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, FlatList, Image, Platform } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { getAllTournaments, getTournamentById } from '../../services/tournaments';
import { getAllTeams, getTeamById } from '../../services/teams';
import { getMatchesForTournament, subscribeToMatchesForTournament } from '../../services/matches';
import { authService } from '../../services/auth';
import { clearAuth } from '../../store/slices/authSlice';
import MatchTimer from '../../components/MatchTimer';
import RoleSwitcher from '../../components/RoleSwitcher';

export default function SpectatorHomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(0);

  const handleSignOut = () => {
    console.log('Sign out button clicked (Spectator page)');
    
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
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Spectator View
          </Text>
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
              name="trophy" 
              size={20} 
              color={activeTab === 0 ? '#4CAF50' : '#ccc'} 
            />
            <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]}>
              Tournaments
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 1 && styles.activeTab]}
            onPress={() => setActiveTab(1)}
          >
            <Ionicons 
              name="calendar" 
              size={20} 
              color={activeTab === 1 ? '#4CAF50' : '#ccc'} 
            />
            <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>
              Schedules
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 2 && styles.activeTab]}
            onPress={() => setActiveTab(2)}
          >
            <Ionicons 
              name="stats-chart" 
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
              name="people" 
              size={20} 
              color={activeTab === 3 ? '#4CAF50' : '#ccc'} 
            />
            <Text style={[styles.tabText, activeTab === 3 && styles.activeTabText]}>
              Teams
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.content}>
          {activeTab === 0 && <TournamentsTab />}
          {activeTab === 1 && <SchedulesTab />}
          {activeTab === 2 && <TablesTab />}
          {activeTab === 3 && <TeamsTab navigation={navigation} />}
        </View>
      </View>
    </SafeAreaView>
  );
}

// Tournaments Tab
function TournamentsTab() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadTournaments();
    }, [])
  );

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const allTournaments = await getAllTournaments();
      setTournaments(allTournaments);
    } catch (error) {
      console.error('Error loading tournaments:', error);
      Alert.alert('Error', 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const getTournamentStatus = (tournament) => {
    if (!tournament.startDate) return 'upcoming';
    try {
      const now = new Date();
      const startDate = typeof tournament.startDate === 'string' 
        ? parseISO(tournament.startDate) 
        : new Date(tournament.startDate);
      const endDate = tournament.endDate 
        ? (typeof tournament.endDate === 'string' ? parseISO(tournament.endDate) : new Date(tournament.endDate))
        : null;
      
      if (isBefore(now, startDate)) return 'upcoming';
      if (endDate && isAfter(now, endDate)) return 'completed';
      return 'live';
    } catch (error) {
      return 'upcoming';
    }
  };

  const upcomingTournaments = tournaments.filter(t => getTournamentStatus(t) === 'upcoming');
  const liveTournaments = tournaments.filter(t => getTournamentStatus(t) === 'live');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading tournaments...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Live Tournaments */}
      {liveTournaments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="radio-button-on" size={16} color="#ff4444" /> Live Tournaments
          </Text>
          {liveTournaments.map(tournament => (
            <TournamentCard key={tournament.id} tournament={tournament} status="live" />
          ))}
        </View>
      )}

      {/* Upcoming Tournaments */}
      {upcomingTournaments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="calendar-outline" size={16} color="#4CAF50" /> Upcoming Tournaments
          </Text>
          {upcomingTournaments.map(tournament => (
            <TournamentCard key={tournament.id} tournament={tournament} status="upcoming" />
          ))}
        </View>
      )}

      {tournaments.length === 0 && (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.emptyText}>No tournaments available yet.</Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

// Tournament Card Component
function TournamentCard({ tournament, status }) {
  return (
    <Card style={styles.tournamentCard}>
      <Card.Content>
        <View style={styles.tournamentHeader}>
          <Text style={styles.tournamentName}>{tournament.name}</Text>
          <View style={[styles.statusBadge, status === 'live' && styles.liveBadge]}>
            <Text style={styles.statusText}>{status.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.tournamentInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color="#6C63FF" />
            <Text style={styles.infoText}>{tournament.location || 'TBD'}</Text>
          </View>
          {tournament.startDate && (
            <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color="#6C63FF" />
            <Text style={styles.infoText}>
              {format(
                typeof tournament.startDate === 'string' 
                  ? parseISO(tournament.startDate) 
                  : new Date(tournament.startDate),
                'MMM dd, yyyy'
              )}
              {tournament.endDate && ` - ${format(
                typeof tournament.endDate === 'string' 
                  ? parseISO(tournament.endDate) 
                  : new Date(tournament.endDate),
                'MMM dd, yyyy'
              )}`}
            </Text>
          </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="people" size={16} color="#6C63FF" />
            <Text style={styles.infoText}>
              Open: {(tournament.openTeams || []).length} | 35+: {(tournament.teams35Plus || []).length}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

// Schedules Tab
function SchedulesTab() {
  const [tournaments, setTournaments] = useState([]);
  const [allMatches, setAllMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tournamentDurations, setTournamentDurations] = useState({}); // tournamentId -> matchDuration

  // Set up real-time listeners for all tournaments
  useEffect(() => {
    let unsubscribeFunctions = [];
    
    const setupListeners = async () => {
      setLoading(true);
      try {
        const allTournaments = await getAllTournaments();
        setTournaments(allTournaments);

        // Load tournament durations
        const durations = {};
        for (const tournament of allTournaments) {
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
        unsubscribeFunctions = allTournaments.map((tournament) => {
          return subscribeToMatchesForTournament(tournament.id, (matches) => {
            // Add tournament info to each match
            const matchesWithTournament = matches.map(match => ({
              ...match,
              tournamentName: tournament.name,
              tournamentId: tournament.id
            }));

            // Update all matches by merging with existing matches from other tournaments
            setAllMatches(prevMatches => {
              // Remove old matches from this tournament
              const otherMatches = prevMatches.filter(m => m.tournamentId !== tournament.id);
              // Add new matches from this tournament
              const updatedMatches = [...otherMatches, ...matchesWithTournament];
              
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
        console.error('Error loading schedules:', error);
        Alert.alert('Error', 'Failed to load schedules');
      } finally {
        setLoading(false);
      }
    };

    setupListeners();

    // Cleanup listeners on unmount
    return () => {
      unsubscribeFunctions.forEach(unsub => {
        if (unsub && typeof unsub === 'function') {
          unsub();
        }
      });
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading schedules...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {allMatches.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.emptyText}>No matches scheduled yet.</Text>
          </Card.Content>
        </Card>
      ) : (
        allMatches.map((match, index) => (
          <Card key={match.id || index} style={styles.matchCardSchedule}>
            <Card.Content>
              {/* Tournament Name */}
              <Text style={styles.matchTournamentName}>{match.tournamentName}</Text>
              
              {/* Match Header with Teams and Score */}
              <View style={styles.matchHeaderSchedule}>
                <View style={styles.matchTeamsSchedule}>
                  <View style={styles.teamColumnSchedule}>
                    <Text style={styles.matchTeamSchedule}>{match.team1Name || 'TBD'}</Text>
                    {/* Events for Team 1 */}
                    {match.events && match.events.filter(e => {
                      const isTeam1 = e.team === 'team1' || e.teamName === match.team1Name;
                      return isTeam1;
                    }).length > 0 && (
                      <View style={styles.eventsListSchedule}>
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
                              <View key={idx} style={styles.eventItemSchedule}>
                                <Ionicons name={eventIcon} size={12} color={eventColor} />
                                <Text style={styles.eventTextSchedule}>
                                  {event.player || 'Player'}{event.minute ? ` ${event.minute}'` : ''}
                                </Text>
                              </View>
                            );
                          })}
                      </View>
                    )}
                  </View>
                  <View style={styles.scoreDisplaySchedule}>
                    {match.score1 !== null && match.score2 !== null ? (
                      <Text style={styles.scoreTextSchedule}>{match.score1} - {match.score2}</Text>
                    ) : (
                      <Text style={styles.matchVsSchedule}>vs</Text>
                    )}
                  </View>
                  <View style={styles.teamColumnSchedule}>
                    <Text style={styles.matchTeamSchedule}>{match.team2Name || 'TBD'}</Text>
                    {/* Events for Team 2 */}
                    {match.events && match.events.filter(e => {
                      const isTeam2 = e.team === 'team2' || e.teamName === match.team2Name;
                      return isTeam2;
                    }).length > 0 && (
                      <View style={styles.eventsListSchedule}>
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
                              <View key={idx} style={styles.eventItemSchedule}>
                                <Ionicons name={eventIcon} size={12} color={eventColor} />
                                <Text style={styles.eventTextSchedule}>
                                  {event.player || 'Player'}{event.minute ? ` ${event.minute}'` : ''}
                                </Text>
                              </View>
                            );
                          })}
                      </View>
                    )}
                  </View>
                </View>
              </View>
              
              {/* Scheduled Time */}
              <Text style={[styles.matchTimeSchedule, !match.scheduledTime && styles.matchTimeNotSet]}>
                {match.scheduledTime 
                  ? format(
                      typeof match.scheduledTime === 'string' 
                        ? parseISO(match.scheduledTime) 
                        : new Date(match.scheduledTime),
                      'MMM dd, yyyy h:mm a'
                    )
                  : 'Date & time not set'
                }
              </Text>
              
              {/* Group Name if applicable */}
              {match.group && (
                <Text style={styles.matchGroupSchedule}>Group: {match.group}</Text>
              )}
              
              {/* Match Timer - Show when live */}
              {match.status === 'live' && (
                <MatchTimer
                  key={`timer-${match.id}-${match.timer?.startTime || 'no-timer'}`}
                  match={match}
                  matchDuration={tournamentDurations[match.tournamentId] || 40}
                  isOrganizer={false}
                />
              )}
              
              {/* Half Time Status - Show when timer is paused */}
              {match.status === 'live' && match.timer?.isPaused && (
                <View style={styles.halfTimeBadgeSchedule}>
                  <Ionicons name="pause-circle" size={16} color="#ffa500" />
                  <Text style={styles.halfTimeTextSchedule}>Half Time</Text>
                </View>
              )}
              
              {/* Match Footer with Status and Events */}
              <View style={styles.matchFooterSchedule}>
                <View style={[
                  styles.matchStatusBadgeSchedule, 
                  { 
                    backgroundColor: match.status === 'live' 
                      ? '#ff4444' 
                      : match.status === 'completed' 
                        ? '#4CAF50' 
                        : '#ffa500' 
                  }
                ]}>
                  <Text style={styles.matchStatusTextSchedule}>{match.status || 'scheduled'}</Text>
                </View>
                {match.events && match.events.length > 0 && (
                  <Text style={styles.eventsCountSchedule}>
                    <Ionicons name="football" size={14} color="#6C63FF" /> {match.events.length} events
                  </Text>
                )}
              </View>
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

// Tables Tab
function TablesTab() {
  const [tournaments, setTournaments] = useState([]);
  const [standingsData, setStandingsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadStandings();
    }, [])
  );

  const loadStandings = async () => {
    setLoading(true);
    try {
      const allTournaments = await getAllTournaments();
      setTournaments(allTournaments);

      const allStandings = [];
      for (const tournament of allTournaments) {
        const matches = await getMatchesForTournament(tournament.id);
        
        const openTeams = tournament.openTeams || [];
        const teams35Plus = tournament.teams35Plus || [];
        
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

  const calculateStandings = (teams, allMatches) => {
    const teamStats = {};
    
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

    const completedMatches = allMatches.filter(m => m.status === 'completed');
    const hasCompletedMatches = completedMatches.length > 0;
    
    completedMatches.forEach(match => {
      const team1 = match.team1Name;
      const team2 = match.team2Name;
      const score1 = parseInt(match.score1) || 0;
      const score2 = parseInt(match.score2) || 0;

      if (teamStats[team1] && teamStats[team2]) {
        teamStats[team1].played += 1;
        teamStats[team2].played += 1;

        teamStats[team1].goalsFor += score1;
        teamStats[team1].goalsAgainst += score2;
        teamStats[team2].goalsFor += score2;
        teamStats[team2].goalsAgainst += score1;

        if (score1 > score2) {
          teamStats[team1].wins += 1;
          teamStats[team1].points += 3;
          teamStats[team2].losses += 1;
        } else if (score2 > score1) {
          teamStats[team2].wins += 1;
          teamStats[team2].points += 3;
          teamStats[team1].losses += 1;
        } else {
          teamStats[team1].draws += 1;
          teamStats[team1].points += 1;
          teamStats[team2].draws += 1;
          teamStats[team2].points += 1;
        }
      }
    });

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

          {standings.map((team, index) => (
            <View 
              key={team.name} 
              style={[
                styles.tableRow,
                hasCompletedMatches && index === 0 && styles.firstPlaceRow,
                hasCompletedMatches && index === 1 && styles.secondPlaceRow,
                hasCompletedMatches && index === 2 && styles.thirdPlaceRow,
              ]}
            >
              <Text style={[styles.tableCell, styles.posCell, styles.posText]}>
                {hasCompletedMatches ? index + 1 : 0}
              </Text>
              <Text style={[styles.tableCell, styles.teamCell, styles.teamText]} numberOfLines={1}>
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
      {standingsData.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.emptyText}>No standings available yet.</Text>
          </Card.Content>
        </Card>
      ) : (
        standingsData.map(data => renderTable(data))
      )}
    </ScrollView>
  );
}

// Teams Tab
function TeamsTab({ navigation }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadTeams();
    }, [])
  );

  const loadTeams = async () => {
    setLoading(true);
    try {
      // Get all tournaments to find which teams are participating
      const allTournaments = await getAllTournaments();
      
      // Collect all unique team names from tournaments
      const teamNamesInTournaments = new Set();
      allTournaments.forEach(tournament => {
        (tournament.openTeams || []).forEach(teamName => teamNamesInTournaments.add(teamName));
        (tournament.teams35Plus || []).forEach(teamName => teamNamesInTournaments.add(teamName));
      });
      
      // Get all teams from the teams collection
      const allTeams = await getAllTeams();
      
      // Filter to only show teams that are participating in at least one tournament
      // Match by team name (case-insensitive)
      const participatingTeams = allTeams.filter(team => {
        const teamNameLower = team.name?.toLowerCase().trim();
        return Array.from(teamNamesInTournaments).some(tournamentTeamName => 
          tournamentTeamName?.toLowerCase().trim() === teamNameLower
        );
      });
      
      setTeams(participatingTeams);
    } catch (error) {
      console.error('Error loading teams:', error);
      Alert.alert('Error', 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamPress = async (teamId) => {
    try {
      const team = await getTeamById(teamId);
      setSelectedTeam(team);
    } catch (error) {
      Alert.alert('Error', 'Failed to load team details');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading teams...</Text>
      </View>
    );
  }

  if (selectedTeam) {
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.teamDetailCard}>
          <Card.Content>
            <View style={styles.teamDetailHeader}>
              {selectedTeam.logo ? (
                <Image source={{ uri: selectedTeam.logo }} style={styles.teamLogoLarge} />
              ) : (
                <View style={styles.teamLogoPlaceholderLarge}>
                  <Ionicons name="football" size={40} color="#6C63FF" />
                </View>
              )}
              <View style={styles.teamDetailInfo}>
                <Text style={styles.teamDetailName}>{selectedTeam.name}</Text>
                <Text style={styles.teamDetailMeta}>
                  Est. {selectedTeam.yearEstablished || 'N/A'} | {selectedTeam.players?.length || 0} players
                </Text>
                {selectedTeam.description && (
                  <Text style={styles.teamDescription}>{selectedTeam.description}</Text>
                )}
              </View>
            </View>
            <Button
              mode="outlined"
              onPress={() => setSelectedTeam(null)}
              style={styles.backButton}
              textColor="#6C63FF"
            >
              Back to Teams
            </Button>
          </Card.Content>
        </Card>

        {/* Squad List */}
        <Card style={styles.squadCard}>
          <Card.Content>
            <Text style={styles.squadTitle}>Squad ({selectedTeam.players?.length || 0})</Text>
            {selectedTeam.players && selectedTeam.players.length > 0 ? (
              selectedTeam.players.map((player) => (
                <View key={player.id} style={styles.playerRow}>
                  {player.photoURL ? (
                    <Image source={{ uri: player.photoURL }} style={styles.playerPhoto} />
                  ) : (
                    <View style={styles.jerseyBadgeSmall}>
                      <Text style={styles.jerseyNumberSmall}>#{player.jerseyNumber}</Text>
                    </View>
                  )}
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.playerPosition}>{player.position}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No players added yet.</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {teams.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.emptyText}>No teams available yet.</Text>
          </Card.Content>
        </Card>
      ) : (
        teams.map((team) => (
          <TouchableOpacity
            key={team.id}
            onPress={() => handleTeamPress(team.id)}
          >
            <Card style={styles.teamCard}>
              <Card.Content>
                <View style={styles.teamRow}>
                  {team.logo ? (
                    <Image source={{ uri: team.logo }} style={styles.teamLogoSmall} />
                  ) : (
                    <View style={styles.teamLogoPlaceholderSmall}>
                      <Ionicons name="football" size={24} color="#6C63FF" />
                    </View>
                  )}
                  <View style={styles.teamInfo}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <Text style={styles.teamMeta}>
                      {team.players?.length || 0} players | Est. {team.yearEstablished || 'N/A'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#6C63FF" />
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
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
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    color: '#ccc',
    fontSize: 12,
    marginLeft: 6,
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#ccc',
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tournamentCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6C63FF',
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tournamentName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveBadge: {
    backgroundColor: '#ff4444',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tournamentInfo: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 8,
  },
  // Schedule Tab Match Card Styles (matching Tournament view)
  matchCardSchedule: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#6C63FF',
  },
  matchTournamentName: {
    color: '#6C63FF',
    fontSize: 12,
    marginBottom: 12,
    fontWeight: '600',
  },
  matchHeaderSchedule: {
    marginBottom: 12,
  },
  matchTeamsSchedule: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  teamColumnSchedule: {
    flex: 1,
    alignItems: 'center',
  },
  matchTeamSchedule: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  eventsListSchedule: {
    marginTop: 4,
    alignItems: 'center',
    gap: 4,
  },
  eventItemSchedule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0f0f1e',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  eventTextSchedule: {
    color: '#ccc',
    fontSize: 11,
    fontWeight: '500',
  },
  scoreDisplaySchedule: {
    paddingHorizontal: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  scoreTextSchedule: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold',
  },
  matchVsSchedule: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  matchTimeSchedule: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 8,
  },
  matchTimeNotSet: {
    color: '#ffa500',
    fontStyle: 'italic',
  },
  matchGroupSchedule: {
    color: '#6C63FF',
    fontSize: 12,
    marginBottom: 8,
  },
  matchFooterSchedule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
  },
  matchStatusBadgeSchedule: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchStatusTextSchedule: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  eventsCountSchedule: {
    color: '#6C63FF',
    fontSize: 12,
    flex: 1,
    marginLeft: 8,
  },
  halfTimeBadgeSchedule: {
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
  halfTimeTextSchedule: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 14,
  },
  // Tables styles
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
  // Teams styles
  teamCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: 12,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamLogoSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  teamLogoPlaceholderSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0f0f1e',
    borderWidth: 2,
    borderColor: '#6C63FF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  teamMeta: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  teamDetailCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: 16,
  },
  teamDetailHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  teamLogoLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#6C63FF',
    marginRight: 16,
  },
  teamLogoPlaceholderLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0f0f1e',
    borderWidth: 2,
    borderColor: '#6C63FF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  teamDetailInfo: {
    flex: 1,
  },
  teamDetailName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  teamDetailMeta: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  teamDescription: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 8,
  },
  backButton: {
    marginTop: 8,
    borderColor: '#6C63FF',
  },
  squadCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
  },
  squadTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f1e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  playerPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  jerseyBadgeSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jerseyNumberSmall: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  playerPosition: {
    color: '#6C63FF',
    fontSize: 12,
    marginTop: 2,
  },
});

