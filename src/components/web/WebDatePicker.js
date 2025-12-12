import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { TextInput } from 'react-native-paper';
import { format, parse } from 'date-fns';

/**
 * Web-compatible date/time picker using HTML5 inputs
 * Matches the API of @react-native-community/datetimepicker for compatibility
 */
export default function WebDatePicker({
  value,
  mode = 'date',
  display = 'default',
  onChange,
  minimumDate,
  maximumDate,
  style,
  textColor = '#fff',
  themeVariant,
  onRef,
  ...props
}) {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');

  // Format date for HTML5 input
  const formatDateForInput = (date) => {
    if (!date || !(date instanceof Date)) return '';
    if (mode === 'date') {
      return format(date, 'yyyy-MM-dd');
    } else if (mode === 'time') {
      return format(date, 'HH:mm');
    } else if (mode === 'datetime') {
      return format(date, "yyyy-MM-dd'T'HH:mm");
    }
    return '';
  };

  // Parse date from HTML5 input
  const parseDateFromInput = (inputValue) => {
    if (!inputValue) return null;
    try {
      if (mode === 'date') {
        return parse(inputValue, 'yyyy-MM-dd', new Date());
      } else if (mode === 'time') {
        const [hours, minutes] = inputValue.split(':');
        const date = new Date();
        date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        return date;
      } else if (mode === 'datetime') {
        return parse(inputValue, "yyyy-MM-dd'T'HH:mm", new Date());
      }
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
    return null;
  };

  useEffect(() => {
    setInputValue(formatDateForInput(value || new Date()));
  }, [value, mode]);

  // Create and manage the HTML input element
  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    
    // Remove existing input if any
    if (inputRef.current && container.contains(inputRef.current)) {
      container.removeChild(inputRef.current);
    }

    // Create new input element
    const input = document.createElement('input');
    input.type = mode === 'date' ? 'date' : mode === 'time' ? 'time' : 'datetime-local';
    input.value = inputValue;
    if (minimumDate) input.min = formatDateForInput(minimumDate);
    if (maximumDate) input.max = formatDateForInput(maximumDate);
    
    // Style the input
    Object.assign(input.style, {
      width: '100%',
      padding: '12px',
      fontSize: '16px',
      borderRadius: '8px',
      border: '1px solid #2a2a3e',
      backgroundColor: '#1a1a2e',
      color: textColor,
      fontFamily: 'inherit',
      outline: 'none',
      boxSizing: 'border-box',
    });

    // Handle change
    input.addEventListener('change', (e) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      const newDate = parseDateFromInput(newValue);
      if (newDate && onChange) {
        const nativeEvent = {
          nativeEvent: {
            timestamp: newDate.getTime(),
          },
        };
        onChange(nativeEvent, newDate);
      }
    });

    container.appendChild(input);
    inputRef.current = input;
    
    // Expose input ref to parent component
    if (onRef) {
      onRef(input);
    }

    return () => {
      if (inputRef.current && container.contains(inputRef.current)) {
        container.removeChild(inputRef.current);
      }
    };
  }, [inputValue, mode, minimumDate, maximumDate, textColor, onChange, onRef]);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]} ref={containerRef} />
    );
  }

  // Fallback for non-web
  return (
    <TextInput
      value={inputValue}
      editable={false}
      style={[styles.fallback, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 56,
  },
  fallback: {
    width: '100%',
  },
});
