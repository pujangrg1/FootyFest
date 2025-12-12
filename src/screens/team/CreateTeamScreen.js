import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../firebase/config';
import { createTeam } from '../../services/teams';

const POSITIONS = [
  'Goalkeeper',
  'Defender',
  'Midfielder',
  'Forward',
];

// Helper function to upload image to Firebase Storage
const uploadImage = async (uri, path) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export default function CreateTeamScreen({ onTeamCreated }) {
  const [teamName, setTeamName] = useState('');
  const [yearEstablished, setYearEstablished] = useState('');
  const [description, setDescription] = useState('');
  const [managerName, setManagerName] = useState('');
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerJersey, setNewPlayerJersey] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState('');
  const [newPlayerPhoto, setNewPlayerPhoto] = useState(null);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teamLogo, setTeamLogo] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPlayerPhoto, setUploadingPlayerPhoto] = useState(false);

  // Pick team logo from gallery
  const pickTeamLogo = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setTeamLogo(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Pick player photo from gallery
  const pickPlayerPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setNewPlayerPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const addPlayer = () => {
    if (!newPlayerName.trim()) {
      Alert.alert('Error', 'Please enter player name');
      return;
    }
    if (!newPlayerJersey.trim()) {
      Alert.alert('Error', 'Please enter jersey number');
      return;
    }
    if (!newPlayerPosition) {
      Alert.alert('Error', 'Please select player position');
      return;
    }

    // Check if jersey number already exists
    const jerseyExists = players.some(p => p.jerseyNumber === newPlayerJersey.trim());
    if (jerseyExists) {
      Alert.alert('Error', 'This jersey number is already assigned to another player');
      return;
    }

    setPlayers([
      ...players,
      {
        id: Date.now().toString(),
        name: newPlayerName.trim(),
        jerseyNumber: newPlayerJersey.trim(),
        position: newPlayerPosition,
        photoUri: newPlayerPhoto, // Store local URI temporarily
      }
    ]);
    setNewPlayerName('');
    setNewPlayerJersey('');
    setNewPlayerPosition('');
    setNewPlayerPhoto(null);
  };

  const removePlayer = (playerId) => {
    setPlayers(players.filter(p => p.id !== playerId));
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      Alert.alert('Error', 'Please enter team name');
      return;
    }
    if (!managerName.trim()) {
      Alert.alert('Error', 'Please enter manager name');
      return;
    }
    if (players.length === 0) {
      Alert.alert('Error', 'Please add at least one player to the team');
      return;
    }

    setLoading(true);
    try {
      // Generate a unique team ID for file paths
      const teamId = `team_${Date.now()}`;
      
      // Upload team logo if exists
      let logoUrl = null;
      if (teamLogo) {
        try {
          logoUrl = await uploadImage(teamLogo, `teams/${teamId}/logo.jpg`);
        } catch (error) {
          console.error('Failed to upload team logo:', error);
          // Continue without logo
        }
      }

      // Upload player photos
      const playersWithPhotos = await Promise.all(
        players.map(async (player, index) => {
          let photoUrl = null;
          if (player.photoUri) {
            try {
              photoUrl = await uploadImage(
                player.photoUri,
                `teams/${teamId}/players/${player.id}.jpg`
              );
            } catch (error) {
              console.error(`Failed to upload photo for player ${player.name}:`, error);
              // Continue without photo
            }
          }
          return {
            id: player.id,
            name: player.name,
            jerseyNumber: player.jerseyNumber,
            position: player.position,
            photoURL: photoUrl,
          };
        })
      );

      const team = await createTeam({
        name: teamName.trim(),
        yearEstablished: yearEstablished.trim(),
        description: description.trim(),
        players: playersWithPhotos,
        managerName: managerName.trim(),
        logo: logoUrl,
      });
      
      Alert.alert('Success', 'Team created successfully!');
      if (onTeamCreated) {
        onTeamCreated(team);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="headlineMedium" style={styles.title}>
            Create Your Team
          </Text>
          <Text style={styles.subtitle}>
            Set up your team profile and add your squad members
          </Text>

          {/* Team Information */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                <Ionicons name="football" size={20} color="#6C63FF" /> Team Information
              </Text>
              
              {/* Team Logo Picker */}
              <View style={styles.logoSection}>
                <Text style={styles.logoLabel}>Team Logo</Text>
                <TouchableOpacity style={styles.logoPickerContainer} onPress={pickTeamLogo}>
                  {teamLogo ? (
                    <Image source={{ uri: teamLogo }} style={styles.logoPreview} />
                  ) : (
                    <View style={styles.logoPlaceholder}>
                      <Ionicons name="camera" size={32} color="#6C63FF" />
                      <Text style={styles.logoPlaceholderText}>Add Logo</Text>
                    </View>
                  )}
                  <View style={styles.logoEditBadge}>
                    <Ionicons name="pencil" size={14} color="#fff" />
                  </View>
                </TouchableOpacity>
                {teamLogo && (
                  <TouchableOpacity 
                    style={styles.removeLogoButton}
                    onPress={() => setTeamLogo(null)}
                  >
                    <Text style={styles.removeLogoText}>Remove Logo</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <TextInput
                label="Team Name *"
                value={teamName}
                onChangeText={setTeamName}
                style={styles.input}
                theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
              />
              
              <TextInput
                label="Year Established"
                value={yearEstablished}
                onChangeText={setYearEstablished}
                keyboardType="number-pad"
                placeholder="e.g., 2020"
                style={styles.input}
                theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
              />
              
              <TextInput
                label="Team Description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholder="A short description about your team..."
                style={styles.input}
                theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
              />
              
              <TextInput
                label="Manager Name *"
                value={managerName}
                onChangeText={setManagerName}
                style={styles.input}
                theme={{ colors: { onSurface: '#000', primary: '#4CAF50' } }}
              />
            </Card.Content>
          </Card>

          {/* Add Players */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                <Ionicons name="people" size={20} color="#6C63FF" /> Squad Members
              </Text>
              
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
                <Card style={styles.positionPicker}>
                  <Card.Content>
                    {POSITIONS.map((position) => (
                      <TouchableOpacity
                        key={position}
                        style={[
                          styles.positionOption,
                          newPlayerPosition === position && styles.positionOptionSelected
                        ]}
                        onPress={() => {
                          setNewPlayerPosition(position);
                          setShowPositionPicker(false);
                        }}
                      >
                        <Text style={[
                          styles.positionOptionText,
                          newPlayerPosition === position && styles.positionOptionTextSelected
                        ]}>
                          {position}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </Card.Content>
                </Card>
              )}
              
              {/* Player Photo Picker */}
              <View style={styles.playerPhotoSection}>
                <Text style={styles.playerPhotoLabel}>Player Photo (Optional)</Text>
                <View style={styles.playerPhotoRow}>
                  <TouchableOpacity style={styles.playerPhotoPickerContainer} onPress={pickPlayerPhoto}>
                    {newPlayerPhoto ? (
                      <Image source={{ uri: newPlayerPhoto }} style={styles.playerPhotoPreview} />
                    ) : (
                      <View style={styles.playerPhotoPlaceholder}>
                        <Ionicons name="person-add" size={24} color="#6C63FF" />
                      </View>
                    )}
                  </TouchableOpacity>
                  {newPlayerPhoto && (
                    <TouchableOpacity 
                      style={styles.removePlayerPhotoButton}
                      onPress={() => setNewPlayerPhoto(null)}
                    >
                      <Ionicons name="close-circle" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  )}
                  <Text style={styles.playerPhotoHint}>
                    {newPlayerPhoto ? 'Photo selected' : 'Tap to add photo'}
                  </Text>
                </View>
              </View>
              
              <Button
                mode="outlined"
                onPress={addPlayer}
                icon="plus"
                style={styles.addPlayerButton}
                textColor="#4CAF50"
              >
                Add Player
              </Button>
            </Card.Content>
          </Card>

          {/* Players List */}
          {players.length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Added Players ({players.length})
                </Text>
                
                {players.map((player) => (
                  <View key={player.id} style={styles.playerItem}>
                    <View style={styles.playerInfo}>
                      {/* Player Photo or Jersey Badge */}
                      {player.photoUri ? (
                        <Image source={{ uri: player.photoUri }} style={styles.playerListPhoto} />
                      ) : (
                        <View style={styles.jerseyBadge}>
                          <Text style={styles.jerseyNumber}>{player.jerseyNumber}</Text>
                        </View>
                      )}
                      <View style={styles.playerDetails}>
                        <Text style={styles.playerName}>{player.name}</Text>
                        <View style={styles.playerMetaRow}>
                          <Text style={styles.playerPosition}>{player.position}</Text>
                          <Text style={styles.playerJerseyText}>#{player.jerseyNumber}</Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => removePlayer(player.id)}>
                      <Ionicons name="close-circle" size={24} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}

          {/* Create Team Button */}
          <Button
            mode="contained"
            onPress={handleCreateTeam}
            loading={loading}
            disabled={loading}
            style={styles.createButton}
            contentStyle={styles.createButtonContent}
          >
            Create Team
          </Button>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 14,
  },
  card: {
    backgroundColor: '#1a1a2e',
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  positionPicker: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 8,
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
    fontSize: 16,
    color: '#000',
  },
  positionOptionTextSelected: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  addPlayerButton: {
    marginTop: 8,
    borderColor: '#4CAF50',
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f0f1e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  jerseyBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jerseyNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  playerDetails: {
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
  createButton: {
    marginTop: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  createButtonContent: {
    paddingVertical: 8,
  },
  // Logo styles
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoLabel: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 12,
  },
  logoPickerContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#0f0f1e',
    borderWidth: 3,
    borderColor: '#6C63FF',
    borderStyle: 'dashed',
  },
  logoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    color: '#6C63FF',
    fontSize: 12,
    marginTop: 4,
  },
  logoEditBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#6C63FF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a2e',
  },
  removeLogoButton: {
    marginTop: 8,
  },
  removeLogoText: {
    color: '#ff4444',
    fontSize: 12,
  },
  // Player photo styles
  playerPhotoSection: {
    marginTop: 12,
    marginBottom: 8,
  },
  playerPhotoLabel: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 8,
  },
  playerPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerPhotoPickerContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#0f0f1e',
    borderWidth: 2,
    borderColor: '#6C63FF',
    borderStyle: 'dashed',
  },
  playerPhotoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playerPhotoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePlayerPhotoButton: {
    marginLeft: 8,
  },
  playerPhotoHint: {
    color: '#888',
    fontSize: 12,
    marginLeft: 12,
    flex: 1,
  },
  // Player list photo
  playerListPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  playerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  playerJerseyText: {
    color: '#4CAF50',
    fontSize: 12,
    marginLeft: 8,
    fontWeight: 'bold',
  },
});

