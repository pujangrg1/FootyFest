/**
 * Error Tracking Utility
 * 
 * This utility provides error tracking capabilities for production.
 * Currently uses console.error as fallback, but can be extended to integrate
 * with services like Sentry, LogRocket, or Firebase Crashlytics.
 */

import { Platform } from 'react-native';

// Error tracking service configuration
const ERROR_TRACKING_ENABLED = process.env.NODE_ENV === 'production';
const ERROR_TRACKING_SERVICE = process.env.REACT_APP_ERROR_TRACKING_SERVICE || 'console'; // 'sentry', 'logrocket', 'firebase', 'console'

/**
 * Initialize error tracking service
 * Call this once in App.js or index.js
 */
export const initErrorTracking = () => {
  if (!ERROR_TRACKING_ENABLED) {
    return;
  }

  // Initialize error tracking service based on configuration
  switch (ERROR_TRACKING_SERVICE) {
    case 'sentry':
      // TODO: Initialize Sentry
      // import * as Sentry from '@sentry/react-native';
      // Sentry.init({ dsn: process.env.REACT_APP_SENTRY_DSN });
      break;
    case 'logrocket':
      // TODO: Initialize LogRocket
      // import LogRocket from 'logrocket';
      // LogRocket.init(process.env.REACT_APP_LOGROCKET_APP_ID);
      break;
    case 'firebase':
      // TODO: Initialize Firebase Crashlytics
      // import crashlytics from '@react-native-firebase/crashlytics';
      break;
    default:
      // Use console for development/fallback
      if (process.env.NODE_ENV !== 'production') {
        console.log('Error tracking initialized (console mode)');
      }
  }
};

/**
 * Log an error to the tracking service
 * @param {Error} error - The error object
 * @param {Object} context - Additional context about the error
 */
export const logError = (error, context = {}) => {
  const errorInfo = {
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (ERROR_TRACKING_ENABLED) {
    switch (ERROR_TRACKING_SERVICE) {
      case 'sentry':
        // TODO: Sentry.captureException(error, { extra: context });
        console.error('Error (Sentry):', errorInfo);
        break;
      case 'logrocket':
        // TODO: LogRocket.captureException(error, { extra: context });
        console.error('Error (LogRocket):', errorInfo);
        break;
      case 'firebase':
        // TODO: crashlytics().recordError(error);
        console.error('Error (Firebase):', errorInfo);
        break;
      default:
        console.error('Error:', errorInfo);
    }
  } else {
    // In development, always log to console
    console.error('Error:', errorInfo);
  }
};

/**
 * Log a message/info to the tracking service
 * @param {string} message - The message to log
 * @param {Object} data - Additional data
 */
export const logInfo = (message, data = {}) => {
  if (ERROR_TRACKING_ENABLED && ERROR_TRACKING_SERVICE !== 'console') {
    switch (ERROR_TRACKING_SERVICE) {
      case 'sentry':
        // TODO: Sentry.captureMessage(message, { level: 'info', extra: data });
        break;
      case 'logrocket':
        // TODO: LogRocket.info(message, data);
        break;
      default:
        if (process.env.NODE_ENV !== 'production') {
          console.log(message, data);
        }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    console.log(message, data);
  }
};

/**
 * Set user context for error tracking
 * @param {Object} user - User information
 */
export const setUserContext = (user) => {
  if (!ERROR_TRACKING_ENABLED) return;

  switch (ERROR_TRACKING_SERVICE) {
    case 'sentry':
      // TODO: Sentry.setUser({ id: user.uid, email: user.email });
      break;
    case 'logrocket':
      // TODO: LogRocket.identify(user.uid, { email: user.email });
      break;
    default:
      // No-op for console mode
      break;
  }
};

/**
 * Clear user context (e.g., on logout)
 */
export const clearUserContext = () => {
  if (!ERROR_TRACKING_ENABLED) return;

  switch (ERROR_TRACKING_SERVICE) {
    case 'sentry':
      // TODO: Sentry.setUser(null);
      break;
    case 'logrocket':
      // TODO: LogRocket.identify(null);
      break;
    default:
      // No-op for console mode
      break;
  }
};


