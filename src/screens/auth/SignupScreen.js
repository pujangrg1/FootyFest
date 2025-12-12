import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { TextInput, Button, Text, HelperText, SegmentedButtons } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../../services/auth';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/slices/authSlice';

export default function SignupScreen() {
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('spectator');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const onSignup = async () => {
    setLoading(true);
    setError('');
    const { user, error: authError } = await authService.signUpWithEmail(
      email,
      password,
      displayName,
      phone,
      role,
    );
    setLoading(false);

    if (authError) {
      setError(authError);
    } else if (user) {
      // Include role in the user data so RootNavigator can use it immediately
      dispatch(setUser({ uid: user.uid, email: user.email, phone: user.phoneNumber, role: role }));
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
      <Text style={styles.label}>Role</Text>
      <View style={styles.segmentedContainer}>
        <SegmentedButtons
          value={role}
          onValueChange={setRole}
          buttons={[
            { 
              value: 'organizer', 
              label: 'Organizer',
              style: { flex: 1, minWidth: 0 }
            },
            { 
              value: 'team', 
              label: 'Teams',
              style: { flex: 1, minWidth: 0 }
            },
            { 
              value: 'spectator', 
              label: 'Spectator',
              style: { flex: 1, minWidth: 0 }
            },
          ]}
          style={styles.segmented}
          density="medium"
          theme={{
            colors: {
              secondaryContainer: '#4CAF50',
              onSecondaryContainer: '#fff',
              outline: '#fff',
              onSurface: '#fff',
            },
          }}
        />
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
  },
  segmentedContainer: {
    marginBottom: 12,
    width: '100%',
  },
  segmented: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});


