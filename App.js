import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Provider as ReduxProvider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { store } from './src/store';
import ErrorBoundary from './src/components/ErrorBoundary';
import { initErrorTracking, logError } from './src/utils/errorTracking';

// Initialize error tracking
initErrorTracking();

// Web-specific setup
if (Platform.OS === 'web') {
  // Ensure document is ready
  if (typeof document !== 'undefined') {
    // Add any web-specific initialization here
    if (process.env.NODE_ENV !== 'production') {
      console.log('Web platform detected');
    }
    
    // Global error handler for uncaught errors
    window.addEventListener('error', (event) => {
      logError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });
    
    // Global error handler for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      logError(event.reason, {
        type: 'unhandledrejection',
      });
    });
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <View style={styles.appContainer}>
        <ReduxProvider store={store}>
          <PaperProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <RootNavigator />
            </NavigationContainer>
          </PaperProvider>
        </ReduxProvider>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});


