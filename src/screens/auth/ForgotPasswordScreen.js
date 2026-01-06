import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/auth';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth, db } from '../../../firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
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
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }

    setCheckingEmail(true);
    setError('');
    
    try {
      // Check if auth is properly initialized
      if (!auth || !auth.app) {
        console.error('Firebase Auth not initialized');
        setError('Authentication service is not available. Please try again later.');
        return false;
      }

      const normalizedEmail = email.trim().toLowerCase();
      console.log('Checking email existence for:', normalizedEmail);
      
      const signInMethods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
      console.log('Sign-in methods returned:', signInMethods);
      
      if (signInMethods && Array.isArray(signInMethods) && signInMethods.length > 0) {
        // Email exists
        console.log('Account found with sign-in methods:', signInMethods);
        setError('');
        return true;
      } else {
        // Email doesn't exist
        console.log('No account found for email:', normalizedEmail);
        setError('No account found with this email address. Please check your email or create a new account.');
        return false;
      }
    } catch (error) {
      console.error('Error checking email:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.');
      } else {
        setError(`Unable to verify email: ${error.message || 'Please try again.'}`);
      }
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
      // Check if auth is properly initialized
      if (!auth || !auth.app) {
        console.error('Firebase Auth not initialized');
        setError('Authentication service is not available. Please try again later.');
        setLoading(false);
        return;
      }

      // Check if email exists (check both Auth and Firestore)
      const normalizedEmail = email.trim().toLowerCase();
      console.log('Checking email existence for password reset:', normalizedEmail);
      
      let emailExists = false;
      
      // First, try Firebase Auth check
      try {
        const signInMethods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
        console.log('Sign-in methods returned for password reset:', signInMethods);
        
        if (signInMethods && Array.isArray(signInMethods) && signInMethods.length > 0) {
          emailExists = true;
          console.log('Email exists in Firebase Auth');
        } else {
          console.log('Firebase Auth returned empty array, checking Firestore...');
        }
      } catch (checkError) {
        console.warn('Firebase Auth check failed, trying Firestore:', checkError);
        console.warn('Auth error code:', checkError.code);
      }
      
      // Always check Firestore as fallback (especially if Auth returned empty array)
      if (!emailExists && db) {
        try {
          console.log('Checking Firestore for email:', normalizedEmail);
          const usersRef = collection(db, 'users');
          
          // Try exact match first
          let q = query(
            usersRef,
            where('email', '==', normalizedEmail),
            limit(1)
          );
          let querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            console.log('Email found in Firestore (exact match)');
            emailExists = true;
          } else {
            // Try case-insensitive search
            console.log('Trying case-insensitive search in Firestore...');
            const allUsersSnapshot = await getDocs(usersRef);
            const matchingUser = allUsersSnapshot.docs.find(doc => {
              const userEmail = doc.data().email;
              return userEmail && userEmail.toLowerCase() === normalizedEmail;
            });
            
            if (matchingUser) {
              console.log('Email found in Firestore (case-insensitive match)');
              emailExists = true;
            }
          }
        } catch (firestoreError) {
          console.error('Firestore check failed:', firestoreError);
        }
      }
      
      console.log('Final email exists result:', emailExists);
      
      if (!emailExists) {
        setError('No account found with this email address. Please check your email or create a new account.');
        setLoading(false);
        return;
      }

      // Send password reset email
      // IMPORTANT: Use original email (not normalized) for password reset
      // Firebase Auth stores emails in their original case and may require exact match
      const emailForReset = email.trim(); // Use original case, just trim whitespace
      
      console.log('=== Starting Password Reset Process ===');
      console.log('Normalized email (for checking):', normalizedEmail);
      console.log('Original email input:', email);
      console.log('Email for reset (original case, trimmed):', emailForReset);
      console.log('Email validation passed');
      console.log('About to call authService.resetPassword...');
      
      try {
        // Try with original email first (Firebase Auth may require exact case match)
        console.log('Attempting reset with original email case:', emailForReset);
        const result = await authService.resetPassword(emailForReset);
        console.log('=== Password Reset Result ===');
        console.log('Result object:', result);
        console.log('Result.error:', result.error);
        console.log('Has error:', !!result.error);
        console.log('Result type:', typeof result);
        
        if (result && result.error) {
          console.error('❌ Password reset error:', result.error);
          setError(result.error);
          setLoading(false);
          
          // Show error alert
          showAlert('Error', result.error);
        } else {
          console.log('✅ Password reset email sent successfully - no errors returned');
          console.log('Setting success state...');
          setSuccess(true);
          setError('');
          setLoading(false);
          
          // Show success message with more details
          showAlert(
            'Password Reset Email Sent',
            `We've sent a password reset link to ${normalizedEmail}.\n\nPlease check your inbox (and spam folder) and follow the instructions to reset your password.\n\nThe link will expire in 1 hour.`,
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
      } catch (outerError) {
        console.error('❌ Outer catch block - unexpected error:', outerError);
        console.error('Error type:', typeof outerError);
        console.error('Error message:', outerError.message);
        setError(outerError.message || 'An unexpected error occurred');
        setLoading(false);
        showAlert('Error', outerError.message || 'An unexpected error occurred');
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setCheckingEmail(true);
    setError('');
    setSuccess(false);

    try {
      // Check if auth is properly initialized
      if (!auth || !auth.app) {
        console.error('Firebase Auth not initialized');
        showAlert('Error', 'Authentication service is not available. Please try again later.');
        setCheckingEmail(false);
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      console.log('Checking email existence for:', normalizedEmail);
      console.log('Original email input:', email);
      
      let accountFound = false;
      let signInMethods = null;
      let firestoreCheckResult = false;
      
      // First, try Firebase Auth check
      try {
        signInMethods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
        console.log('Sign-in methods returned:', signInMethods);
        console.log('Sign-in methods type:', typeof signInMethods);
        console.log('Sign-in methods is array:', Array.isArray(signInMethods));
        console.log('Sign-in methods length:', signInMethods?.length);
        
        if (signInMethods && Array.isArray(signInMethods) && signInMethods.length > 0) {
          accountFound = true;
          console.log('Account found via Firebase Auth');
        } else {
          console.log('Firebase Auth returned empty array or null, trying Firestore fallback...');
        }
      } catch (authError) {
        console.warn('Firebase Auth check failed with error, trying Firestore fallback:', authError);
        console.warn('Auth error code:', authError.code);
        console.warn('Auth error message:', authError.message);
      }
      
      // Always check Firestore as fallback (especially if Auth returned empty array)
      if (!accountFound && db) {
        try {
          console.log('Checking Firestore for email:', normalizedEmail);
          const usersRef = collection(db, 'users');
          
          // Try exact match first
          let q = query(
            usersRef,
            where('email', '==', normalizedEmail),
            limit(1)
          );
          let querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            console.log('Account found in Firestore (exact match)');
            const userData = querySnapshot.docs[0].data();
            console.log('User data:', { email: userData.email, uid: userData.uid });
            accountFound = true;
            firestoreCheckResult = true;
          } else {
            // Try case-insensitive search by fetching all and filtering
            console.log('Exact match not found, trying case-insensitive search...');
            const allUsersSnapshot = await getDocs(usersRef);
            const matchingUser = allUsersSnapshot.docs.find(doc => {
              const userEmail = doc.data().email;
              return userEmail && userEmail.toLowerCase() === normalizedEmail;
            });
            
            if (matchingUser) {
              console.log('Account found in Firestore (case-insensitive match)');
              const userData = matchingUser.data();
              console.log('User data:', { email: userData.email, uid: userData.uid });
              accountFound = true;
              firestoreCheckResult = true;
            } else {
              console.log('No account found in Firestore either');
            }
          }
        } catch (firestoreError) {
          console.error('Firestore check failed:', firestoreError);
          console.error('Firestore error code:', firestoreError.code);
          console.error('Firestore error message:', firestoreError.message);
        }
      }
      
      console.log('Final result - accountFound:', accountFound);
      console.log('Final result - firestoreCheckResult:', firestoreCheckResult);
      
      if (accountFound) {
        // Email exists - show success message
        console.log('Account found with sign-in methods:', signInMethods);
        showAlert(
          'Account Found',
          `An account exists with the email: ${normalizedEmail}\n\nYou can now reset your password using the button below.`,
          [{ text: 'OK' }]
        );
        setSuccess(true);
      } else {
        // Email doesn't exist
        console.log('No account found for email:', normalizedEmail);
        showAlert(
          'Account Not Found',
          `No account found with the email: ${normalizedEmail}\n\nPlease check your email address or create a new account.`,
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
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address');
        showAlert('Invalid Email', 'Please enter a valid email address.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.');
        showAlert('Too Many Requests', 'Too many requests. Please try again later.');
      } else {
        setError('Unable to verify email. Please try again.');
        showAlert('Error', `Unable to verify email: ${error.message || 'Please try again.'}`);
      }
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

