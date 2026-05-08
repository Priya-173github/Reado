import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  AppState, 
  AppStateStatus, 
  Modal, 
  TextInput,
  StatusBar,
  Dimensions
} from 'react-native';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { queueOfflineSession } from '../services/syncService';
import api from '../services/api';

const { width } = Dimensions.get('window');
const BACKGROUND_TIMER_TASK = 'BACKGROUND_TIMER_TASK';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
};

export default function ReadingTimerScreen({ route, navigation }: any) {
  const book_id = route.params?.book_id || '00000000-0000-0000-0000-000000000000';
  const book_title = route.params?.book_title || 'Current Session';

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
      id: generateUUID(),
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
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.sessionType}>READING SESSION</Text>
        <Text style={styles.bookTitle} numberOfLines={2}>{book_title}</Text>
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
        <Text style={styles.timerLabel}>ELAPSED TIME</Text>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.controlButton, styles.stopButton]} 
          onPress={handleStop}
          activeOpacity={0.7}
        >
          <MaterialIcons name="stop" size={32} color={theme.colors.onSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, styles.playButton]} 
          onPress={handleStartPause}
          activeOpacity={0.7}
        >
          <MaterialIcons 
            name={isRunning ? "pause" : "play-arrow"} 
            size={48} 
            color={theme.colors.onPrimary} 
          />
        </TouchableOpacity>

        <View style={styles.controlButtonPlaceholder} />
      </View>

      <Modal visible={showSummary} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Session complete!</Text>
              <TouchableOpacity onPress={() => setShowSummary(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>TOTAL TIME</Text>
                <Text style={styles.summaryStatValue}>{formatTime(elapsedSeconds)}</Text>
              </View>
            </View>
            
            <View style={styles.field}>
              <Text style={styles.label}>PAGES READ</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={theme.colors.outline}
                keyboardType="number-pad"
                value={pagesRead}
                onChangeText={setPagesRead}
                autoFocus
              />
            </View>
            
            <View style={styles.field}>
              <Text style={styles.label}>NOTES (OPTIONAL)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What did you think?"
                placeholderTextColor={theme.colors.outline}
                multiline
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>SAVE SESSION</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.container_margin,
  },
  header: {
    marginTop: 60,
    alignItems: 'center',
  },
  sessionType: {
    ...theme.typography.labelCaps,
    color: theme.colors.primary,
    marginBottom: 8,
  },
  bookTitle: {
    ...theme.typography.h2,
    color: theme.colors.onBackground,
    textAlign: 'center',
    fontWeight: '900',
  },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    ...theme.typography.statsDisplay,
    fontSize: 80,
    color: theme.colors.onBackground,
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
  timerLabel: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    marginTop: 10,
  },
  controls: { 
    flexDirection: 'row', 
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
    gap: 30,
  },
  controlButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  controlButtonPlaceholder: {
    width: 72,
  },
  playButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.primary,
  },
  stopButton: {
    backgroundColor: theme.colors.surfaceContainerHighest,
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'flex-end', 
    backgroundColor: 'rgba(0,0,0,0.7)' 
  },
  modalContent: { 
    backgroundColor: theme.colors.surfaceContainerLow, 
    padding: theme.spacing.lg, 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: theme.colors.outlineVariant,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: { 
    ...theme.typography.h2,
    color: theme.colors.onSurface,
    fontWeight: '900',
  },
  summaryStats: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatLabel: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  summaryStatValue: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    fontSize: 24,
  },
  field: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  input: { 
    backgroundColor: theme.colors.surfaceContainer,
    borderWidth: 1, 
    borderColor: theme.colors.outlineVariant, 
    borderRadius: theme.borderRadius.lg, 
    padding: theme.spacing.md, 
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  textArea: { 
    height: 100, 
    textAlignVertical: 'top' 
  },
  saveBtn: { 
    backgroundColor: theme.colors.primary, 
    paddingVertical: 18, 
    borderRadius: theme.borderRadius.xl, 
    alignItems: 'center', 
    marginTop: theme.spacing.md,
  },
  saveBtnText: { 
    ...theme.typography.labelCaps,
    color: theme.colors.onPrimary, 
    fontSize: 16,
    fontWeight: '900',
  }
});
