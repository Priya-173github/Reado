import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';

export default function ProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<any>({});
  const [stats, setStats] = useState<any>({});
  const [fullName, setFullName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, statsRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/users/me/stats')
      ]);
      setProfile(profileRes.data);
      setFullName(profileRes.data.full_name || '');
      setTimezone(profileRes.data.timezone || 'UTC');
      setIsPrivate(profileRes.data.is_private || false);
      setStats(statsRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async () => {
    try {
      await api.put('/users/me', { full_name: fullName, timezone, is_private: isPrivate });
      alert('Profile updated');
    } catch (error) {
      console.error(error);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename || '');
    const type = match ? `image/${match[1]}` : `image`;
    
    const formData = new FormData();
    formData.append('file', { uri, name: filename, type } as any);

    try {
      const response = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile({ ...profile, avatar_url: response.data.avatar_url });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={pickImage}>
          {profile.avatar_url ? (
            <Image source={{ uri: `http://192.168.0.113:8001${profile.avatar_url}` }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}><Text>Avatar</Text></View>
          )}
        </TouchableOpacity>
        <Text style={styles.email}>{profile.email}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}><Text style={styles.statValue}>{stats.total_pages_read || 0}</Text><Text>Pages</Text></View>
        <View style={styles.statBox}><Text style={styles.statValue}>{stats.total_sessions || 0}</Text><Text>Sessions</Text></View>
        <View style={styles.statBox}><Text style={styles.statValue}>{stats.books_finished || 0}</Text><Text>Books</Text></View>
        <View style={styles.statBox}><Text style={styles.statValue}>{stats.current_streak_days || 0}</Text><Text>Streak</Text></View>
      </View>

      <Text style={styles.label}>Full Name</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

      <Text style={styles.label}>Timezone</Text>
      <TextInput style={styles.input} value={timezone} onChangeText={setTimezone} />

      <View style={styles.switchRow}>
        <Text style={styles.label}>Private Profile</Text>
        <Switch value={isPrivate} onValueChange={setIsPrivate} />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Save Profile</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.settingsBtnText}>Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f9f9f9', flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  email: { fontSize: 16, color: '#666', marginTop: 10 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statBox: { backgroundColor: 'white', padding: 15, borderRadius: 10, flex: 1, marginHorizontal: 5, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50' },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#ddd' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  saveBtn: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  settingsBtn: { backgroundColor: '#607D8B', padding: 15, borderRadius: 10, alignItems: 'center' },
  settingsBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
