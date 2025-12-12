import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * MatchTimer component displays and manages live match timer
 * @param {Object} match - Match object with timer data
 * @param {number} matchDuration - Match duration in minutes (from tournament)
 * @param {boolean} isOrganizer - Whether current user is organizer (can control timer)
 * @param {Function} onPause - Callback when timer is paused (organizer only)
 * @param {Function} onResume - Callback when timer is resumed (organizer only)
 */
export default function MatchTimer({ match, matchDuration = 40, isOrganizer = false, onPause, onResume }) {
  const [displayTime, setDisplayTime] = useState('00:00');
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const matchRef = useRef(match);

  // Update ref when match changes
  useEffect(() => {
    matchRef.current = match;
  }, [match]);

  // Calculate elapsed time from match timer data
  useEffect(() => {
    if (!match || match.status !== 'live') {
      setDisplayTime('00:00');
      setElapsedSeconds(0);
      setIsPaused(false);
      return;
    }

    const timerData = match.timer || {};
    const startTime = timerData.startTime ? new Date(timerData.startTime) : null;
    const savedElapsed = timerData.elapsedSeconds || 0;
    const isPausedState = timerData.isPaused || false;

    setIsPaused(isPausedState);

    if (!startTime) {
      setDisplayTime('00:00');
      setElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      // Get latest match data from ref
      const currentMatch = matchRef.current;
      if (!currentMatch || currentMatch.status !== 'live') {
        return;
      }

      const currentTimerData = currentMatch.timer || {};
      const currentStartTime = currentTimerData.startTime ? new Date(currentTimerData.startTime) : null;
      const currentSavedElapsed = currentTimerData.elapsedSeconds || 0;
      const currentIsPaused = currentTimerData.isPaused || false;

      setIsPaused(currentIsPaused);

      if (!currentStartTime) {
        setDisplayTime('00:00');
        setElapsedSeconds(0);
        return;
      }

      let currentElapsed = currentSavedElapsed;

      if (!currentIsPaused && currentStartTime) {
        // Timer is running - calculate elapsed from start time
        const now = new Date();
        const start = new Date(currentStartTime);
        const elapsedSinceStart = Math.floor((now - start) / 1000);
        // Add elapsed time since start to saved elapsed
        currentElapsed = currentSavedElapsed + elapsedSinceStart;
      } else {
        // Timer is paused - use saved elapsed time
        currentElapsed = currentSavedElapsed;
      }

      setElapsedSeconds(currentElapsed);

      // Format elapsed time (counting up from 0)
      const minutes = Math.floor(currentElapsed / 60);
      const seconds = currentElapsed % 60;
      const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      setDisplayTime(formattedTime);
    };

    // Update immediately
    updateTimer();
    
    // Then update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [
    match?.id, 
    match?.status, 
    match?.timer?.startTime, 
    match?.timer?.elapsedSeconds, 
    match?.timer?.isPaused
  ]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handlePause = () => {
    if (isOrganizer && onPause) {
      onPause();
    }
  };

  const handleResume = () => {
    if (isOrganizer && onResume) {
      onResume();
    }
  };

  if (match?.status !== 'live') {
    return null;
  }

  // Format elapsed time (counting up from 0)
  const formatElapsedTime = () => {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.timerDisplay}>
        <Ionicons name="time-outline" size={20} color="#4CAF50" />
        <Text style={styles.timerText}>
          {formatElapsedTime()}
        </Text>
        {isPaused && (
          <View style={styles.pausedBadge}>
            <Text style={styles.pausedText}>HALF TIME</Text>
          </View>
        )}
      </View>
      
      {isOrganizer && (
        <View style={styles.controls}>
          {isPaused ? (
            <TouchableOpacity onPress={handleResume} style={styles.controlButton}>
              <Ionicons name="play" size={16} color="#fff" />
              <Text style={styles.controlText}>Resume After Half Time</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handlePause} style={styles.controlButton}>
              <Ionicons name="pause" size={16} color="#fff" />
              <Text style={styles.controlText}>Half Time</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#0f0f1e',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  timerText: {
    color: '#4CAF50',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace',
  },
  pausedBadge: {
    backgroundColor: '#ffa500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pausedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  controls: {
    marginTop: 8,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  controlText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

