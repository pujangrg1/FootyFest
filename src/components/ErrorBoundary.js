import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';
import { logError } from '../utils/errorTracking';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error using error tracking utility
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error && this.state.error.toString()}
          </Text>
          {__DEV__ && this.state.errorInfo && (
            <ScrollView style={styles.scrollView}>
              <Text style={styles.stackTrace}>
                {this.state.errorInfo.componentStack}
              </Text>
            </ScrollView>
          )}
          <Button
            mode="contained"
            onPress={() => window.location.reload()}
            style={styles.button}
          >
            Reload App
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#ff6b6b',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: 300,
    backgroundColor: '#0f0f1e',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  stackTrace: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  button: {
    marginTop: 20,
  },
});

export default ErrorBoundary;

