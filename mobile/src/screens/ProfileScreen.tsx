import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Switch,
  StatusBar,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import api from '../services/api';

export default function ProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<any>({});
  const [stats, setStats] = useState<any>({});
  const [fullName, setFullName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      await api.put('/users/me', { full_name: fullName, timezone, is_private: isPrivate });
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
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
      Alert.alert('Error', 'Failed to upload avatar');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
            <MaterialIcons name="settings" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
            {profile.avatar_url ? (
              <Image source={{ uri: `http://192.168.0.113:8001${profile.avatar_url}` }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialIcons name="person" size={50} color={theme.colors.outline} />
              </View>
            )}
            <View style={styles.editAvatarBadge}>
              <MaterialIcons name="edit" size={14} color={theme.colors.onPrimary} />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{fullName || 'New User'}</Text>
          <Text style={styles.userEmail}>{profile.email}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <ProfileStat label="PAGES" value={stats.total_pages_read || 0} />
        <ProfileStat label="BOOKS" value={stats.books_finished || 0} />
        <ProfileStat label="STREAK" value={stats.current_streak_days || 0} />
        <ProfileStat label="SESSIONS" value={stats.total_sessions || 0} />
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>FULL NAME</Text>
          <TextInput 
            style={styles.input} 
            value={fullName} 
            onChangeText={setFullName} 
            placeholder="Your Name"
            placeholderTextColor={theme.colors.outline}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>TIMEZONE</Text>
          <TextInput 
            style={styles.input} 
            value={timezone} 
            onChangeText={setTimezone} 
            placeholder="UTC"
            placeholderTextColor={theme.colors.outline}
          />
        </View>

        <View style={styles.switchRow}>
          <View>
            <Text style={[styles.label, { marginBottom: 2 }]}>PRIVATE PROFILE</Text>
            <Text style={styles.switchSubtitle}>Hide your activity from friends</Text>
          </View>
          <Switch 
            value={isPrivate} 
            onValueChange={setIsPrivate}
            trackColor={{ false: theme.colors.surfaceContainerHighest, true: theme.colors.primaryContainer }}
            thumbColor={isPrivate ? theme.colors.primary : theme.colors.outline}
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, loading && styles.disabledBtn]} 
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveBtnText}>{loading ? 'SAVING...' : 'SAVE CHANGES'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function ProfileStat({ label, value }: any) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: theme.spacing.container_margin,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    ...theme.typography.h1,
    color: theme.colors.onBackground,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  avatarPlaceholder: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: theme.colors.surfaceContainer, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
  userName: {
    ...theme.typography.h2,
    color: theme.colors.onSurface,
    fontWeight: '900',
  },
  userEmail: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.container_margin,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  statBox: { 
    backgroundColor: theme.colors.surfaceContainerLow, 
    padding: theme.spacing.md, 
    borderRadius: theme.borderRadius.lg, 
    flex: 1,
    minWidth: '45%',
    alignItems: 'center', 
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  statValue: { 
    ...theme.typography.h2,
    color: theme.colors.primary,
    fontWeight: '900',
  },
  statLabel: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  form: {
    paddingHorizontal: theme.spacing.container_margin,
  },
  label: { 
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  input: { 
    backgroundColor: theme.colors.surfaceContainerLow, 
    padding: theme.spacing.md, 
    borderRadius: theme.borderRadius.lg, 
    marginBottom: theme.spacing.lg, 
    borderWidth: 1, 
    borderColor: theme.colors.outlineVariant,
    color: theme.colors.onSurface,
    fontSize: 16,
  },
  switchRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: theme.spacing.xl,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
  switchSubtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  saveBtn: { 
    backgroundColor: theme.colors.primary, 
    paddingVertical: 18, 
    borderRadius: theme.borderRadius.xl, 
    alignItems: 'center', 
    marginBottom: 20,
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
    fontWeight: '900',
  }
});
