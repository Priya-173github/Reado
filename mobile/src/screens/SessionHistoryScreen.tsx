import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

export default function SessionHistoryScreen({ navigation }: any) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/sessions/');
      setSessions(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchSessions();
    }, [])
  );

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Session', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/sessions/${id}`);
          setSessions(prev => prev.filter(s => s.id !== id));
        } catch (error) {
          console.error(error);
        }
      }}
    ]);
  };

  const renderItem = ({ item }: any) => {
    const durationMins = Math.floor(item.duration_seconds / 60);
    const date = new Date(item.started_at).toLocaleDateString();

    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <Text style={styles.title}>{item.book?.title || 'Unknown Book'}</Text>
          <Text style={styles.details}>{item.pages_read} pages in {durationMins}m</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditSession', { session: item })}>
            <Text style={styles.btnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
            <Text style={styles.btnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  list: { padding: 15 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', elevation: 2 },
  cardInfo: { flex: 1 },
  title: { fontSize: 18, fontWeight: 'bold' },
  details: { fontSize: 14, color: '#666', marginTop: 5 },
  date: { fontSize: 12, color: '#aaa', marginTop: 5 },
  actions: { justifyContent: 'space-around' },
  editBtn: { backgroundColor: '#4CAF50', padding: 8, borderRadius: 5, marginBottom: 5, alignItems: 'center', width: 60 },
  deleteBtn: { backgroundColor: '#F44336', padding: 8, borderRadius: 5, alignItems: 'center', width: 60 },
  btnText: { color: 'white', fontSize: 12, fontWeight: 'bold' }
});
