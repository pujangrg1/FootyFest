import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Share, Alert, Pressable, Modal, Platform } from 'react-native';
import { Text, Card, Button, TextInput, Divider, Menu } from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useSelector, useDispatch } from 'react-redux';
import { updateTournament, getTournamentById, deleteTournament, updateTournamentTeams } from '../../services/tournaments';
import { getMatchesForTournament, createMatchesBatch, updateMatch, deleteMatch, subscribeToMatchesForTournament } from '../../services/matches';
import { setTournaments } from '../../store/slices/tournamentsSlice';
import WebDateTimePicker from '../../components/web/WebDateTimePicker';
import MatchTimer from '../../components/MatchTimer';

export default function TournamentDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { tournamentId, tournament: initialTournament } = route.params || {};
  
  const tournaments = useSelector((state) => state.tournaments.items);
  const [tournament, setTournament] = useState(initialTournament || tournaments.find(t => t.id === tournamentId));
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTournament, setEditedTournament] = useState(tournament || {});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTournament = async () => {
      if (tournamentId && !tournament) {
        setLoading(true);
        try {
          const data = await getTournamentById(tournamentId);
          if (data) {
            console.log('Loaded tournament data:', data);
            setTournament(data);
            setEditedTournament(data);
          }
        } catch (error) {
          console.error('Error loading tournament:', error);
        } finally {
          setLoading(false);
        }
      } else if (tournament) {
        console.log('Using tournament from props/state:', tournament);
        setEditedTournament(tournament);
      }
    };
    loadTournament();
  }, [tournamentId]);

  // Debug: Log tournament data when it changes
  useEffect(() => {
    if (tournament) {
      console.log('Tournament data for display:', {
        name: tournament.name,
        location: tournament.location,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        maxTeams: tournament.maxTeams,
        maxTeams35Plus: tournament.maxTeams35Plus,
        playersPerTeam: tournament.playersPerTeam,
        matchDuration: tournament.matchDuration,
        substitutionRules: tournament.substitutionRules,
        description: tournament.description,
        organizerName: tournament.organizerName,
        contactEmail: tournament.contactEmail,
      });
    }
  }, [tournament]);

  useEffect(() => {
    if (tournament) {
      setEditedTournament(tournament);
    }
  }, [tournament]);

  const shareableLink = `soccer-tournament://tournament/${tournamentId}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join our tournament: ${tournament?.name || 'Tournament'}\n\nUse this link to sign up: ${shareableLink}`,
        title: 'Tournament Invitation',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share link');
    }
  };

  const copyToClipboard = () => {
    // In a real app, you'd use Clipboard API
    Alert.alert('Link Copied', shareableLink);
  };

  if (!tournament) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Tournament not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            {tournament.name}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 0 && styles.activeTab]}
            onPress={() => setActiveTab(0)}
          >
            <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]}>
              Summary
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 1 && styles.activeTab]}
            onPress={() => setActiveTab(1)}
          >
            <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>
              Teams
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 2 && styles.activeTab]}
            onPress={() => setActiveTab(2)}
          >
            <Text style={[styles.tabText, activeTab === 2 && styles.activeTabText]}>
              Matches
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 3 && styles.activeTab]}
            onPress={() => setActiveTab(3)}
          >
            <Text style={[styles.tabText, activeTab === 3 && styles.activeTabText]}>
              Tables
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 0 && (
            <SummaryTab 
              tournament={isEditing ? editedTournament : tournament}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              editedTournament={editedTournament}
              setEditedTournament={setEditedTournament}
              tournamentId={tournamentId}
              onUpdate={(updated) => {
                setTournament(updated);
                // Update in Redux store
                const updatedList = tournaments.map(t => t.id === updated.id ? updated : t);
                dispatch(setTournaments(updatedList));
              }}
              onDelete={async () => {
                Alert.alert(
                  'Delete Tournament',
                  'Are you sure you want to delete this tournament? This action cannot be undone.',
                  [
                    {
                      text: 'No',
                      style: 'cancel',
                    },
                    {
                      text: 'Yes',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await deleteTournament(tournamentId);
                          const updatedList = tournaments.filter(t => t.id !== tournamentId);
                          dispatch(setTournaments(updatedList));
                          navigation.goBack();
                          Alert.alert('Success', 'Tournament deleted successfully');
                        } catch (error) {
                          Alert.alert('Error', error.message || 'Failed to delete tournament');
                        }
                      },
                    },
                  ]
                );
              }}
            />
          )}
          {activeTab === 1 && (
            <TeamsTab 
              tournament={tournament}
              shareableLink={shareableLink}
              onShare={handleShare}
              onCopy={copyToClipboard}
              tournamentId={tournamentId}
              onUpdate={(updated) => {
                setTournament(updated);
                // Update in Redux store
                const updatedList = tournaments.map(t => t.id === updated.id ? updated : t);
                dispatch(setTournaments(updatedList));
              }}
            />
          )}
          {activeTab === 2 && (
            <MatchesTab 
              tournament={tournament}
              tournamentId={tournamentId}
            />
          )}
          {activeTab === 3 && (
            <TablesTab tournament={tournament} tournamentId={tournamentId} />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// Summary Tab Component
function SummaryTab({ tournament, isEditing, setIsEditing, editedTournament, setEditedTournament, tournamentId, onUpdate, onDelete }) {
  return (
    <View style={styles.tabContent}>
      <View style={styles.summaryHeader}>
        <Text variant="titleLarge" style={styles.sectionTitle}>Tournament Details</Text>
        {!isEditing && (
          <Button
            mode="outlined"
            onPress={() => setIsEditing(true)}
            icon="pencil"
            textColor="#4CAF50"
            style={styles.editButton}
          >
            Edit
          </Button>
        )}
      </View>

      <Card style={styles.detailCard}>
        <Card.Content>
          {isEditing ? (
            <EditForm 
              tournament={editedTournament}
              setTournament={setEditedTournament}
              tournamentId={tournamentId}
              onCancel={() => setIsEditing(false)}
              onSave={async () => {
                try {
                  const updated = await updateTournament(tournamentId, {
                    name: editedTournament.name,
                    location: editedTournament.location,
                    description: editedTournament.description,
                    maxTeams: Number(editedTournament.maxTeams) || 0,
                    maxTeams35Plus: Number(editedTournament.maxTeams35Plus) || 0,
                    playersPerTeam: Number(editedTournament.playersPerTeam) || 7,
                    matchDuration: Number(editedTournament.matchDuration) || 40,
                    substitutionRules: editedTournament.substitutionRules || 'Rolling Substitutions',
                    organizerName: editedTournament.organizerName || '',
                    contactEmail: editedTournament.contactEmail || '',
                    startDate: editedTournament.startDate || null,
                    endDate: editedTournament.endDate || null,
                  });
                  onUpdate(updated);
                  setIsEditing(false);
                  Alert.alert('Success', 'Tournament updated successfully');
                } catch (error) {
                  Alert.alert('Error', error.message || 'Failed to update tournament');
                }
              }}
            />
          ) : (
            <View style={styles.detailsContainer}>
              <DetailRow label="Tournament Name" value={tournament.name || 'N/A'} icon="trophy" />
              <DetailRow label="Venue/Location" value={tournament.location || 'N/A'} icon="location" />
              <DetailRow 
                label="Start Date" 
                value={tournament.startDate ? (() => {
                  try {
                    const date = tournament.startDate instanceof Date ? tournament.startDate : new Date(tournament.startDate);
                    return format(date, 'MMM dd, yyyy');
                  } catch (e) {
                    return String(tournament.startDate);
                  }
                })() : 'N/A'}
                icon="calendar"
              />
              <DetailRow 
                label="End Date" 
                value={tournament.endDate ? (() => {
                  try {
                    const date = tournament.endDate instanceof Date ? tournament.endDate : new Date(tournament.endDate);
                    return format(date, 'MMM dd, yyyy');
                  } catch (e) {
                    return String(tournament.endDate);
                  }
                })() : 'N/A'}
                icon="calendar-outline"
              />
              <DetailRow label="Total Teams (Open)" value={String(tournament.maxTeams || 0)} icon="people" />
              <DetailRow label="Total Teams (35+)" value={String(tournament.maxTeams35Plus || 0)} icon="people-outline" />
              <DetailRow label="Players per Team" value={String(tournament.playersPerTeam || 7)} icon="person" />
              <DetailRow label="Match Duration" value={`${tournament.matchDuration || 40} minutes`} icon="time" />
              <DetailRow label="Substitution Rules" value={tournament.substitutionRules || 'N/A'} icon="swap-horizontal" />
              <DetailRow label="Additional Rules" value={tournament.description || 'None'} multiline icon="document-text" />
              <DetailRow label="Organizer Name" value={tournament.organizerName || 'N/A'} icon="person-circle" />
              <DetailRow label="Contact Email" value={tournament.contactEmail || 'N/A'} icon="mail" />
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Delete Button at the end */}
      {!isEditing && (
        <Card style={styles.deleteCard}>
          <Card.Content>
            <Button
              mode="outlined"
              onPress={onDelete}
              icon="delete"
              textColor="#ff4444"
              style={styles.deleteButtonFull}
            >
              Delete Tournament
            </Button>
          </Card.Content>
        </Card>
      )}
    </View>
  );
}

// Teams Tab Component
function TeamsTab({ tournament, shareableLink, onShare, onCopy, tournamentId, onUpdate }) {
  const [openTeams, setOpenTeams] = useState([]);
  const [teams35Plus, setTeams35Plus] = useState([]);
  const [newOpenTeam, setNewOpenTeam] = useState('');
  const [new35PlusTeam, setNew35PlusTeam] = useState('');
  const [saving, setSaving] = useState(false);

  // Load teams from tournament data when component mounts or tournament changes
  useEffect(() => {
    if (tournament) {
      setOpenTeams(tournament.openTeams || []);
      setTeams35Plus(tournament.teams35Plus || []);
    }
  }, [tournament]);

  // Save teams to Firestore
  const saveTeams = async (updatedOpenTeams, updatedTeams35Plus) => {
    if (!tournamentId) return;
    
    setSaving(true);
    try {
      const updated = await updateTournamentTeams(tournamentId, updatedOpenTeams, updatedTeams35Plus);
      if (onUpdate) {
        onUpdate(updated);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save teams');
    } finally {
      setSaving(false);
    }
  };

  const addOpenTeam = async () => {
    if (newOpenTeam.trim()) {
      const updated = [...openTeams, newOpenTeam.trim()];
      setOpenTeams(updated);
      setNewOpenTeam('');
      await saveTeams(updated, teams35Plus);
    }
  };

  const add35PlusTeam = async () => {
    if (new35PlusTeam.trim()) {
      const updated = [...teams35Plus, new35PlusTeam.trim()];
      setTeams35Plus(updated);
      setNew35PlusTeam('');
      await saveTeams(openTeams, updated);
    }
  };

  const removeOpenTeam = async (index) => {
    const updated = openTeams.filter((_, i) => i !== index);
    setOpenTeams(updated);
    await saveTeams(updated, teams35Plus);
  };

  const remove35PlusTeam = async (index) => {
    const updated = teams35Plus.filter((_, i) => i !== index);
    setTeams35Plus(updated);
    await saveTeams(openTeams, updated);
  };

  return (
    <View style={styles.tabContent}>
      {/* Shareable Link Section */}
      <Card style={styles.shareCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.shareTitle}>
            Share Tournament Link
          </Text>
          <Text style={styles.shareLink}>{shareableLink}</Text>
          <View style={styles.shareButtons}>
            <Button
              mode="contained"
              onPress={onShare}
              icon="share"
              style={styles.shareButton}
            >
              Share
            </Button>
            <Button
              mode="outlined"
              onPress={onCopy}
              icon="content-copy"
              textColor="#4CAF50"
              style={styles.shareButton}
            >
              Copy
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Open Category Section */}
      <Card style={styles.teamCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.categoryTitle}>
            Open Category
          </Text>
          <View style={styles.addTeamContainer}>
            <TextInput
              label="Team Name"
              value={newOpenTeam}
              onChangeText={setNewOpenTeam}
              style={styles.teamInput}
              theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
            />
            <Button
              mode="contained"
              onPress={addOpenTeam}
              style={styles.addButton}
            >
              Add
            </Button>
          </View>
          {openTeams.map((team, index) => (
            <View key={index} style={styles.teamItem}>
              <Text style={styles.teamName}>{team}</Text>
              <TouchableOpacity onPress={() => removeOpenTeam(index)}>
                <Ionicons name="close-circle" size={24} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ))}
          {openTeams.length === 0 && (
            <Text style={styles.emptyText}>No teams added yet</Text>
          )}
        </Card.Content>
      </Card>

      {/* 35+ Category Section */}
      <Card style={styles.teamCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.categoryTitle}>
            35+ Category
          </Text>
          <View style={styles.addTeamContainer}>
            <TextInput
              label="Team Name"
              value={new35PlusTeam}
              onChangeText={setNew35PlusTeam}
              style={styles.teamInput}
              theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
            />
            <Button
              mode="contained"
              onPress={add35PlusTeam}
              style={styles.addButton}
            >
              Add
            </Button>
          </View>
          {teams35Plus.map((team, index) => (
            <View key={index} style={styles.teamItem}>
              <Text style={styles.teamName}>{team}</Text>
              <TouchableOpacity onPress={() => remove35PlusTeam(index)}>
                <Ionicons name="close-circle" size={24} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ))}
          {teams35Plus.length === 0 && (
            <Text style={styles.emptyText}>No teams added yet</Text>
          )}
        </Card.Content>
      </Card>
    </View>
  );
}

// Matches Tab Component
function MatchesTab({ tournament, tournamentId }) {
  const navigation = useNavigation();
  const [matches, setMatches] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Get all teams
  const allTeams = [
    ...(tournament?.openTeams || []).map((name, index) => ({ id: `open-${index}`, name, category: 'Open' })),
    ...(tournament?.teams35Plus || []).map((name, index) => ({ id: `35plus-${index}`, name, category: '35+' }))
  ];
  const totalTeams = allTeams.length;
  const needsGroups = totalTeams > 6;

  // Subscribe to real-time match updates
  useEffect(() => {
    if (!tournamentId) return;

    setLoading(true);
    
    // Set up real-time listener for matches
    const unsubscribe = subscribeToMatchesForTournament(tournamentId, (matchesData) => {
      // Sort by status priority: Live > Scheduled > Completed
      // Within each status, sort by scheduled time
      const sortedMatches = [...matchesData].sort((a, b) => {
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
      
      setMatches(sortedMatches);
      // Extract unique groups from matches
      const uniqueGroups = [...new Set(sortedMatches.map(m => m.group).filter(Boolean))];
      setGroups(uniqueGroups.map(name => ({ name, teams: [] })));
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [tournamentId]);

  // Load groups from tournament if they exist
  useEffect(() => {
    if (tournament?.groups && Array.isArray(tournament.groups)) {
      setGroups(tournament.groups);
    }
  }, [tournament]);

  const addGroup = () => {
    if (newGroupName.trim()) {
      setGroups([...groups, { name: newGroupName.trim(), teams: [] }]);
      setNewGroupName('');
    }
  };

  const removeGroup = (index) => {
    setGroups(groups.filter((_, i) => i !== index));
  };

  const assignTeamToGroup = (teamId, groupIndex) => {
    const updatedGroups = [...groups];
    // Remove team from all groups first
    updatedGroups.forEach(group => {
      group.teams = group.teams.filter(id => id !== teamId);
    });
    // Add to selected group
    if (!updatedGroups[groupIndex].teams.includes(teamId)) {
      updatedGroups[groupIndex].teams.push(teamId);
    }
    setGroups(updatedGroups);
  };

  const saveGroups = async () => {
    try {
      await updateTournament(tournamentId, { groups });
      Alert.alert('Success', 'Groups saved successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save groups');
    }
  };

  // Schedule generator logic
  const generateSchedule = async () => {
    if (totalTeams < 2) {
      Alert.alert('Error', 'Need at least 2 teams to generate a schedule');
      return;
    }

    // Validate groups if needed
    if (needsGroups) {
      if (groups.length === 0) {
        Alert.alert('Error', 'Please create at least one group before generating the schedule');
        return;
      }
      
      // Check if all teams are assigned to groups
      const assignedTeamIds = new Set();
      groups.forEach(group => {
        group.teams.forEach(teamId => assignedTeamIds.add(teamId));
      });
      
      const unassignedTeams = allTeams.filter(team => !assignedTeamIds.has(team.id));
      if (unassignedTeams.length > 0) {
        Alert.alert(
          'Error',
          `Please assign all teams to groups. Unassigned teams: ${unassignedTeams.map(t => t.name).join(', ')}`
        );
        return;
      }

      // Check if each group has at least one team
      const emptyGroups = groups.filter(g => g.teams.length === 0);
      if (emptyGroups.length > 0) {
        Alert.alert('Error', 'All groups must have at least one team assigned');
        return;
      }
    }

    // Confirm before generating (will replace existing matches)
    Alert.alert(
      'Generate Schedule',
      matches.length > 0 
        ? 'This will replace all existing matches. Continue?' 
        : `Generate ${needsGroups ? 'group-based' : 'round-robin'} matches for ${totalTeams} teams?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setLoading(true);
            try {
              const generatedMatches = [];

              if (needsGroups && groups.length > 0) {
                // Generate matches between teams from different groups
                for (let i = 0; i < groups.length; i++) {
                  for (let j = i + 1; j < groups.length; j++) {
                    const group1Teams = groups[i].teams.map(id => allTeams.find(t => t.id === id)).filter(Boolean);
                    const group2Teams = groups[j].teams.map(id => allTeams.find(t => t.id === id)).filter(Boolean);
                    
                    // Create matches between teams from different groups
                    group1Teams.forEach(team1 => {
                      group2Teams.forEach(team2 => {
                        generatedMatches.push({
                          team1Id: team1.id,
                          team1Name: team1.name,
                          team2Id: team2.id,
                          team2Name: team2.name,
                          group: `${groups[i].name} vs ${groups[j].name}`,
                          status: 'scheduled',
                        });
                      });
                    });
                  }
                }
              } else {
                // Generate round-robin matches (all teams play each other)
                for (let i = 0; i < allTeams.length; i++) {
                  for (let j = i + 1; j < allTeams.length; j++) {
                    generatedMatches.push({
                      team1Id: allTeams[i].id,
                      team1Name: allTeams[i].name,
                      team2Id: allTeams[j].id,
                      team2Name: allTeams[j].name,
                      status: 'scheduled',
                    });
                  }
                }
              }

              // Save matches to Firestore (without dates - organizer sets them manually)
              const createdMatches = await createMatchesBatch(tournamentId, generatedMatches);
              setMatches(createdMatches);
              Alert.alert(
                'Success', 
                `Generated ${createdMatches.length} matches!\n\nTap each match to set its date and time.`
              );
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to generate schedule');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const deleteMatchHandler = async (matchId) => {
    Alert.alert(
      'Delete Match',
      'Are you sure you want to delete this match?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMatch(matchId);
              setMatches(matches.filter(m => m.id !== matchId));
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete match');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.tabContent}>
      {/* Teams Summary */}
      <Card style={styles.detailCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Teams Overview
          </Text>
          <Text style={styles.infoText}>
            Total Teams: {totalTeams} ({tournament?.openTeams?.length || 0} Open, {tournament?.teams35Plus?.length || 0} 35+)
          </Text>
          {needsGroups && (
            <Text style={styles.warningText}>
              More than 6 teams detected. Groups are required.
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Groups Section (only if > 6 teams) */}
      {needsGroups && (
        <Card style={styles.detailCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Groups
            </Text>
            <View style={styles.addGroupContainer}>
              <TextInput
                label="Group Name"
                value={newGroupName}
                onChangeText={setNewGroupName}
                style={styles.groupInput}
                theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
              />
              <Button
                mode="contained"
                onPress={addGroup}
                style={styles.addButton}
              >
                Add Group
              </Button>
            </View>
            
            {groups.map((group, groupIndex) => (
              <Card key={groupIndex} style={styles.groupCard}>
                <Card.Content>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <TouchableOpacity onPress={() => removeGroup(groupIndex)}>
                      <Ionicons name="close-circle" size={24} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.groupInfo}>
                    Teams: {group.teams.length}
                  </Text>
                  <View style={styles.teamSelectionContainer}>
                    {allTeams.map(team => (
                      <TouchableOpacity
                        key={team.id}
                        style={[
                          styles.teamChip,
                          group.teams.includes(team.id) && styles.teamChipSelected
                        ]}
                        onPress={() => assignTeamToGroup(team.id, groupIndex)}
                      >
                        <Text style={[
                          styles.teamChipText,
                          group.teams.includes(team.id) && styles.teamChipTextSelected
                        ]}>
                          {team.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Card.Content>
              </Card>
            ))}
            
            {groups.length > 0 && (
              <Button
                mode="contained"
                onPress={saveGroups}
                style={styles.saveGroupsButton}
              >
                Save Groups
              </Button>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Schedule Generator */}
      <Card style={styles.detailCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Generate Schedule
          </Text>
          
          <Text style={styles.scheduleInfo}>
            {needsGroups 
              ? `Generate matches between teams from different groups. You have ${totalTeams} teams in ${groups.length} groups.`
              : `Generate matches where each team plays every other team. You have ${totalTeams} teams.`
            }
          </Text>
          
          <Text style={styles.scheduleNote}>
            After generating, tap each match to set its date and time.
          </Text>

          <Button
            mode="contained"
            onPress={generateSchedule}
            style={styles.generateButton}
            loading={loading}
            disabled={loading || totalTeams < 2}
            icon="calendar-plus"
          >
            Generate Matches
          </Button>
        </Card.Content>
      </Card>

      {/* Matches List */}
      <Card style={styles.detailCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Match Schedule ({matches.length} matches)
          </Text>
          {matches.length === 0 ? (
            <Text style={styles.emptyText}>No matches generated yet. Use the schedule generator above.</Text>
          ) : (
            matches.map((match) => (
              <TouchableOpacity
                key={match.id}
                onPress={() => navigation.navigate('Match Details', { match, tournamentId })}
                activeOpacity={0.7}
              >
                <Card style={styles.matchCard}>
                  <Card.Content>
                    <View style={styles.matchHeader}>
                      <View style={styles.matchTeams}>
                        <View style={styles.teamColumn}>
                          <Text style={styles.matchTeam}>{match.team1Name}</Text>
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
                                    <View key={idx} style={styles.eventItem}>
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
                        <View style={styles.scoreDisplay}>
                          {match.score1 !== null && match.score2 !== null ? (
                            <Text style={styles.scoreText}>{match.score1} - {match.score2}</Text>
                          ) : (
                            <Text style={styles.matchVs}>vs</Text>
                          )}
                        </View>
                        <View style={styles.teamColumn}>
                          <Text style={styles.matchTeam}>{match.team2Name}</Text>
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
                                    <View key={idx} style={styles.eventItem}>
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
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          deleteMatchHandler(match.id);
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="trash" size={20} color="#ff4444" />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.matchTime, !match.scheduledTime && styles.matchTimeNotSet]}>
                      {match.scheduledTime 
                        ? format(new Date(match.scheduledTime), 'MMM dd, yyyy h:mm a')
                        : 'Tap to set date & time'
                      }
                    </Text>
                    {match.group && (
                      <Text style={styles.matchGroup}>Group: {match.group}</Text>
                    )}
                    {/* Match Timer - Show when live */}
                    {match.status === 'live' && (
                      <MatchTimer
                        key={`timer-${match.id}-${match.timer?.startTime || 'no-timer'}`}
                        match={match}
                        matchDuration={tournament?.matchDuration || 40}
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
                    <View style={styles.matchFooter}>
                      <View style={[styles.matchStatusBadge, { backgroundColor: match.status === 'live' ? '#ff4444' : match.status === 'completed' ? '#4CAF50' : '#ffa500' }]}>
                        <Text style={styles.matchStatusText}>{match.status || 'scheduled'}</Text>
                      </View>
                      {match.events && match.events.length > 0 && (
                        <Text style={styles.eventsCount}>{match.events.length} events</Text>
                      )}
                      <Ionicons name="chevron-forward" size={20} color="#6C63FF" />
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </Card.Content>
      </Card>
    </View>
  );
}

// Tables Tab Component
function TablesTab({ tournament, tournamentId }) {
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState({ 
    open: [], 
    plus35: [], 
    openHasMatches: false, 
    plus35HasMatches: false 
  });
  const [loading, setLoading] = useState(true);

  // Get all teams
  const openTeams = tournament?.openTeams || [];
  const teams35Plus = tournament?.teams35Plus || [];

  // Load matches and calculate standings when focused
  useFocusEffect(
    useCallback(() => {
      const loadAndCalculate = async () => {
        if (!tournamentId) {
          setLoading(false);
          return;
        }

        setLoading(true);
        try {
          const matchesData = await getMatchesForTournament(tournamentId);
          setMatches(matchesData);
          
          // Calculate standings
          const openResult = calculateStandings(openTeams, matchesData);
          const plus35Result = calculateStandings(teams35Plus, matchesData);
          
          setStandings({
            open: openResult.standings,
            plus35: plus35Result.standings,
            openHasMatches: openResult.hasCompletedMatches,
            plus35HasMatches: plus35Result.hasCompletedMatches,
          });
        } catch (error) {
          console.error('Error loading standings:', error);
        } finally {
          setLoading(false);
        }
      };
      loadAndCalculate();
    }, [tournamentId, openTeams.length, teams35Plus.length])
  );

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

  const renderTable = (title, teamStandings, hasCompletedMatches) => {
    if (teamStandings.length === 0) return null;

    return (
      <Card style={styles.tableCard}>
        <Card.Content>
          <Text style={styles.tableTitle}>{title}</Text>
          
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
          {teamStandings.map((team, index) => (
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
      <View style={styles.tabContent}>
        <Text style={styles.loadingText}>Loading standings...</Text>
      </View>
    );
  }

  const hasTeams = openTeams.length > 0 || teams35Plus.length > 0;
  const completedCount = matches.filter(m => m.status === 'completed').length;

  return (
    <View style={styles.tabContent}>
      {!hasTeams ? (
        <Card style={styles.detailCard}>
          <Card.Content>
            <Text style={styles.emptyText}>No teams added yet. Add teams in the Teams tab first.</Text>
          </Card.Content>
        </Card>
      ) : (
        <>
          {/* Stats Summary */}
          <Card style={styles.detailCard}>
            <Card.Content>
              <View style={styles.statsSummary}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{matches.length}</Text>
                  <Text style={styles.statLabel}>Total Matches</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{completedCount}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{matches.length - completedCount}</Text>
                  <Text style={styles.statLabel}>Remaining</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Open Category Table */}
          {renderTable('Open Category Standings', standings.open, standings.openHasMatches)}

          {/* 35+ Category Table */}
          {renderTable('35+ Category Standings', standings.plus35, standings.plus35HasMatches)}

          {completedCount === 0 && (
            <Card style={styles.detailCard}>
              <Card.Content>
                <Text style={styles.emptyText}>
                  No completed matches yet. Standings will update automatically when matches are marked as completed.
                </Text>
              </Card.Content>
            </Card>
          )}
        </>
      )}
    </View>
  );
}

// Edit Form Component
function EditForm({ tournament, setTournament, tournamentId, onCancel, onSave }) {
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [substitutionMenuVisible, setSubstitutionMenuVisible] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);

  const substitutionOptions = [
    'Rolling Substitutions',
    'Limited Substitutions',
    'No Substitutions',
  ];

  const onStartDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
      if (event.type !== 'dismissed' && selectedDate) {
        setTournament({ ...tournament, startDate: selectedDate.toISOString() });
      }
    } else {
      if (selectedDate && selectedDate instanceof Date) {
        setTempStartDate(selectedDate);
      }
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
      if (event.type !== 'dismissed' && selectedDate) {
        setTournament({ ...tournament, endDate: selectedDate.toISOString() });
      }
    } else {
      if (selectedDate && selectedDate instanceof Date) {
        setTempEndDate(selectedDate);
      }
    }
  };

  const handleStartDateDone = () => {
    if (tempStartDate instanceof Date) {
      setTournament({ ...tournament, startDate: tempStartDate.toISOString() });
    }
    setShowStartDatePicker(false);
    setTempStartDate(null);
  };

  const handleEndDateDone = () => {
    if (tempEndDate instanceof Date) {
      setTournament({ ...tournament, endDate: tempEndDate.toISOString() });
    }
    setShowEndDatePicker(false);
    setTempEndDate(null);
  };

  return (
    <View>
      <TextInput
        label="Tournament Name *"
        value={tournament.name || ''}
        onChangeText={(text) => setTournament({ ...tournament, name: text })}
        style={styles.editInput}
        theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
      />
      <TextInput
        label="Venue/Location *"
        value={tournament.location || ''}
        onChangeText={(text) => setTournament({ ...tournament, location: text })}
        style={styles.editInput}
        theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
      />
      
      <Pressable onPress={() => {
        const initialDate = tournament.startDate ? new Date(tournament.startDate) : new Date();
        setTempStartDate(initialDate);
        setShowStartDatePicker(true);
      }}>
        <View pointerEvents="none">
          <TextInput
            label="Start Date *"
            value={tournament.startDate ? format(new Date(tournament.startDate), 'MM/dd/yyyy') : ''}
            placeholder="mm/dd/yyyy"
            editable={false}
            right={<TextInput.Icon icon="calendar" />}
            style={styles.editInput}
            theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
          />
        </View>
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={showStartDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setShowStartDatePicker(false);
            setTempStartDate(null);
          }}
        >
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Button onPress={() => {
                  setShowStartDatePicker(false);
                  setTempStartDate(null);
                }}>Cancel</Button>
                <Text style={styles.datePickerTitle}>Select Start Date</Text>
                <Button onPress={handleStartDateDone}>Done</Button>
              </View>
              <View style={styles.datePickerWrapper}>
                <WebDateTimePicker
                  value={(() => {
                    const date = tempStartDate || (tournament.startDate ? new Date(tournament.startDate) : new Date());
                    return date instanceof Date ? date : new Date();
                  })()}
                  mode="date"
                  display="spinner"
                  onChange={onStartDateChange}
                  minimumDate={new Date()}
                  textColor="#000"
                  style={styles.datePicker}
                />
              </View>
            </View>
          </View>
        </Modal>
      ) : (
        showStartDatePicker && (
          <WebDateTimePicker
            value={tournament.startDate ? new Date(tournament.startDate) : new Date()}
            mode="date"
            display="default"
            onChange={onStartDateChange}
            minimumDate={new Date()}
          />
        )
      )}

      <Pressable onPress={() => {
        const initialDate = tournament.endDate ? new Date(tournament.endDate) : (tournament.startDate ? new Date(tournament.startDate) : new Date());
        setTempEndDate(initialDate);
        setShowEndDatePicker(true);
      }}>
        <View pointerEvents="none">
          <TextInput
            label="End Date *"
            value={tournament.endDate ? format(new Date(tournament.endDate), 'MM/dd/yyyy') : ''}
            placeholder="mm/dd/yyyy"
            editable={false}
            right={<TextInput.Icon icon="calendar" />}
            style={styles.editInput}
            theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
          />
        </View>
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={showEndDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setShowEndDatePicker(false);
            setTempEndDate(null);
          }}
        >
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Button onPress={() => {
                  setShowEndDatePicker(false);
                  setTempEndDate(null);
                }}>Cancel</Button>
                <Text style={styles.datePickerTitle}>Select End Date</Text>
                <Button onPress={handleEndDateDone}>Done</Button>
              </View>
              <View style={styles.datePickerWrapper}>
                <WebDateTimePicker
                  value={(() => {
                    const date = tempEndDate || (tournament.endDate ? new Date(tournament.endDate) : (tournament.startDate ? new Date(tournament.startDate) : new Date()));
                    return date instanceof Date ? date : new Date();
                  })()}
                  mode="date"
                  display="spinner"
                  onChange={onEndDateChange}
                  minimumDate={tournament.startDate ? new Date(tournament.startDate) : new Date()}
                  textColor="#000"
                  style={styles.datePicker}
                />
              </View>
            </View>
          </View>
        </Modal>
      ) : (
        showEndDatePicker && (
          <WebDateTimePicker
            value={tournament.endDate ? new Date(tournament.endDate) : (tournament.startDate ? new Date(tournament.startDate) : new Date())}
            mode="date"
            display="default"
            onChange={onEndDateChange}
            minimumDate={tournament.startDate ? new Date(tournament.startDate) : new Date()}
          />
        )
      )}

      <TextInput
        label="Total Teams (Open Category) *"
        value={String(tournament.maxTeams || '')}
        onChangeText={(text) => setTournament({ ...tournament, maxTeams: text })}
        keyboardType="number-pad"
        style={styles.editInput}
        theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
      />
      <TextInput
        label="Total Teams (35+ Category) *"
        value={String(tournament.maxTeams35Plus || '')}
        onChangeText={(text) => setTournament({ ...tournament, maxTeams35Plus: text })}
        keyboardType="number-pad"
        style={styles.editInput}
        theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
      />
      <TextInput
        label="Players per Team"
        value={String(tournament.playersPerTeam || '7')}
        onChangeText={(text) => setTournament({ ...tournament, playersPerTeam: text })}
        keyboardType="number-pad"
        style={styles.editInput}
        theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
      />
      <TextInput
        label="Match Duration (Minutes) *"
        value={String(tournament.matchDuration || '40')}
        onChangeText={(text) => setTournament({ ...tournament, matchDuration: text })}
        keyboardType="number-pad"
        style={styles.editInput}
        theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
      />
      
      <Pressable onPress={() => setSubstitutionMenuVisible(true)}>
        <View pointerEvents="none">
          <TextInput
            label="Substitution Rules"
            value={tournament.substitutionRules || 'Rolling Substitutions'}
            editable={false}
            right={<TextInput.Icon icon="chevron-down" />}
            style={styles.editInput}
            theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
          />
        </View>
      </Pressable>
      <Modal
        visible={substitutionMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSubstitutionMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSubstitutionMenuVisible(false)}
        >
          <Pressable 
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Select Substitution Rules</Text>
            {substitutionOptions.map((option) => (
              <Pressable
                key={option}
                style={[
                  styles.modalOption,
                  tournament.substitutionRules === option && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setTournament({ ...tournament, substitutionRules: option });
                  setSubstitutionMenuVisible(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  tournament.substitutionRules === option && styles.modalOptionTextSelected
                ]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <TextInput
        label="Additional Rules / Notes"
        value={tournament.description || ''}
        onChangeText={(text) => setTournament({ ...tournament, description: text })}
        multiline
        numberOfLines={4}
        style={styles.editInput}
        theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
      />
      <TextInput
        label="Organizer Name *"
        value={tournament.organizerName || ''}
        onChangeText={(text) => setTournament({ ...tournament, organizerName: text })}
        style={styles.editInput}
        theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
      />
      <TextInput
        label="Contact Email *"
        value={tournament.contactEmail || ''}
        onChangeText={(text) => setTournament({ ...tournament, contactEmail: text })}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.editInput}
        theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
      />
      <View style={styles.editButtons}>
        <Button mode="outlined" onPress={onCancel} style={styles.editCancelButton} textColor="#fff">
          Cancel
        </Button>
        <Button mode="contained" onPress={onSave} style={styles.editSaveButton}>
          Save Changes
        </Button>
      </View>
    </View>
  );
}

// Detail Row Component
function DetailRow({ label, value, multiline = false, icon }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLabelContainer}>
        {icon && <Ionicons name={icon} size={18} color="#6C63FF" style={styles.detailIcon} />}
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <View style={styles.detailValueContainer}>
        <Text style={[styles.detailValue, multiline && styles.multilineText]}>{value}</Text>
      </View>
    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1a1a2e',
    backgroundColor: '#1a1a2e',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#0f0f1e',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginHorizontal: 4,
  },
  activeTab: {
    borderBottomColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
  },
  tabText: {
    color: '#ccc',
    fontSize: 15,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#2a2a3e',
  },
  deleteCard: {
    backgroundColor: '#1a1a2e',
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  deleteButtonFull: {
    borderColor: '#ff4444',
    borderRadius: 8,
    width: '100%',
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    letterSpacing: 0.5,
  },
  editButton: {
    borderColor: '#4CAF50',
    borderRadius: 8,
  },
  detailCard: {
    backgroundColor: '#1a1a2e',
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailLabel: {
    color: '#6C63FF',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  detailValueContainer: {
    backgroundColor: '#0f0f1e',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  detailValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  multilineText: {
    marginTop: 4,
  },
  shareCard: {
    backgroundColor: '#1a1a2e',
    marginBottom: 16,
  },
  shareTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  shareLink: {
    color: '#4CAF50',
    fontSize: 14,
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
  },
  teamCard: {
    backgroundColor: '#1a1a2e',
    marginBottom: 16,
  },
  categoryTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  addTeamContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  teamInput: {
    flex: 1,
    backgroundColor: '#fff',
  },
  addButton: {
    justifyContent: 'center',
  },
  teamItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0f0f1e',
    borderRadius: 8,
    marginBottom: 8,
  },
  teamName: {
    color: '#fff',
    fontSize: 16,
  },
  emptyText: {
    color: '#ccc',
    textAlign: 'center',
    padding: 20,
  },
  editInput: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  editCancelButton: {
    flex: 1,
    borderColor: '#ff4444',
    borderRadius: 8,
  },
  editSaveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  datePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    minHeight: 300,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  datePickerWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  datePicker: {
    width: '100%',
    height: 216,
    backgroundColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  modalOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalOptionSelected: {
    backgroundColor: '#e8f5e9',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#000',
  },
  modalOptionTextSelected: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    padding: 20,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
  },
  warningText: {
    color: '#ffa500',
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  addGroupContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  groupInput: {
    flex: 1,
    backgroundColor: '#fff',
  },
  groupCard: {
    backgroundColor: '#0f0f1e',
    marginBottom: 12,
    borderRadius: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  groupInfo: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 12,
  },
  teamSelectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  teamChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  teamChipSelected: {
    backgroundColor: '#6C63FF',
  },
  teamChipText: {
    color: '#6C63FF',
    fontSize: 12,
  },
  teamChipTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveGroupsButton: {
    marginTop: 16,
    backgroundColor: '#4CAF50',
  },
  generateButton: {
    marginTop: 16,
    backgroundColor: '#4CAF50',
  },
  scheduleInfo: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  scheduleNote: {
    color: '#6C63FF',
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  matchTimeNotSet: {
    color: '#ffa500',
    fontStyle: 'italic',
  },
  matchCard: {
    backgroundColor: '#0f0f1e',
    marginBottom: 12,
    borderRadius: 8,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  teamColumn: {
    flex: 1,
    alignItems: 'center',
  },
  matchTeam: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  matchVs: {
    color: '#6C63FF',
    fontSize: 14,
    marginHorizontal: 12,
  },
  matchTime: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 4,
  },
  matchGroup: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
  },
  matchStatus: {
    color: '#ffa500',
    fontSize: 12,
    marginTop: 4,
  },
  scoreDisplay: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#0f0f1e',
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  scoreText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  matchFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  matchStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  matchStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  eventsCount: {
    color: '#6C63FF',
    fontSize: 12,
    flex: 1,
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
  // Tables Tab Styles
  tableCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: 16,
  },
  tableTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  statsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#6C63FF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
  },
  loadingText: {
    color: '#ccc',
    textAlign: 'center',
    padding: 20,
  },
});

