import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../services/auth';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/slices/authSlice';

const REMEMBERED_EMAIL_KEY = '@soccer_tournament:remembered_email';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Load remembered email on mount
  useEffect(() => {
    loadRememberedEmail();
  }, []);

  const loadRememberedEmail = async () => {
    try {
      const rememberedEmail = await AsyncStorage.getItem(REMEMBERED_EMAIL_KEY);
      if (rememberedEmail) {
        setEmail(rememberedEmail);
      }
    } catch (error) {
      console.error('Error loading remembered email:', error);
    }
  };

  const saveRememberedEmail = async (emailToSave) => {
    try {
      if (emailToSave && emailToSave.trim()) {
        await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, emailToSave.trim());
      }
    } catch (error) {
      console.error('Error saving remembered email:', error);
    }
  };

  const onLogin = async () => {
    setLoading(true);
    setError('');
    const { user, error: authError } = await authService.signInWithEmail(email, password);
    setLoading(false);

    if (authError) {
      setError(authError);
    } else if (user) {
      // Save email for next time
      await saveRememberedEmail(email);
      dispatch(setUser({ uid: user.uid, email: user.email, phone: user.phoneNumber }));
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
          Sign In
        </Text>
      <View style={styles.inputContainer}>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          contentStyle={styles.inputContent}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          contentStyle={styles.inputContent}
        />
        {error ? <HelperText type="error" style={styles.errorText}>{error}</HelperText> : null}
        <Button mode="contained" onPress={onLogin} loading={loading} style={styles.button} contentStyle={styles.buttonContent} labelStyle={styles.buttonLabel}>
          Login
        </Button>
      </View>
        <Button onPress={() => navigation.navigate('Signup')} style={styles.signupButton}>
          Create an account
        </Button>
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
    width: 360,
    height: 360,
    borderRadius: 180,
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
    fontWeight: 'bold',
    color: '#fff',
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
    ...(Platform.OS === 'web' && {
      marginBottom: 10,
    }),
  },
  inputContent: {
    ...(Platform.OS === 'web' && {
      paddingVertical: 8,
      fontSize: 14,
    }),
  },
  errorText: {
    ...(Platform.OS === 'web' && {
      fontSize: 12,
    }),
  },
  button: {
    marginTop: 8,
    ...(Platform.OS === 'web' && {
      marginTop: 12,
    }),
  },
  buttonContent: {
    ...(Platform.OS === 'web' && {
      paddingVertical: 8,
    }),
  },
  buttonLabel: {
    ...(Platform.OS === 'web' && {
      fontSize: 14,
    }),
  },
  signupButton: {
    marginTop: 16,
  },
});


