import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  Alert
} from 'react-native';
import api from '../../services/api';
import { theme } from '../../styles/theme';

export default function EditSessionScreen({ route, navigation }: any) {
  const { session } = route.params;
  
  const [pagesRead, setPagesRead] = useState(session.pages_read.toString());
  const [duration, setDuration] = useState(Math.floor(session.duration_seconds / 60).toString());
  const [notes, setNotes] = useState(session.notes || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!pagesRead || !duration) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      await api.put(`/sessions/${session.id}`, {
        pages_read: parseInt(pagesRead, 10),
        duration_seconds: parseInt(duration, 10) * 60,
        notes
      });
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.header}>Edit session</Text>
      
      <View style={styles.field}>
        <Text style={styles.label}>PAGES READ</Text>
        <TextInput 
          style={styles.input} 
          value={pagesRead} 
          onChangeText={setPagesRead} 
          keyboardType="number-pad" 
          placeholder="0"
          placeholderTextColor={theme.colors.outline}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>DURATION (MINUTES)</Text>
        <TextInput 
          style={styles.input} 
          value={duration} 
          onChangeText={setDuration} 
          keyboardType="number-pad" 
          placeholder="0"
          placeholderTextColor={theme.colors.outline}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>NOTES</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          value={notes} 
          onChangeText={setNotes} 
          multiline 
          placeholder="What did you think?"
          placeholderTextColor={theme.colors.outline}
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity 
        style={[styles.saveBtn, loading && styles.disabledBtn]} 
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveBtnText}>{loading ? 'SAVING...' : 'SAVE CHANGES'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  scrollContent: {
    padding: theme.spacing.container_margin,
    paddingTop: theme.spacing.xl,
    paddingBottom: 40,
  },
  header: {
    ...theme.typography.h1,
    color: theme.colors.onBackground,
    fontWeight: '900',
    letterSpacing: -1.5,
    marginBottom: theme.spacing.xl,
  },
  field: { 
    marginBottom: theme.spacing.lg 
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
