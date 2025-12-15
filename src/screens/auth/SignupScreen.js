import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { TextInput, Button, Text, HelperText, Checkbox } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/auth';
import { useDispatch } from 'react-redux';
import { setUser, setProfile } from '../../store/slices/authSlice';

export default function SignupScreen() {
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState(['spectator']); // Array of selected roles
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const toggleRole = (role) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        // Remove role, but ensure at least one role is selected
        const newRoles = prev.filter(r => r !== role);
        return newRoles.length > 0 ? newRoles : ['spectator'];
      } else {
        // Add role
        return [...prev, role];
      }
    });
  };

  const onSignup = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Ensure at least one role is selected
      if (selectedRoles.length === 0) {
        setError('Please select at least one role');
        setLoading(false);
        return;
      }
      
      console.log('Starting signup process...');
      const { user, error: authError, isNewUser } = await authService.signUpWithEmail(
        email,
        password,
        displayName,
        phone,
        selectedRoles, // Pass array of roles
      );
      console.log('Signup response:', { user: !!user, error: authError, isNewUser });

      if (authError) {
        console.error('Signup error:', authError);
        setError(authError);
        setLoading(false);
        // Keep the error visible for at least 2 seconds before any navigation
        setTimeout(() => {
          // Error will remain visible, navigation handled by RootNavigator if user was signed out
        }, 2000);
        return;
      }

      if (!user) {
        console.error('No user returned from signup');
        setError('Signup failed. Please try again.');
        setLoading(false);
        return;
      }

      // Set user immediately - don't wait for profile fetch
      dispatch(setUser({ uid: user.uid, email: user.email, phone: user.phoneNumber }));
      
      // Set loading to false immediately - navigation will handle the rest
      setLoading(false);
      console.log('Signup process completed');
      
      if (!isNewUser) {
        // User already existed and added new roles
        // Fetch updated profile to show success message
        try {
          const { profile } = await authService.getUserProfile(user.uid);
          if (profile) {
            dispatch(setProfile(profile));
            const newRoles = selectedRoles.filter(role => 
              !(profile.roles || []).some(existingRole => existingRole === role)
            );
            if (newRoles.length > 0) {
              setError(`Successfully added new role(s): ${newRoles.join(', ')}. You can now switch between roles.`);
            } else {
              setError('Your account has been updated. You can now switch between roles.');
            }
          }
        } catch (profileErr) {
          console.warn('Could not fetch updated profile:', profileErr);
          setError('New roles added successfully. Please sign in to access them.');
        }
      } else {
        // For new users, let RootNavigator handle profile fetch via auth state change
        // This prevents blocking and allows proper navigation
        console.log('New user created, RootNavigator will handle profile fetch');
      }
    } catch (error) {
      console.error('Unexpected error during signup:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../../assets/images/footy-fest-logo.png')}
              style={styles.logo}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
              onError={(error) => {
                console.warn('Logo image not found. Please add footy-fest-logo.png to assets/images/');
              }}
            />
          </View>
        </View>

        <Text variant="headlineMedium" style={styles.title}>
          Create Account
        </Text>
      <TextInput
        label="Full Name"
        value={displayName}
        onChangeText={setDisplayName}
        style={styles.input}
      />
      <TextInput
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={styles.input}
      />
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Text style={styles.label}>Select Your Role(s) *</Text>
      <Text style={styles.labelHint}>You can select multiple roles. You can switch between them after signing in.</Text>
      <View style={styles.rolesContainer}>
        <TouchableOpacity
          style={[
            styles.roleOption,
            selectedRoles.includes('organizer') && styles.roleOptionSelected
          ]}
          onPress={() => toggleRole('organizer')}
        >
          <View style={styles.roleOptionContent}>
            <Ionicons 
              name={selectedRoles.includes('organizer') ? 'checkbox' : 'checkbox-outline'} 
              size={24} 
              color={selectedRoles.includes('organizer') ? '#4CAF50' : '#888'} 
            />
            <View style={styles.roleOptionText}>
              <Text style={[
                styles.roleOptionTitle,
                selectedRoles.includes('organizer') && styles.roleOptionTitleSelected
              ]}>
                Organizer
              </Text>
              <Text style={styles.roleOptionDescription}>
                Create and manage tournaments
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleOption,
            selectedRoles.includes('team') && styles.roleOptionSelected
          ]}
          onPress={() => toggleRole('team')}
        >
          <View style={styles.roleOptionContent}>
            <Ionicons 
              name={selectedRoles.includes('team') ? 'checkbox' : 'checkbox-outline'} 
              size={24} 
              color={selectedRoles.includes('team') ? '#4CAF50' : '#888'} 
            />
            <View style={styles.roleOptionText}>
              <Text style={[
                styles.roleOptionTitle,
                selectedRoles.includes('team') && styles.roleOptionTitleSelected
              ]}>
                Team
              </Text>
              <Text style={styles.roleOptionDescription}>
                Join tournaments and manage your team
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleOption,
            selectedRoles.includes('spectator') && styles.roleOptionSelected
          ]}
          onPress={() => toggleRole('spectator')}
        >
          <View style={styles.roleOptionContent}>
            <Ionicons 
              name={selectedRoles.includes('spectator') ? 'checkbox' : 'checkbox-outline'} 
              size={24} 
              color={selectedRoles.includes('spectator') ? '#4CAF50' : '#888'} 
            />
            <View style={styles.roleOptionText}>
              <Text style={[
                styles.roleOptionTitle,
                selectedRoles.includes('spectator') && styles.roleOptionTitleSelected
              ]}>
                Spectator
              </Text>
              <Text style={styles.roleOptionDescription}>
                View tournaments and match schedules
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
      {error ? <HelperText type="error">{error}</HelperText> : null}
        <View style={styles.buttonContainer}>
          <Button 
            mode="outlined" 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            textColor="#fff"
          >
            Back
          </Button>
          <Button 
            mode="contained" 
            onPress={onSignup} 
            loading={loading} 
            style={styles.signupButton}
          >
            Sign Up
          </Button>
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 10,
  },
  logoCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  backButton: {
    flex: 1,
    borderColor: '#fff',
    marginRight: 8,
  },
  signupButton: {
    flex: 1,
    marginLeft: 8,
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  labelHint: {
    marginTop: 4,
    marginBottom: 12,
    color: '#aaa',
    fontSize: 12,
  },
  rolesContainer: {
    marginBottom: 12,
    width: '100%',
  },
  roleOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleOptionSelected: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
  },
  roleOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  roleOptionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  roleOptionTitleSelected: {
    color: '#4CAF50',
  },
  roleOptionDescription: {
    color: '#aaa',
    fontSize: 12,
  },
});


