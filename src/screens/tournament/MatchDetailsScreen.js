import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Modal, Pressable } from 'react-native';
import { Text, Card, Button, TextInput, Chip, Menu } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import WebDateTimePicker from '../../components/web/WebDateTimePicker';
import CalendarPicker from '../../components/web/CalendarPicker';
import TimePicker from '../../components/web/TimePicker';
import MatchTimer from '../../components/MatchTimer';
import { updateMatch, getMatchById, subscribeToMatch } from '../../services/matches';
import { getTeamByName } from '../../services/teams';
import { getTournamentById } from '../../services/tournaments';

const CARD_TYPES = ['Yellow Card', 'Red Card'];

export default function MatchDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { match: initialMatch, tournamentId } = route.params || {};
  
  const [match, setMatch] = useState(initialMatch || {});
  const [status, setStatus] = useState(initialMatch?.status || 'scheduled');
  const [scheduledTime, setScheduledTime] = useState(initialMatch?.scheduledTime || null);
  const [loading, setLoading] = useState(false);
  const [tournament, setTournament] = useState(null);
  const [matchDuration, setMatchDuration] = useState(40); // Default 40 minutes
  
  // Date/Time picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(null);
  const [tempTime, setTempTime] = useState(null);
  
  // Refs for web date/time inputs
  const dateInputRef = React.useRef(null);
  const timeInputRef = React.useRef(null);
  
  // Events tracking
  const [events, setEvents] = useState(initialMatch?.events || []);
  const [initialEventsCount, setInitialEventsCount] = useState((initialMatch?.events || []).length);

  // Calculate scores from events (goals only)
  const calculateScores = (eventsList) => {
    const team1Goals = eventsList.filter(e => 
      (e.team === 'team1' || e.teamName === match.team1Name) && e.type === 'goal'
    ).length;
    const team2Goals = eventsList.filter(e => 
      (e.team === 'team2' || e.teamName === match.team2Name) && e.type === 'goal'
    ).length;
    return { score1: team1Goals, score2: team2Goals };
  };

  // Get calculated scores
  const { score1, score2 } = calculateScores(events);
  
  // Check if events have been added (button should be enabled only when new events are added)
  const hasNewEvents = events.length > initialEventsCount;
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventType, setEventType] = useState('goal');
  const [eventTeam, setEventTeam] = useState('team1');
  const [eventPlayer, setEventPlayer] = useState('');
  const [eventMinute, setEventMinute] = useState('');
  const [eventCardType, setEventCardType] = useState('Yellow Card');
  const [eventNotes, setEventNotes] = useState('');
  
  // Team players for dropdown
  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);
  const [playerMenuVisible, setPlayerMenuVisible] = useState(false);
  
  // Load team players when match or eventTeam changes
  useEffect(() => {
    const loadTeamPlayers = async () => {
      if (!match.team1Name && !match.team2Name) return;
      
      try {
        if (match.team1Name) {
          const team1 = await getTeamByName(match.team1Name);
          if (team1 && team1.players) {
            setTeam1Players(team1.players);
          } else {
            setTeam1Players([]);
          }
        }
        
        if (match.team2Name) {
          const team2 = await getTeamByName(match.team2Name);
          if (team2 && team2.players) {
            setTeam2Players(team2.players);
          } else {
            setTeam2Players([]);
          }
        }
      } catch (error) {
        console.error('Error loading team players:', error);
      }
    };
    
    loadTeamPlayers();
  }, [match.team1Name, match.team2Name]);
  
  // Get available players for the selected team
  const availablePlayers = eventTeam === 'team1' ? team1Players : team2Players;
  
  // Get player display name
  const getPlayerDisplayName = (player) => {
    if (typeof player === 'string') return player;
    if (player && player.name) return player.name;
    return 'Unknown Player';
  };

  // Load tournament data to get matchDuration
  useEffect(() => {
    const loadTournament = async () => {
      if (tournamentId) {
        try {
          const tournamentData = await getTournamentById(tournamentId);
          if (tournamentData) {
            setTournament(tournamentData);
            setMatchDuration(tournamentData.matchDuration || 40);
          }
        } catch (error) {
          console.error('Error loading tournament:', error);
        }
      }
    };
    loadTournament();
  }, [tournamentId]);

  // Subscribe to real-time updates for this match
  useEffect(() => {
    const matchId = initialMatch?.id || match?.id;
    if (!matchId) {
      // Fallback to initial match data if no ID
      if (initialMatch) {
        setMatch(initialMatch);
        setStatus(initialMatch.status || 'scheduled');
        setScheduledTime(initialMatch.scheduledTime || null);
        const initialEvents = initialMatch.events || [];
        setEvents(initialEvents);
        setInitialEventsCount(initialEvents.length);
      }
      return;
    }

    // Set up real-time listener for this match
    const unsubscribe = subscribeToMatch(matchId, (updatedMatch) => {
      if (updatedMatch) {
        setMatch(updatedMatch);
        setStatus(updatedMatch.status || 'scheduled');
        setScheduledTime(updatedMatch.scheduledTime || null);
        const updatedEvents = updatedMatch.events || [];
        setEvents(updatedEvents);
        // Update initial count when match is updated from elsewhere
        setInitialEventsCount(updatedEvents.length);
      }
    });

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [initialMatch?.id, match?.id]);

  const handleSaveMatch = async () => {
    setLoading(true);
    try {
      // Calculate scores from events
      const calculatedScores = calculateScores(events);
      
      const updates = {
        score1: calculatedScores.score1,
        score2: calculatedScores.score2,
        status,
        scheduledTime,
        events,
      };
      
      const updatedMatch = await updateMatch(match.id, updates);
      setMatch(updatedMatch);
      
      // Update initial events count after successful save
      setInitialEventsCount(events.length);
      
      // Show success notification with event count
      const eventCount = events.length;
      const eventMessage = eventCount === 0 
        ? 'Match updated successfully.'
        : eventCount === 1
        ? 'Match updated successfully. 1 event has been saved.'
        : `Match updated successfully. ${eventCount} events have been saved.`;
      
      Alert.alert('Success', eventMessage);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update match');
    } finally {
      setLoading(false);
    }
  };

  // Save date/time to Firestore
  const saveScheduledTime = async (newScheduledTime) => {
    if (!match?.id) {
      Alert.alert('Error', 'Match ID is missing');
      return;
    }

    try {
      setLoading(true);
      await updateMatch(match.id, {
        scheduledTime: newScheduledTime,
      });
      
      // Show success notification
      const formattedDate = format(new Date(newScheduledTime), 'MMM dd, yyyy h:mm a');
      Alert.alert('Success', `Match schedule saved: ${formattedDate}`);
    } catch (error) {
      console.error('Error saving scheduled time:', error);
      Alert.alert('Error', 'Failed to save match schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Save status to Firestore
  const saveStatus = async (newStatus) => {
    if (!match?.id) {
      Alert.alert('Error', 'Match ID is missing');
      return;
    }

    try {
      setLoading(true);
      // Calculate scores from events
      const calculatedScores = calculateScores(events);
      
      const updates = {
        status: newStatus,
        score1: calculatedScores.score1,
        score2: calculatedScores.score2,
        scheduledTime,
        events,
      };

      // If status is changing to "live", start the timer
      if (newStatus === 'live' && status !== 'live') {
        const now = new Date().toISOString();
        updates.timer = {
          startTime: now,
          elapsedSeconds: 0,
          isPaused: false,
          pausedTime: null,
        };
      }

      // If status is changing from "live" to something else, stop the timer
      if (status === 'live' && newStatus !== 'live') {
        const timerData = match.timer || {};
        if (timerData.startTime && !timerData.isPaused) {
          const startTime = new Date(timerData.startTime);
          const now = new Date();
          const elapsed = Math.floor((now - startTime) / 1000) + (timerData.elapsedSeconds || 0);
          updates.timer = {
            ...timerData,
            elapsedSeconds: elapsed,
            isPaused: true,
          };
        }
      }
      
      await updateMatch(match.id, updates);
      setStatus(newStatus);
      
      // Show success notification
      const statusLabels = {
        scheduled: 'Scheduled',
        live: 'Live',
        completed: 'Completed',
      };
      Alert.alert('Success', `Match status updated to: ${statusLabels[newStatus] || newStatus}`);
    } catch (error) {
      console.error('Error saving status:', error);
      Alert.alert('Error', 'Failed to save match status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Pause timer
  const handlePauseTimer = async () => {
    if (!match?.id) return;

    try {
      const timerData = match.timer || {};
      const startTime = timerData.startTime ? new Date(timerData.startTime) : null;
      const now = new Date();
      
      if (startTime && !timerData.isPaused) {
        // Calculate total elapsed time: saved elapsed + time since last start
        const elapsedSinceStart = Math.floor((now - startTime) / 1000);
        const totalElapsed = (timerData.elapsedSeconds || 0) + elapsedSinceStart;
        
        await updateMatch(match.id, {
          timer: {
            ...timerData,
            elapsedSeconds: totalElapsed,
            isPaused: true,
            pausedTime: now.toISOString(),
          },
        });
        
        Alert.alert('Success', 'Match paused for half time');
      }
    } catch (error) {
      console.error('Error pausing timer:', error);
      Alert.alert('Error', 'Failed to pause timer');
    }
  };

  // Resume timer
  const handleResumeTimer = async () => {
    if (!match?.id) return;

    try {
      const timerData = match.timer || {};
      
      if (timerData.isPaused) {
        // When resuming, keep the elapsed seconds and reset start time to now
        // This way the timer continues from where it was paused
        await updateMatch(match.id, {
          timer: {
            ...timerData,
            startTime: new Date().toISOString(), // Reset start time to now
            elapsedSeconds: timerData.elapsedSeconds || 0,
            isPaused: false,
            pausedTime: null,
          },
        });
        
        Alert.alert('Success', 'Match resumed after half time');
      }
    } catch (error) {
      console.error('Error resuming timer:', error);
      Alert.alert('Error', 'Failed to resume timer');
    }
  };

  // Date picker handlers
  const onDateChange = async (event, selectedDate) => {
    if (Platform.OS === 'web') {
      // Web: selectedDate is passed directly as the second parameter
      if (selectedDate && selectedDate instanceof Date) {
        const currentTime = scheduledTime ? new Date(scheduledTime) : new Date();
        selectedDate.setHours(currentTime.getHours(), currentTime.getMinutes());
        const newScheduledTime = selectedDate.toISOString();
        setScheduledTime(newScheduledTime);
        // Save immediately to Firestore
        await saveScheduledTime(newScheduledTime);
      }
    } else if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type !== 'dismissed' && selectedDate) {
        const currentTime = scheduledTime ? new Date(scheduledTime) : new Date();
        selectedDate.setHours(currentTime.getHours(), currentTime.getMinutes());
        const newScheduledTime = selectedDate.toISOString();
        setScheduledTime(newScheduledTime);
        // Save immediately to Firestore
        await saveScheduledTime(newScheduledTime);
      }
    } else {
      // iOS: store in tempDate for modal
      if (selectedDate && selectedDate instanceof Date) {
        setTempDate(selectedDate);
      }
    }
  };

  const onTimeChange = async (event, selectedTime) => {
    if (Platform.OS === 'web') {
      // Web: selectedTime is passed directly as the second parameter
      if (selectedTime && selectedTime instanceof Date) {
        const currentDate = scheduledTime ? new Date(scheduledTime) : new Date();
        currentDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
        const newScheduledTime = currentDate.toISOString();
        setScheduledTime(newScheduledTime);
        // Save immediately to Firestore
        await saveScheduledTime(newScheduledTime);
      }
    } else if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (event.type !== 'dismissed' && selectedTime) {
        const currentDate = scheduledTime ? new Date(scheduledTime) : new Date();
        currentDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
        const newScheduledTime = currentDate.toISOString();
        setScheduledTime(newScheduledTime);
        // Save immediately to Firestore
        await saveScheduledTime(newScheduledTime);
      }
    } else {
      // iOS: store in tempTime for modal
      if (selectedTime && selectedTime instanceof Date) {
        setTempTime(selectedTime);
      }
    }
  };

  const handleDateDone = () => {
    if (tempDate instanceof Date) {
      const currentTime = scheduledTime ? new Date(scheduledTime) : new Date();
      tempDate.setHours(currentTime.getHours(), currentTime.getMinutes());
      setScheduledTime(tempDate.toISOString());
    }
    setShowDatePicker(false);
    setTempDate(null);
  };

  const handleTimeDone = () => {
    if (tempTime instanceof Date) {
      const currentDate = scheduledTime ? new Date(scheduledTime) : new Date();
      currentDate.setHours(tempTime.getHours(), tempTime.getMinutes());
      setScheduledTime(currentDate.toISOString());
    }
    setShowTimePicker(false);
    setTempTime(null);
  };

  const addEvent = () => {
    if (!eventPlayer.trim()) {
      Alert.alert('Error', 'Please enter player name');
      return;
    }

    const newEvent = {
      id: Date.now().toString(),
      type: eventType,
      team: eventTeam,
      teamName: eventTeam === 'team1' ? match.team1Name : match.team2Name,
      player: eventPlayer.trim(),
      minute: eventMinute.trim() || null,
      cardType: eventType === 'card' ? eventCardType : null,
      notes: eventNotes.trim() || null,
      timestamp: new Date().toISOString(),
    };

    // Scores are now calculated automatically from events
    setEvents([...events, newEvent]);
    
    // Show success notification
    const eventTypeLabel = eventType === 'goal' ? 'Goal' : eventType === 'card' ? 'Card' : 'Injury';
    Alert.alert(
      'Event Added',
      `${eventTypeLabel} added for ${eventPlayer.trim()}. Don't forget to save the match to persist the changes.`,
      [{ text: 'OK' }]
    );
    
    // Reset form
    setEventPlayer('');
    setEventMinute('');
    setEventNotes('');
    setShowAddEvent(false);
  };

  const removeEvent = (eventId) => {
    // Scores are now calculated automatically from events
    setEvents(events.filter(e => e.id !== eventId));
  };

  const getStatusColor = (s) => {
    switch (s) {
      case 'live': return '#ff4444';
      case 'completed': return '#4CAF50';
      case 'scheduled': return '#ffa500';
      default: return '#888';
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'goal': return 'football';
      case 'card': return 'card';
      case 'injury': return 'medkit';
      case 'substitution': return 'swap-horizontal';
      default: return 'information-circle';
    }
  };

  const getEventColor = (event) => {
    if (event.type === 'goal') return '#4CAF50';
    if (event.type === 'card') {
      return event.cardType === 'Red Card' ? '#ff4444' : '#ffa500';
    }
    if (event.type === 'injury') return '#ff6b6b';
    return '#6C63FF';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Match Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Schedule Card */}
          <Card style={styles.scheduleCard}>
            <Card.Content>
              <Text style={styles.scheduleTitle}>Match Schedule</Text>
              <View style={styles.dateTimeRow}>
                <Pressable 
                  style={styles.dateTimeButton}
                  onPress={() => {
                    setTempDate(scheduledTime ? new Date(scheduledTime) : new Date());
                    setShowDatePicker(true);
                    setShowTimePicker(false); // Close time picker if open
                  }}
                >
                  <Ionicons name="calendar" size={20} color="#6C63FF" />
                  <Text style={styles.dateTimeText}>
                    {scheduledTime ? format(new Date(scheduledTime), 'MMM dd, yyyy') : 'Set Date'}
                  </Text>
                </Pressable>
                
                <Pressable 
                  style={styles.dateTimeButton}
                  onPress={() => {
                    setTempTime(scheduledTime ? new Date(scheduledTime) : new Date());
                    setShowTimePicker(true);
                    setShowDatePicker(false); // Close date picker if open
                  }}
                >
                  <Ionicons name="time" size={20} color="#6C63FF" />
                  <Text style={styles.dateTimeText}>
                    {scheduledTime ? format(new Date(scheduledTime), 'h:mm a') : 'Set Time'}
                  </Text>
                </Pressable>
              </View>

              {/* iOS Date Picker Modal */}
              {Platform.OS === 'ios' && (
                <Modal
                  visible={showDatePicker}
                  transparent={true}
                  animationType="slide"
                  onRequestClose={() => {
                    setShowDatePicker(false);
                    setTempDate(null);
                  }}
                >
                  <View style={styles.datePickerModal}>
                    <View style={styles.datePickerContainer}>
                      <View style={styles.datePickerHeader}>
                        <Button onPress={() => {
                          setShowDatePicker(false);
                          setTempDate(null);
                        }}>Cancel</Button>
                        <Text style={styles.datePickerTitle}>Select Date</Text>
                        <Button onPress={handleDateDone}>Done</Button>
                      </View>
                      <View style={styles.datePickerWrapper}>
                        <WebDateTimePicker
                          value={tempDate || new Date()}
                          mode="date"
                          display="spinner"
                          onChange={onDateChange}
                          textColor="#000"
                          style={styles.datePicker}
                        />
                      </View>
                    </View>
                  </View>
                </Modal>
              )}

              {/* iOS Time Picker Modal */}
              {Platform.OS === 'ios' && (
                <Modal
                  visible={showTimePicker}
                  transparent={true}
                  animationType="slide"
                  onRequestClose={() => {
                    setShowTimePicker(false);
                    setTempTime(null);
                  }}
                >
                  <View style={styles.datePickerModal}>
                    <View style={styles.datePickerContainer}>
                      <View style={styles.datePickerHeader}>
                        <Button onPress={() => {
                          setShowTimePicker(false);
                          setTempTime(null);
                        }}>Cancel</Button>
                        <Text style={styles.datePickerTitle}>Select Time</Text>
                        <Button onPress={handleTimeDone}>Done</Button>
                      </View>
                      <View style={styles.datePickerWrapper}>
                        <WebDateTimePicker
                          value={tempTime || new Date()}
                          mode="time"
                          display="spinner"
                          onChange={onTimeChange}
                          textColor="#000"
                          style={styles.datePicker}
                        />
                      </View>
                    </View>
                  </View>
                </Modal>
              )}

              {/* Android Pickers */}
              {Platform.OS === 'android' && showDatePicker && (
                <WebDateTimePicker
                  value={scheduledTime ? new Date(scheduledTime) : new Date()}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}
              {Platform.OS === 'android' && showTimePicker && (
                <WebDateTimePicker
                  value={scheduledTime ? new Date(scheduledTime) : new Date()}
                  mode="time"
                  display="default"
                  onChange={onTimeChange}
                />
              )}
              {/* Web Calendar Picker Modal */}
              {Platform.OS === 'web' && showDatePicker && (
                <Modal
                  visible={showDatePicker}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <CalendarPicker
                        value={tempDate || (scheduledTime ? new Date(scheduledTime) : new Date())}
                        onChange={async (event, date) => {
                          if (date) {
                            await onDateChange(event, date);
                          }
                          setShowDatePicker(false);
                        }}
                        onClose={() => setShowDatePicker(false)}
                      />
                    </View>
                  </View>
                </Modal>
              )}

              {/* Web Time Picker Modal */}
              {Platform.OS === 'web' && showTimePicker && (
                <Modal
                  visible={showTimePicker}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setShowTimePicker(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <TimePicker
                        value={tempTime || (scheduledTime ? new Date(scheduledTime) : new Date())}
                        onChange={async (event, time) => {
                          await onTimeChange(event, time);
                          setShowTimePicker(false);
                        }}
                        onClose={() => setShowTimePicker(false)}
                      />
                    </View>
                  </View>
                </Modal>
              )}
            </Card.Content>
          </Card>

          {/* Score Card */}
          <Card style={styles.scoreCard}>
            <Card.Content>
              <View style={styles.matchHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                  <Text style={styles.statusText}>{status.toUpperCase()}</Text>
                </View>
              </View>

              {/* Match Timer - Only show when live */}
              {status === 'live' && (
                <MatchTimer
                  match={match}
                  matchDuration={matchDuration}
                  isOrganizer={true}
                  onPause={handlePauseTimer}
                  onResume={handleResumeTimer}
                />
              )}

              <View style={styles.scoreContainer}>
                <View style={styles.teamScore}>
                  <Text style={styles.teamName}>{match.team1Name}</Text>
                  <View style={styles.scoreDisplay}>
                    <Text style={styles.scoreText}>{score1}</Text>
                    <Text style={styles.scoreLabel}>Goals</Text>
                  </View>
                </View>
                
                <Text style={styles.vs}>-</Text>
                
                <View style={styles.teamScore}>
                  <Text style={styles.teamName}>{match.team2Name}</Text>
                  <View style={styles.scoreDisplay}>
                    <Text style={styles.scoreText}>{score2}</Text>
                    <Text style={styles.scoreLabel}>Goals</Text>
                  </View>
                </View>
              </View>
              
              <Text style={styles.scoreNote}>
                Scores are calculated automatically from goal events. Add goals using the "Add Event" button below.
              </Text>

              {/* Status Buttons */}
              <View style={styles.statusButtons}>
                <TouchableOpacity
                  style={[styles.statusBtn, status === 'scheduled' && styles.statusBtnActive]}
                  onPress={() => saveStatus('scheduled')}
                  disabled={loading || status === 'scheduled'}
                >
                  <Text style={[styles.statusBtnText, status === 'scheduled' && styles.statusBtnTextActive]}>
                    Scheduled
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusBtn, status === 'live' && styles.statusBtnLive]}
                  onPress={() => saveStatus('live')}
                  disabled={loading || status === 'live'}
                >
                  <Ionicons name="radio-button-on" size={12} color={status === 'live' ? '#fff' : '#ff4444'} />
                  <Text style={[styles.statusBtnText, status === 'live' && styles.statusBtnTextActive]}>
                    Live
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusBtn, status === 'completed' && styles.statusBtnCompleted]}
                  onPress={() => saveStatus('completed')}
                  disabled={loading || status === 'completed'}
                >
                  <Text style={[styles.statusBtnText, status === 'completed' && styles.statusBtnTextActive]}>
                    Completed
                  </Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>

          {/* Add Event Section */}
          <Card style={styles.eventCard}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Match Events</Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowAddEvent(!showAddEvent)}
                  icon={showAddEvent ? 'close' : 'plus'}
                  textColor="#4CAF50"
                  style={styles.addEventBtn}
                >
                  {showAddEvent ? 'Cancel' : 'Add Event'}
                </Button>
              </View>

              {showAddEvent && (
                <View style={styles.addEventForm}>
                  {/* Event Type */}
                  <Text style={styles.formLabel}>Event Type</Text>
                  <View style={styles.eventTypeContainer}>
                    {[
                      { value: 'goal', label: 'Goal', icon: 'football' },
                      { value: 'card', label: 'Card', icon: 'card' },
                      { value: 'injury', label: 'Injury', icon: 'medkit' },
                    ].map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        style={[styles.eventTypeBtn, eventType === type.value && styles.eventTypeBtnActive]}
                        onPress={() => setEventType(type.value)}
                      >
                        <Ionicons 
                          name={type.icon} 
                          size={20} 
                          color={eventType === type.value ? '#fff' : '#6C63FF'} 
                        />
                        <Text style={[styles.eventTypeBtnText, eventType === type.value && styles.eventTypeBtnTextActive]}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Team Selection */}
                  <Text style={styles.formLabel}>Team</Text>
                  <View style={styles.teamSelectContainer}>
                    <TouchableOpacity
                      style={[styles.teamSelectBtn, eventTeam === 'team1' && styles.teamSelectBtnActive]}
                      onPress={() => {
                        setEventTeam('team1');
                        setEventPlayer(''); // Reset player selection when team changes
                      }}
                    >
                      <Text style={[styles.teamSelectText, eventTeam === 'team1' && styles.teamSelectTextActive]}>
                        {match.team1Name}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.teamSelectBtn, eventTeam === 'team2' && styles.teamSelectBtnActive]}
                      onPress={() => {
                        setEventTeam('team2');
                        setEventPlayer(''); // Reset player selection when team changes
                      }}
                    >
                      <Text style={[styles.teamSelectText, eventTeam === 'team2' && styles.teamSelectTextActive]}>
                        {match.team2Name}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Card Type (only for card events) */}
                  {eventType === 'card' && (
                    <>
                      <Text style={styles.formLabel}>Card Type</Text>
                      <View style={styles.cardTypeContainer}>
                        <TouchableOpacity
                          style={[styles.cardTypeBtn, styles.yellowCardBtn, eventCardType === 'Yellow Card' && styles.cardTypeBtnActive]}
                          onPress={() => setEventCardType('Yellow Card')}
                        >
                          <View style={[styles.cardIcon, { backgroundColor: '#ffa500' }]} />
                          <Text style={styles.cardTypeText}>Yellow</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.cardTypeBtn, styles.redCardBtn, eventCardType === 'Red Card' && styles.cardTypeBtnActive]}
                          onPress={() => setEventCardType('Red Card')}
                        >
                          <View style={[styles.cardIcon, { backgroundColor: '#ff4444' }]} />
                          <Text style={styles.cardTypeText}>Red</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {/* Player Name Dropdown */}
                  <View style={styles.playerSelectContainer}>
                    <Text style={styles.playerSelectLabel}>Player Name *</Text>
                    <Menu
                      visible={playerMenuVisible}
                      onDismiss={() => setPlayerMenuVisible(false)}
                      anchor={
                        <TouchableOpacity
                          onPress={() => setPlayerMenuVisible(true)}
                          style={styles.playerSelectButton}
                        >
                          <Text style={[styles.playerSelectText, !eventPlayer && styles.playerSelectTextPlaceholder]}>
                            {eventPlayer || 'Select Player'}
                          </Text>
                          <Ionicons name="chevron-down" size={20} color="#fff" />
                        </TouchableOpacity>
                      }
                      contentStyle={styles.menuContent}
                    >
                      {availablePlayers.length === 0 ? (
                        <Menu.Item
                          onPress={() => {
                            setPlayerMenuVisible(false);
                            Alert.alert('No Players', 'No players found for this team. Please add players to the team first.');
                          }}
                          title="No players available"
                          titleStyle={styles.menuItemDisabled}
                        />
                      ) : (
                        availablePlayers.map((player, index) => {
                          const playerName = getPlayerDisplayName(player);
                          const playerNumber = player.jerseyNumber ? ` #${player.jerseyNumber}` : '';
                          return (
                            <Menu.Item
                              key={index}
                              onPress={() => {
                                setEventPlayer(playerName);
                                setPlayerMenuVisible(false);
                              }}
                              title={`${playerName}${playerNumber}`}
                              titleStyle={styles.menuItem}
                            />
                          );
                        })
                      )}
                    </Menu>
                  </View>

                  {/* Minute */}
                  <TextInput
                    label="Minute (optional)"
                    value={eventMinute}
                    onChangeText={setEventMinute}
                    keyboardType="number-pad"
                    placeholder="e.g., 45"
                    style={styles.input}
                    theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
                  />

                  {/* Notes (for injury) */}
                  {eventType === 'injury' && (
                    <TextInput
                      label="Injury Details"
                      value={eventNotes}
                      onChangeText={setEventNotes}
                      multiline
                      style={styles.input}
                      theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
                    />
                  )}

                  <Button mode="contained" onPress={addEvent} style={styles.addEventSubmitBtn}>
                    Add {eventType === 'goal' ? 'Goal' : eventType === 'card' ? 'Card' : 'Injury'}
                  </Button>
                </View>
              )}

              {/* Events List */}
              {events.length === 0 ? (
                <Text style={styles.emptyText}>No events recorded yet</Text>
              ) : (
                <View style={styles.eventsList}>
                  {events.map((event) => (
                    <View key={event.id} style={styles.eventItem}>
                      <View style={[styles.eventIconContainer, { backgroundColor: getEventColor(event) }]}>
                        <Ionicons name={getEventIcon(event.type)} size={16} color="#fff" />
                      </View>
                      <View style={styles.eventDetails}>
                        <Text style={styles.eventPlayer}>{event.player}</Text>
                        <Text style={styles.eventInfo}>
                          {event.teamName}
                          {event.minute && ` • ${event.minute}'`}
                          {event.cardType && ` • ${event.cardType}`}
                        </Text>
                        {event.notes && <Text style={styles.eventNotes}>{event.notes}</Text>}
                      </View>
                      <TouchableOpacity onPress={() => removeEvent(event.id)}>
                        <Ionicons name="close-circle" size={24} color="#ff4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Save Button */}
          <Button
            mode="contained"
            onPress={handleSaveMatch}
            loading={loading}
            disabled={loading || !hasNewEvents}
            style={[styles.saveButton, !hasNewEvents && styles.saveButtonDisabled]}
            contentStyle={styles.saveButtonContent}
          >
            Save Match Updates
          </Button>
          {!hasNewEvents && (
            <Text style={styles.saveButtonHint}>
              Add an event to enable saving
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f0f1e',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1a1a2e',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scheduleCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    marginBottom: 16,
  },
  scheduleTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0f1e',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6C63FF',
    gap: 8,
  },
  dateTimeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  datePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    alignItems: 'center',
    justifyContent: 'center',
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
  webDatePicker: {
    width: '100%',
    marginTop: 8,
    marginBottom: 8,
  },
  webPickerContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  webPickerLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  scoreCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    marginBottom: 16,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  matchTime: {
    color: '#ccc',
    fontSize: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  teamScore: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  scoreDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    color: '#4CAF50',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreLabel: {
    color: '#888',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  scoreNote: {
    color: '#888',
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: -10,
    marginBottom: 16,
  },
  vs: {
    color: '#6C63FF',
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0f0f1e',
    gap: 4,
  },
  statusBtnActive: {
    backgroundColor: '#ffa500',
  },
  statusBtnLive: {
    backgroundColor: '#ff4444',
  },
  statusBtnCompleted: {
    backgroundColor: '#4CAF50',
  },
  statusBtnText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBtnTextActive: {
    color: '#fff',
  },
  eventCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addEventBtn: {
    borderColor: '#4CAF50',
  },
  addEventForm: {
    backgroundColor: '#0f0f1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  formLabel: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  eventTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  eventTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#6C63FF',
    gap: 6,
  },
  eventTypeBtnActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  eventTypeBtnText: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: '600',
  },
  eventTypeBtnTextActive: {
    color: '#fff',
  },
  teamSelectContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  teamSelectBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#4CAF50',
    alignItems: 'center',
  },
  teamSelectBtnActive: {
    backgroundColor: '#4CAF50',
  },
  teamSelectText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  teamSelectTextActive: {
    color: '#fff',
  },
  cardTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  cardTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    gap: 8,
  },
  yellowCardBtn: {
    borderColor: '#ffa500',
  },
  redCardBtn: {
    borderColor: '#ff4444',
  },
  cardTypeBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardIcon: {
    width: 16,
    height: 22,
    borderRadius: 2,
  },
  cardTypeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 8,
  },
  playerSelectContainer: {
    marginBottom: 16,
  },
  playerSelectLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  playerSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  playerSelectText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  playerSelectTextPlaceholder: {
    color: '#888',
  },
  menuContent: {
    backgroundColor: '#1a1a2e',
  },
  menuItem: {
    color: '#fff',
  },
  menuItemDisabled: {
    color: '#888',
  },
  addEventSubmitBtn: {
    backgroundColor: '#4CAF50',
    marginTop: 8,
  },
  emptyText: {
    color: '#ccc',
    textAlign: 'center',
    padding: 20,
  },
  eventsList: {
    gap: 8,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f1e',
    padding: 12,
    borderRadius: 8,
  },
  eventIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventDetails: {
    flex: 1,
  },
  eventPlayer: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  eventInfo: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 2,
  },
  eventNotes: {
    color: '#ff6b6b',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    marginBottom: 8,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#2a2a3e',
    opacity: 0.5,
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
  saveButtonHint: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 32,
    fontStyle: 'italic',
  },
});

