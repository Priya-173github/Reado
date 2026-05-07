import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import api from '../services/api';

export default function EditSessionScreen({ route, navigation }: any) {
  const { session } = route.params;
  
  const [pagesRead, setPagesRead] = useState(session.pages_read.toString());
  const [duration, setDuration] = useState(Math.floor(session.duration_seconds / 60).toString());
  const [notes, setNotes] = useState(session.notes || '');

  const handleSave = async () => {
    try {
      await api.put(`/sessions/${session.id}`, {
        pages_read: parseInt(pagesRead, 10),
        duration_seconds: parseInt(duration, 10) * 60,
        notes
      });
      navigation.goBack();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Pages Read</Text>
      <TextInput style={styles.input} value={pagesRead} onChangeText={setPagesRead} keyboardType="number-pad" />

      <Text style={styles.label}>Duration (minutes)</Text>
      <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="number-pad" />

      <Text style={styles.label}>Notes</Text>
      <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} multiline />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#ddd' },
  textArea: { height: 100, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
