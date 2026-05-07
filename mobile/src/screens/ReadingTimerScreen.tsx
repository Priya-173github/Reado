import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState, AppStateStatus, Modal, TextInput } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { queueOfflineSession } from '../services/syncService';
import api from '../services/api';

const BACKGROUND_TIMER_TASK = 'BACKGROUND_TIMER_TASK';

TaskManager.defineTask(BACKGROUND_TIMER_TASK, async () => {
  try {
    return true;
  } catch (error) {
    return false;
  }
});

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function ReadingTimerScreen({ route, navigation }: any) {
  const book_id = route.params?.book_id || '00000000-0000-0000-0000-000000000000';
  const book_title = route.params?.book_title || 'Example Book';

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [pagesRead, setPagesRead] = useState('');
  const [notes, setNotes] = useState('');
  const [startedAt, setStartedAt] = useState<Date | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      if (isRunning) {
        const bgStartStr = await AsyncStorage.getItem('bg_start_time');
        const bgElapsedStr = await AsyncStorage.getItem('bg_elapsed_seconds');
        if (bgStartStr && bgElapsedStr) {
          const bgStart = parseInt(bgStartStr, 10);
          const bgElapsed = parseInt(bgElapsedStr, 10);
          const now = Date.now();
          const diffSeconds = Math.floor((now - bgStart) / 1000);
          setElapsedSeconds(bgElapsed + diffSeconds);
        }
      }
    } else if (nextAppState === 'background') {
      if (isRunning) {
        await AsyncStorage.setItem('bg_start_time', Date.now().toString());
        await AsyncStorage.setItem('bg_elapsed_seconds', elapsedSeconds.toString());
      }
    }
    appState.current = nextAppState;
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!isRunning && timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleStartPause = () => {
    if (!isRunning && !startedAt) {
      setStartedAt(new Date());
    }
    setIsRunning(!isRunning);
  };

  const handleStop = () => {
    setIsRunning(false);
    setShowSummary(true);
  };

  const handleSave = async () => {
    const sessionData = {
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      book_id: book_id === '00000000-0000-0000-0000-000000000000' ? null : book_id,
      pages_read: parseInt(pagesRead, 10) || 0,
      duration_seconds: elapsedSeconds,
      notes,
      started_at: startedAt ? startedAt.toISOString() : new Date().toISOString(),
      ended_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    try {
      await api.post('/sessions/', sessionData);
      navigation.goBack();
    } catch (error) {
      await queueOfflineSession(sessionData);
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{book_title}</Text>
      <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
      
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={handleStartPause}>
          <Text style={styles.buttonText}>{isRunning ? 'Pause' : 'Start'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={handleStop}>
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showSummary} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Session Summary</Text>
            <Text style={styles.modalSubtitle}>Time: {formatTime(elapsedSeconds)}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Pages Read"
              keyboardType="number-pad"
              value={pagesRead}
              onChangeText={setPagesRead}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes (optional)"
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setShowSummary(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleSave}>
                <Text style={styles.buttonText}>Save Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 40 },
  timer: { fontSize: 72, fontWeight: '200', marginBottom: 60, fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', gap: 20 },
  button: { backgroundColor: '#4CAF50', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25 },
  stopButton: { backgroundColor: '#F44336' },
  cancelButton: { backgroundColor: '#9e9e9e' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '600' },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', padding: 30, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  modalSubtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 15, marginBottom: 15, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }
});
