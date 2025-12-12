import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity, Modal, Pressable } from 'react-native';
import { TextInput, Button, Text, HelperText, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import WebDateTimePicker from '../../components/web/WebDateTimePicker';
import { format } from 'date-fns';
import { createTournament } from '../../services/tournaments';
import { useDispatch } from 'react-redux';
import { addTournament } from '../../store/slices/tournamentsSlice';

export default function CreateTournamentScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  // Tournament Details
  const [tournamentName, setTournamentName] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [venue, setVenue] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);
  
  // Game Format
  const [totalTeams, setTotalTeams] = useState('');
  const [totalTeams35Plus, setTotalTeams35Plus] = useState('');
  const [playersPerTeam, setPlayersPerTeam] = useState('7');
  const [matchDuration, setMatchDuration] = useState('40');
  const [substitutionRules, setSubstitutionRules] = useState('Rolling Substitutions');
  const [substitutionMenuVisible, setSubstitutionMenuVisible] = useState(false);
  const [additionalRules, setAdditionalRules] = useState('');
  
  // Organizer Contact
  const [organizerName, setOrganizerName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const substitutionOptions = [
    'Rolling Substitutions',
    'Limited Substitutions',
    'No Substitutions',
  ];

  const onStartDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
      if (event.type !== 'dismissed' && selectedDate) {
        setStartDate(selectedDate);
      }
    } else {
      // iOS - store temp date while user is selecting
      if (selectedDate && selectedDate instanceof Date) {
        setTempStartDate(selectedDate);
      }
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
      if (event.type !== 'dismissed' && selectedDate) {
        setEndDate(selectedDate);
      }
    } else {
      // iOS - store temp date while user is selecting
      if (selectedDate && selectedDate instanceof Date) {
        setTempEndDate(selectedDate);
      }
    }
  };

  const handleStartDateDone = () => {
    if (tempStartDate instanceof Date) {
      setStartDate(tempStartDate);
    }
    setShowStartDatePicker(false);
    setTempStartDate(null);
  };

  const handleEndDateDone = () => {
    if (tempEndDate instanceof Date) {
      setEndDate(tempEndDate);
    }
    setShowEndDatePicker(false);
    setTempEndDate(null);
  };

  const clearForm = () => {
    // Tournament Details
    setTournamentName('');
    setStartDate(null);
    setEndDate(null);
    setVenue('');
    setTempStartDate(null);
    setTempEndDate(null);
    
    // Game Format
    setTotalTeams('');
    setTotalTeams35Plus('');
    setPlayersPerTeam('7');
    setMatchDuration('40');
    setSubstitutionRules('Rolling Substitutions');
    setAdditionalRules('');
    
    // Organizer Contact
    setOrganizerName('');
    setContactEmail('');
    
    // Reset error
    setError('');
  };

  const onCreate = async () => {
    setError('');
    
    // Validation
    if (!tournamentName) {
      setError('Tournament name is required');
      return;
    }
    if (!startDate) {
      setError('Start date is required');
      return;
    }
    if (!endDate) {
      setError('End date is required');
      return;
    }
    if (!venue) {
      setError('Venue/Location is required');
      return;
    }
    if (!totalTeams || Number(totalTeams) < 4) {
      setError('Total number of teams must be at least 4');
      return;
    }
    if (!organizerName) {
      setError('Organizer name is required');
      return;
    }
    if (!contactEmail) {
      setError('Contact email is required');
      return;
    }

    setLoading(true);
    try {
      const tournament = await createTournament({
        name: tournamentName,
        location: venue,
        description: additionalRules || '',
        maxTeams: Number(totalTeams) || 0,
        maxTeams35Plus: Number(totalTeams35Plus) || 0,
        playersPerTeam: Number(playersPerTeam) || 7,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        matchDuration: Number(matchDuration) || 40,
        substitutionRules,
        organizerName,
        contactEmail,
      });
      dispatch(addTournament(tournament));
      clearForm();
      navigation.goBack();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="trophy" size={32} color="#4CAF50" />
              <Text variant="headlineMedium" style={styles.headerTitle}>
                7v7 Tournament Creator
              </Text>
              <Text variant="bodyMedium" style={styles.headerSubtitle}>
                Set up your entire soccer event structure
              </Text>
            </View>

            {/* Tournament Details Section */}
            <Card style={styles.sectionCard}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <Ionicons name="clipboard-outline" size={24} color="#4CAF50" />
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Tournament Details
                  </Text>
                </View>
                
                <TextInput
                  label="Tournament Name *"
                  value={tournamentName}
                  onChangeText={setTournamentName}
                  placeholder="e.g., Summer Clash Cup 2024"
                  style={styles.input}
                  theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
                />
                
                <Pressable onPress={() => {
                  const initialDate = startDate instanceof Date ? startDate : new Date();
                  setTempStartDate(initialDate);
                  setShowStartDatePicker(true);
                }}>
                  <View pointerEvents="none">
                    <TextInput
                      label="Start Date *"
                      value={startDate instanceof Date ? format(startDate, 'MM/dd/yyyy') : ''}
                      placeholder="mm/dd/yyyy"
                      editable={false}
                      right={<TextInput.Icon icon="calendar" />}
                      style={styles.input}
                      theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
                    />
                  </View>
                </Pressable>
                
                {Platform.OS === 'web' ? (
                  <WebDateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={onStartDateChange}
                    minimumDate={new Date()}
                    style={styles.webDatePicker}
                  />
                ) : Platform.OS === 'ios' ? (
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
                              const date = tempStartDate || startDate;
                              return date instanceof Date ? date : new Date();
                            })()}
                            mode="date"
                            display="spinner"
                            onChange={onStartDateChange}
                            minimumDate={new Date()}
                            textColor="#000"
                            style={styles.datePicker}
                            themeVariant="light"
                          />
                        </View>
                      </View>
                    </View>
                  </Modal>
                ) : (
                  showStartDatePicker && (
                    <WebDateTimePicker
                      value={startDate || new Date()}
                      mode="date"
                      display="default"
                      onChange={onStartDateChange}
                      minimumDate={new Date()}
                    />
                  )
                )}
                
                <Pressable onPress={() => {
                  const initialDate = endDate instanceof Date ? endDate : (startDate instanceof Date ? startDate : new Date());
                  setTempEndDate(initialDate);
                  setShowEndDatePicker(true);
                }}>
                  <View pointerEvents="none">
                    <TextInput
                      label="End Date *"
                      value={endDate instanceof Date ? format(endDate, 'MM/dd/yyyy') : ''}
                      placeholder="mm/dd/yyyy"
                      editable={false}
                      right={<TextInput.Icon icon="calendar" />}
                      style={styles.input}
                      theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
                    />
                  </View>
                </Pressable>
                
                {Platform.OS === 'web' ? (
                  <WebDateTimePicker
                    value={endDate || startDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={onEndDateChange}
                    minimumDate={startDate || new Date()}
                    style={styles.webDatePicker}
                  />
                ) : Platform.OS === 'ios' ? (
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
                              const date = tempEndDate || endDate || startDate;
                              return date instanceof Date ? date : new Date();
                            })()}
                            mode="date"
                            display="spinner"
                            onChange={onEndDateChange}
                            minimumDate={startDate instanceof Date ? startDate : new Date()}
                            textColor="#000"
                            style={styles.datePicker}
                            themeVariant="light"
                          />
                        </View>
                      </View>
                    </View>
                  </Modal>
                ) : (
                  showEndDatePicker && (
                    <WebDateTimePicker
                      value={endDate || startDate || new Date()}
                      mode="date"
                      display="default"
                      onChange={onEndDateChange}
                      minimumDate={startDate || new Date()}
                    />
                  )
                )}
                
                <TextInput
                  label="Venue/Location *"
                  value={venue}
                  onChangeText={setVenue}
                  placeholder="e.g., North End Park, Field #3"
                  style={styles.input}
                  theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
                />
              </Card.Content>
            </Card>

            {/* Game Format Section */}
            <Card style={styles.sectionCard}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <Ionicons name="people-outline" size={24} color="#4CAF50" />
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Game Format (7v7)
                  </Text>
                </View>
                
                <View style={styles.noteContainer}>
                  <Text style={styles.noteText}>
                    Note: This is a 7-a-side tournament (6 outfield + 1 keeper).
                  </Text>
                </View>
                
                <TextInput
                  label="Total Number of Teams in Open Category*"
                  value={totalTeams}
                  onChangeText={setTotalTeams}
                  placeholder="Minimum 4"
                  keyboardType="number-pad"
                  style={styles.input}
                  theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
                />
                
                <TextInput
                  label="Total Number of Teams in 35+ Category*"
                  value={totalTeams35Plus}
                  onChangeText={setTotalTeams35Plus}
                  placeholder="Minimum 4"
                  keyboardType="number-pad"
                  style={styles.input}
                  theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
                />
                
                <TextInput
                  label="Total Number of Players in each team"
                  value={playersPerTeam}
                  onChangeText={setPlayersPerTeam}
                  placeholder="e.g., 7"
                  keyboardType="number-pad"
                  style={styles.input}
                  theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
                />
                
                <TextInput
                  label="Match Duration (Minutes) *"
                  value={matchDuration}
                  onChangeText={setMatchDuration}
                  keyboardType="number-pad"
                  style={styles.input}
                  theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
                />
                
                <Pressable 
                  onPress={() => setSubstitutionMenuVisible(true)}
                  style={styles.substitutionButton}
                >
                  <View pointerEvents="none">
                    <TextInput
                      label="Substitution Rules"
                      value={substitutionRules}
                      editable={false}
                      right={<TextInput.Icon icon="chevron-down" />}
                      style={styles.input}
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
                            substitutionRules === option && styles.modalOptionSelected
                          ]}
                          onPress={() => {
                            setSubstitutionRules(option);
                            setSubstitutionMenuVisible(false);
                          }}
                        >
                          <Text style={[
                            styles.modalOptionText,
                            substitutionRules === option && styles.modalOptionTextSelected
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
                  value={additionalRules}
                  onChangeText={setAdditionalRules}
                  placeholder="e.g., No slide tackles, 5-minute break at half time, Tie-breakers are PKs."
                  multiline
                  numberOfLines={4}
                  style={styles.input}
                  theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
                />
              </Card.Content>
            </Card>

            {/* Organizer Contact Section */}
            <Card style={styles.sectionCard}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <Ionicons name="send-outline" size={24} color="#4CAF50" />
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Organizer Contact
                  </Text>
                </View>
                
                <TextInput
                  label="Organizer Name *"
                  value={organizerName}
                  onChangeText={setOrganizerName}
                  placeholder="Your Name"
                  style={styles.input}
                  theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
                />
                
                <TextInput
                  label="Contact Email *"
                  value={contactEmail}
                  onChangeText={setContactEmail}
                  placeholder="you@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
                />
              </Card.Content>
            </Card>

            {error ? <HelperText type="error" style={styles.errorText}>{error}</HelperText> : null}
            
            <Button
              mode="contained"
              onPress={onCreate}
              loading={loading}
              style={styles.createButton}
              contentStyle={styles.createButtonContent}
              icon="send"
            >
              Validate & Create Tournament
            </Button>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    padding: 16,
    backgroundColor: '#0f0f1e',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#ccc',
    textAlign: 'center',
  },
  sectionCard: {
    marginBottom: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  noteContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  noteText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
    width: '100%',
  },
  errorText: {
    marginTop: 8,
    marginBottom: 8,
  },
  createButton: {
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
  },
  createButtonContent: {
    paddingVertical: 8,
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
  webDatePicker: {
    width: '100%',
    marginTop: 8,
  },
  substitutionButton: {
    marginBottom: 12,
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
});
