import React from 'react';
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import WebDatePicker from './WebDatePicker';

/**
 * Platform-aware DateTimePicker wrapper
 * Uses native DateTimePicker on mobile, HTML5 inputs on web
 */
export default function WebDateTimePicker(props) {
  if (Platform.OS === 'web') {
    return <WebDatePicker {...props} />;
  }
  return <DateTimePicker {...props} />;
}


