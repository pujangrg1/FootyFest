import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek, isBefore, isAfter } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

export default function CalendarPicker({ value, onChange, onClose, minimumDate, maximumDate }) {
  // Normalize dates to midnight for comparison - parse as local date, not UTC
  const normalizeDate = (date) => {
    if (!date) return null;
    let d;
    
    // First, try to convert to ISO string to check if it's an ISO date string
    let isoString = null;
    if (typeof date === 'string') {
      isoString = date;
    } else if (date instanceof Date) {
      // Convert Date to ISO string to extract the date part
      isoString = date.toISOString();
      } else {
        // Try to convert to string first
        const tempDate = new Date(date);
        if (!isNaN(tempDate.getTime())) {
          isoString = tempDate.toISOString();
        } else {
          const today = new Date();
          return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
        }
      }
    
    // Extract just the date part (YYYY-MM-DD) from ISO string and create a local date
    if (isoString) {
      const dateMatch = isoString.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        // Fallback: try to parse normally but then normalize
        const parsed = new Date(isoString);
        if (!isNaN(parsed.getTime())) {
          // Extract date parts from UTC representation to avoid timezone issues
          const utcYear = parsed.getUTCFullYear();
          const utcMonth = parsed.getUTCMonth();
          const utcDay = parsed.getUTCDate();
          d = new Date(utcYear, utcMonth, utcDay);
        } else {
          d = new Date();
        }
      }
    } else {
      d = new Date();
    }
    
    // Ensure the date is at local midnight without timezone conversion
    if (d && !isNaN(d.getTime())) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    }
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  };

  const initialDate = normalizeDate(value) || (() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  })();
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  // Sync with value prop when it changes
  useEffect(() => {
    const normalizedValue = normalizeDate(value);
    if (normalizedValue) {
      setSelectedDate(normalizedValue);
      setCurrentMonth(normalizedValue);
    }
  }, [value]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDateSelect = (date) => {
    // Update selected date but don't save yet - wait for Done button
    // Normalize to local midnight without timezone conversion
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    setSelectedDate(normalizedDate);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const isDateDisabled = (date) => {
    // Normalize dates to local midnight for comparison
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const normalizedMin = minimumDate ? (() => {
      const d = minimumDate instanceof Date ? minimumDate : new Date(minimumDate);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    })() : null;
    const normalizedMax = maximumDate ? (() => {
      const d = maximumDate instanceof Date ? maximumDate : new Date(maximumDate);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    })() : null;
    
    if (normalizedMin && isBefore(normalizedDate, normalizedMin)) return true;
    if (normalizedMax && isAfter(normalizedDate, normalizedMax)) return true;
    return false;
  };

  const isDateSelected = (date) => {
    return selectedDate && isSameDay(date, selectedDate);
  };

  const isCurrentMonth = (date) => {
    return isSameMonth(date, currentMonth);
  };

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.monthYear}>
          {format(currentMonth, 'MMMM yyyy')}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDaysRow}>
        {weekDays.map((day) => (
          <View key={day} style={styles.weekDay}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {days.slice(weekIndex * 7, weekIndex * 7 + 7).map((day, dayIndex) => {
              const disabled = isDateDisabled(day);
              const selected = isDateSelected(day);
              const inCurrentMonth = isCurrentMonth(day);
              const globalIndex = weekIndex * 7 + dayIndex;
              
              return (
                <TouchableOpacity
                  key={`day-${globalIndex}-${format(day, 'yyyy-MM-dd')}`}
                  style={[
                    styles.dayCell,
                    !inCurrentMonth && styles.dayCellOtherMonth,
                    selected && styles.dayCellSelected,
                    disabled && styles.dayCellDisabled,
                  ]}
                  onPress={() => !disabled && handleDateSelect(day)}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !inCurrentMonth && styles.dayTextOtherMonth,
                      selected && styles.dayTextSelected,
                      disabled && styles.dayTextDisabled,
                    ]}
                  >
                    {format(day, 'd')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            // When Done is clicked, use the selected date (normalize to local midnight)
            if (onChange && selectedDate) {
              const normalizedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0);
              onChange(null, normalizedDate);
            }
            if (onClose) onClose();
          }}
          style={styles.doneButton}
        >
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
    minWidth: 280,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#0f0f1e',
  },
  monthYear: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    width: '100%',
  },
  weekRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 1,
    maxWidth: '14.28%',
  },
  dayCellOtherMonth: {
    opacity: 0.3,
  },
  dayCellSelected: {
    backgroundColor: '#4CAF50',
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    color: '#fff',
    fontSize: 14,
  },
  dayTextOtherMonth: {
    color: '#888',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dayTextDisabled: {
    color: '#555',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
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

