import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/auth';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '../../../firebase/config';
import { showAlert } from '../../utils/alert';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const navigation = useNavigation();

  const checkEmailExists = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setCheckingEmail(true);
    setError('');
    
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email.trim());
      if (signInMethods && signInMethods.length > 0) {
        // Email exists
        setError('');
        return true;
      } else {
        // Email doesn't exist
        setError('No account found with this email address. Please check your email or create a new account.');
        return false;
      }
    } catch (error) {
      console.error('Error checking email:', error);
      setError('Unable to verify email. Please try again.');
      return false;
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!email.trim()) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      // First check if email exists (without setting checkingEmail state)
      let emailExists = false;
      try {
        const signInMethods = await fetchSignInMethodsForEmail(auth, email.trim());
        emailExists = signInMethods && signInMethods.length > 0;
      } catch (checkError) {
        console.error('Error checking email:', checkError);
        setError('Unable to verify email. Please try again.');
        setLoading(false);
        return;
      }

      if (!emailExists) {
        setError('No account found with this email address. Please check your email or create a new account.');
        setLoading(false);
        return;
      }

      // Send password reset email
      const result = await authService.resetPassword(email.trim());
      
      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else {
        setSuccess(true);
        setError('');
        setLoading(false);
        
        // Show success message
        showAlert(
          'Password Reset Email Sent',
          `We've sent a password reset link to ${email.trim()}. Please check your email and follow the instructions to reset your password.`,
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('Login');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setError(error.message || 'Failed to send password reset email. Please try again.');
      setLoading(false);
    }
  };

  const handleCheckUsername = async () => {
    if (!email.trim()) {
      setError('Please enter your email address to check if an account exists');
      return;
    }

    setCheckingEmail(true);
    setError('');
    setSuccess(false);

    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email.trim());
      if (signInMethods && signInMethods.length > 0) {
        // Email exists - show success message
        showAlert(
          'Account Found',
          `An account exists with the email: ${email.trim()}\n\nYou can now reset your password using the button below.`,
          [{ text: 'OK' }]
        );
        setSuccess(true);
      } else {
        // Email doesn't exist
        showAlert(
          'Account Not Found',
          `No account found with the email: ${email.trim()}\n\nPlease check your email address or create a new account.`,
          [
            { text: 'OK' },
            {
              text: 'Create Account',
              onPress: () => navigation.navigate('Signup'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error checking email:', error);
      showAlert('Error', 'Unable to verify email. Please try again.');
    } finally {
      setCheckingEmail(false);
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
          {/* Header with Back Button */}
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

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
            Reset Password
          </Text>
          
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              contentStyle={styles.inputContent}
              placeholder="Enter your email"
              disabled={loading || checkingEmail}
            />
            
            {error ? (
              <HelperText type="error" style={styles.errorText}>
                {error}
              </HelperText>
            ) : null}

            {success ? (
              <HelperText type="info" style={styles.successText}>
                Password reset email sent! Please check your inbox.
              </HelperText>
            ) : null}

            {/* Check Username Button */}
            <Button
              mode="outlined"
              onPress={handleCheckUsername}
              loading={checkingEmail}
              disabled={loading || checkingEmail || !email.trim()}
              style={styles.checkButton}
              textColor="#6C63FF"
              icon="search"
            >
              Check if Account Exists
            </Button>

            {/* Reset Password Button */}
            <Button
              mode="contained"
              onPress={handleResetPassword}
              loading={loading}
              disabled={loading || checkingEmail || !email.trim()}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Send Reset Link
            </Button>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Remember your password?</Text>
            <Button
              onPress={() => navigation.navigate('Login')}
              style={styles.loginLink}
              textColor="#4CAF50"
            >
              Sign In
            </Button>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Button
              onPress={() => navigation.navigate('Signup')}
              style={styles.signupLink}
              textColor="#4CAF50"
            >
              Create Account
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
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 60,
    paddingVertical: 10,
  },
  logoCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
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
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#ccc',
    fontSize: 14,
    paddingHorizontal: 20,
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
    marginBottom: 12,
    ...(Platform.OS === 'web' && {
      fontSize: 12,
    }),
  },
  successText: {
    marginBottom: 12,
    color: '#4CAF50',
    ...(Platform.OS === 'web' && {
      fontSize: 12,
    }),
  },
  checkButton: {
    marginTop: 8,
    marginBottom: 12,
    borderColor: '#6C63FF',
    ...(Platform.OS === 'web' && {
      marginTop: 12,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 4,
  },
  footerText: {
    color: '#ccc',
    fontSize: 14,
  },
  loginLink: {
    marginLeft: 4,
  },
  signupLink: {
    marginLeft: 4,
  },
});

