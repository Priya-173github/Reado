import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Platform,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import api from '../services/api';

export default function ManualLogScreen() {
  const navigation = useNavigation<any>();
  
  const [bookTitle, setBookTitle] = useState('');
  const [pagesRead, setPagesRead] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date(new Date().getTime() - 30 * 60 * 1000));
  const [endTime, setEndTime] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setStartTime(selectedTime);
    }
  };

  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setEndTime(selectedTime);
    }
  };

  const handleSave = async () => {
    if (!bookTitle || !pagesRead) {
      Alert.alert('Missing Fields', 'Please fill in Book Title and Pages Read.');
      return;
    }

    const startedAt = new Date(date);
    startedAt.setHours(startTime.getHours());
    startedAt.setMinutes(startTime.getMinutes());

    const endedAt = new Date(date);
    endedAt.setHours(endTime.getHours());
    endedAt.setMinutes(endTime.getMinutes());

    if (endedAt <= startedAt) {
      Alert.alert('Invalid Times', 'End time must be after start time.');
      return;
    }

    const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

    setLoading(true);
    const sessionData = {
      id: generateUUID(),
      book_id: null,
      book_title: bookTitle,
      pages_read: parseInt(pagesRead, 10),
      duration_seconds: durationSeconds,
      notes,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      created_at: new Date().toISOString()
    };

    try {
      await api.post('/sessions/sync', { sessions: [sessionData] });
      Alert.alert('Success', 'Activity saved successfully!');
      navigation.goBack();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Failed to save activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.header}>Log activity</Text>
      
      <View style={styles.field}>
        <Text style={styles.label}>BOOK NAME</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. The Psychology of Money" 
          placeholderTextColor={theme.colors.outline}
          value={bookTitle} 
          onChangeText={setBookTitle}
        />
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
        />
      </View>

      <View style={styles.sectionRow}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>DATE</Text>
          <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
            <MaterialIcons name="calendar-today" size={20} color={theme.colors.primary} />
            <Text style={styles.pickerText}>{formatDate(date)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1, marginRight: theme.spacing.md }]}>
          <Text style={styles.label}>START TIME</Text>
          <TouchableOpacity style={styles.pickerButton} onPress={() => setShowStartTimePicker(true)}>
            <MaterialIcons name="access-time" size={20} color={theme.colors.primary} />
            <Text style={styles.pickerText}>{formatTime(startTime)}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>END TIME</Text>
          <TouchableOpacity style={styles.pickerButton} onPress={() => setShowEndTimePicker(true)}>
            <MaterialIcons name="access-time" size={20} color={theme.colors.primary} />
            <Text style={styles.pickerText}>{formatTime(endTime)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>NOTES (OPTIONAL)</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="How was the session?" 
          placeholderTextColor={theme.colors.outline}
          multiline 
          numberOfLines={4} 
          value={notes} 
          onChangeText={setNotes}
        />
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={onStartTimeChange}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={onEndTimeChange}
        />
      )}

      <TouchableOpacity 
        style={[styles.saveBtn, loading && styles.disabledBtn]} 
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveBtnText}>{loading ? 'SAVING...' : 'SAVE SESSION'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  content: { 
    padding: theme.spacing.container_margin,
    paddingTop: theme.spacing.xl,
    paddingBottom: 40
  },
  header: { 
    ...theme.typography.h1,
    color: theme.colors.onBackground, 
    marginBottom: theme.spacing.xl,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  field: { 
    marginBottom: theme.spacing.lg 
  },
  row: { 
    flexDirection: 'row' 
  },
  sectionRow: {
    marginBottom: 0
  },
  label: { 
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant, 
    marginBottom: theme.spacing.sm 
  },
  input: { 
    backgroundColor: theme.colors.surfaceContainerLow, 
    borderWidth: 1, 
    borderColor: theme.colors.outlineVariant, 
    borderRadius: theme.borderRadius.lg, 
    padding: theme.spacing.md, 
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  pickerText: {
    marginLeft: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  textArea: { 
    height: 120, 
    textAlignVertical: 'top' 
  },
  saveBtn: { 
    backgroundColor: theme.colors.primary, 
    paddingVertical: 18, 
    borderRadius: theme.borderRadius.xl, 
    alignItems: 'center', 
    marginTop: theme.spacing.md,
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  disabledBtn: { 
    backgroundColor: theme.colors.outline 
  },
  saveBtnText: { 
    ...theme.typography.labelCaps,
    color: theme.colors.onPrimary, 
    fontSize: 16, 
    fontWeight: '900' 
  }
});
