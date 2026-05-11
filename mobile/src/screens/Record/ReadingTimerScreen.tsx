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
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { queueOfflineSession } from '../../services/syncService';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export default function ReadingTimerScreen({ route, navigation }: any) {
  const book_id = route.params?.book_id || '00000000-0000-0000-0000-000000000000';
  const book_title = route.params?.book_title || 'The Alchemist';
  const total_pages = route.params?.total_pages || 0;
  const initial_current_page = route.params?.current_page || 0;

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [pagesRead, setPagesRead] = useState('');
  const [notes, setNotes] = useState('');
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [quote, setQuote] = useState("Loading inspiration...");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    fetchQuote();
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchQuote = async () => {
    try {
      const response = await api.get('/quotes/');
      setQuote(response.data.quote);
    } catch (error) {
      console.error('Failed to fetch quote', error);
      setQuote("A reader lives a thousand lives before he dies."); // Fallback
    }
  };

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
    if (!startedAt) {
      setStartedAt(new Date());
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
  };

  const handleResume = () => {
    setIsRunning(true);
  };

  const handleFinish = () => {
    setIsRunning(false);
    setShowSummary(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    setShowSummary(true);
  };

  const handleSave = async () => {
    const pages = parseInt(pagesRead, 10) || 0;
    
    // Validation: user cant exceed no of pages more than total pages
    if (total_pages > 0 && (initial_current_page + pages) > total_pages) {
      Alert.alert(
        'Invalid Page Count',
        `You have already read ${initial_current_page} pages. Adding ${pages} more would exceed the total pages of the book (${total_pages}).`
      );
      return;
    }

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
      Alert.alert('Success', 'Reading session saved!');
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Home');
      }
    } catch (error) {
      await queueOfflineSession(sessionData);
      Alert.alert('Offline', 'Session saved locally and will sync later.');
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Home');
      }
    }
  };

  const calculatePace = () => {
    if (elapsedSeconds === 0) return 0;
    const pages = parseInt(pagesRead, 10) || 0;
    if (pages === 0) return 0;
    return Math.round(pages / (elapsedSeconds / 60));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => {
            if (isRunning) {
              Alert.alert(
                'End session?',
                'Going back will discard the current timer.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Discard', style: 'destructive', onPress: () => navigation.navigate('Home') }
                ]
              );
            } else {
              navigation.navigate('Home');
            }
          }}
        >
          <View style={styles.sessionStatus}>
            <View style={styles.dot} />
            <Text style={styles.sessionTypeText}>ACTIVE SESSION</Text>
            <MaterialIcons name="keyboard-arrow-down" size={24} color={theme.colors.onSurfaceVariant} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Timer Section */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
        <View style={styles.bookInfo}>
          <MaterialCommunityIcons name="book-open-variant" size={20} color={theme.colors.onSurfaceVariant} style={{ marginRight: 8 }} />
          <Text style={styles.bookLabel}>Reading • </Text>
          <Text style={styles.bookTitle}>{book_title}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard label="PAGES" value={pagesRead || "0"} />
        <StatCard label="PACE" value={calculatePace()} unit="PPM" />
        <StatCard label="GOAL" value="72%" hasIcon />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '72%' }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>SESSION START</Text>
          <Text style={styles.progressLabel}>72% OF DAILY GOAL REACHED</Text>
        </View>
      </View>

      {/* Quote Section */}
      <View style={styles.quoteSection}>
        <Text style={styles.quoteText}>
          "{quote}"
        </Text>
      </View>
      
      {/* Controls */}
      <View style={styles.controls}>
        {!startedAt ? (
          // Initial State: Big "START" Button
          <TouchableOpacity 
            style={styles.stravaButtonPrimary} 
            onPress={handleStartPause}
            activeOpacity={0.8}
          >
            <MaterialIcons name="play-arrow" size={32} color={theme.colors.onPrimary} />
            <Text style={styles.stravaButtonTextPrimary}>START</Text>
          </TouchableOpacity>
        ) : isRunning ? (
          // Running State: Big "PAUSE" Button
          <TouchableOpacity 
            style={styles.stravaButtonSecondary} 
            onPress={handleStartPause}
            activeOpacity={0.8}
          >
            <MaterialIcons name="pause" size={32} color={theme.colors.onSurface} />
            <Text style={styles.stravaButtonTextSecondary}>PAUSE</Text>
          </TouchableOpacity>
        ) : (
          // Paused State: "RESUME" and "FINISH" Buttons
          <View style={styles.pausedControls}>
            <TouchableOpacity 
              style={[styles.stravaButtonHalf, { backgroundColor: theme.colors.primary }]} 
              onPress={handleResume}
              activeOpacity={0.8}
            >
              <Text style={styles.stravaButtonTextPrimary}>RESUME</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.stravaButtonHalf, { backgroundColor: theme.colors.tertiary }]} 
              onPress={handleFinish}
              activeOpacity={0.8}
            >
              <Text style={styles.stravaButtonTextPrimary}>FINISH</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Summary Modal */}
      <Modal visible={showSummary} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Session Summary</Text>
              <TouchableOpacity onPress={() => setShowSummary(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
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
    </SafeAreaView>
  );
}

function StatCard({ label, value, unit, hasIcon }: any) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueContainer}>
        <Text style={styles.statValue}>{value}</Text>
        {unit && <Text style={styles.statUnit}>{unit}</Text>}
        {hasIcon && <MaterialIcons name="trending-up" size={16} color={theme.colors.primary} style={{ marginLeft: 4 }} />}
      </View>
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
    marginTop: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sessionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  sessionTypeText: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurface,
  },
  timerContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  timerText: {
    ...theme.typography.timerDisplay,
    color: theme.colors.onBackground,
  },
  bookInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  bookLabel: {
    ...theme.typography.bodyLg,
    color: theme.colors.onSurfaceVariant,
  },
  bookTitle: {
    ...theme.typography.bodyLg,
    color: theme.colors.onBackground,
    fontWeight: 'bold', // Keeping bold if it needs to stand out more than regular bodyLg, or I could use h3. Let's use h3.
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.outlineVariant,
    width: '100%',
    marginVertical: 16,
    opacity: 0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
  },
  statLabel: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
    marginBottom: 8,
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    ...theme.typography.h2,
    color: theme.colors.onBackground,
    fontWeight: 'bold',
  },
  statUnit: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
    marginLeft: 4,
  },
  progressSection: {
    marginTop: 24,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: theme.colors.surfaceContainerHighest,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  progressLabel: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    fontSize: 9,
  },
  quoteSection: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  quoteText: {
    ...theme.typography.bodyLg,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
    opacity: 0.8,
  },
  controls: { 
    paddingHorizontal: 20,
    marginTop: 24,
    paddingBottom: 40,
  },
  stravaButtonPrimary: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  stravaButtonSecondary: {
    backgroundColor: theme.colors.surfaceContainerHighest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  stravaButtonHalf: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  pausedControls: {
    flexDirection: 'row',
    gap: 16,
  },
  stravaButtonTextPrimary: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  stravaButtonTextSecondary: {
    ...theme.typography.button,
    color: theme.colors.onSurface,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
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
  },
  closeButton: {
    padding: 10,
  }
});
