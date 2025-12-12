import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, Platform } from 'react-native';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

export default function TimePicker({ value, onChange, onClose }) {
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [isAM, setIsAM] = useState(true);

  useEffect(() => {
    if (value) {
      const date = value instanceof Date ? value : new Date(value);
      let hours = date.getHours();
      const minutes = date.getMinutes();
      
      setIsAM(hours < 12);
      if (hours === 0) {
        hours = 12;
      } else if (hours > 12) {
        hours = hours - 12;
      }
      setSelectedHour(hours);
      setSelectedMinute(minutes);
    }
  }, [value]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleSave = () => {
    let hours24 = selectedHour;
    if (!isAM && selectedHour !== 12) {
      hours24 = selectedHour + 12;
    } else if (isAM && selectedHour === 12) {
      hours24 = 0;
    }

    const baseDate = value ? (value instanceof Date ? new Date(value) : new Date(value)) : new Date();
    const newDate = new Date(baseDate);
    newDate.setHours(hours24, selectedMinute, 0, 0);

    if (onChange) {
      onChange(null, newDate);
    }
    if (onClose) {
      onClose();
    }
  };

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.timeSelector}>
        <View style={styles.column}>
          <Text style={styles.columnLabel}>Hour</Text>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {hours.map((hour) => (
              <TouchableOpacity
                key={hour}
                style={[
                  styles.timeOption,
                  selectedHour === hour && styles.timeOptionSelected,
                ]}
                onPress={() => setSelectedHour(hour)}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    selectedHour === hour && styles.timeOptionTextSelected,
                  ]}
                >
                  {hour.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.column}>
          <Text style={styles.columnLabel}>Minute</Text>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {minutes.map((minute) => (
              <TouchableOpacity
                key={minute}
                style={[
                  styles.timeOption,
                  selectedMinute === minute && styles.timeOptionSelected,
                ]}
                onPress={() => setSelectedMinute(minute)}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    selectedMinute === minute && styles.timeOptionTextSelected,
                  ]}
                >
                  {minute.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.column}>
          <Text style={styles.columnLabel}>Period</Text>
          <View style={styles.periodContainer}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                isAM && styles.periodButtonSelected,
              ]}
              onPress={() => setIsAM(true)}
            >
              <Text
                style={[
                  styles.periodText,
                  isAM && styles.periodTextSelected,
                ]}
              >
                AM
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                !isAM && styles.periodButtonSelected,
              ]}
              onPress={() => setIsAM(false)}
            >
              <Text
                style={[
                  styles.periodText,
                  !isAM && styles.periodTextSelected,
                ]}
              >
                PM
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.preview}>
        <Text style={styles.previewText}>
          {(() => {
            let hours24 = selectedHour;
            if (!isAM && selectedHour !== 12) {
              hours24 = selectedHour + 12;
            } else if (isAM && selectedHour === 12) {
              hours24 = 0;
            }
            const previewDate = new Date();
            previewDate.setHours(hours24, selectedMinute, 0, 0);
            return format(previewDate, 'h:mm a');
          })()}
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={styles.doneButton}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 400,
  },
  timeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  columnLabel: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  scrollView: {
    maxHeight: 200,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
  },
  timeOption: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
    alignItems: 'center',
    backgroundColor: '#0f0f1e',
  },
  timeOptionSelected: {
    backgroundColor: '#4CAF50',
  },
  timeOptionText: {
    color: '#fff',
    fontSize: 16,
  },
  timeOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  periodContainer: {
    gap: 8,
    width: '100%',
  },
  periodButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#0f0f1e',
    alignItems: 'center',
  },
  periodButtonSelected: {
    backgroundColor: '#4CAF50',
  },
  periodText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  periodTextSelected: {
    color: '#fff',
  },
  preview: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  previewText: {
    color: '#4CAF50',
    fontSize: 24,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 14,
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});


