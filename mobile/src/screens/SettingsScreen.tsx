import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  StatusBar,
  ScrollView
} from 'react-native';
import api from '../services/api';
import * as SecureStore from 'expo-secure-store';
import { theme } from '../styles/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function SettingsScreen({ navigation }: any) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert('Error', 'Please fill in both password fields');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      Alert.alert('Success', 'Password changed successfully');
      setOldPassword('');
      setNewPassword('');
    } catch (error) {
      Alert.alert('Error', 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      // Nav state will handle redirection
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'Are you sure you want to permanently delete your account? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete('/users/me');
          await SecureStore.deleteItemAsync('access_token');
          await SecureStore.deleteItemAsync('refresh_token');
        } catch (error) {
          console.error(error);
        }
      }}
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>SECURITY</Text>
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>OLD PASSWORD</Text>
            <TextInput 
              style={styles.input} 
              placeholder="••••••••" 
              placeholderTextColor={theme.colors.outline}
              secureTextEntry 
              value={oldPassword} 
              onChangeText={setOldPassword} 
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>NEW PASSWORD</Text>
            <TextInput 
              style={styles.input} 
              placeholder="••••••••" 
              placeholderTextColor={theme.colors.outline}
              secureTextEntry 
              value={newPassword} 
              onChangeText={setNewPassword} 
            />
          </View>
          <TouchableOpacity 
            style={[styles.primaryBtn, loading && styles.disabledBtn]} 
            onPress={handleChangePassword}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>{loading ? 'UPDATING...' : 'CHANGE PASSWORD'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>ACCOUNT ACTIONS</Text>
        <TouchableOpacity style={styles.listButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color={theme.colors.onSurface} />
          <Text style={styles.listButtonText}>Logout from Reado</Text>
          <MaterialIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.listButton, styles.dangerButton]} onPress={handleDeleteAccount}>
          <MaterialIcons name="delete-forever" size={20} color={theme.colors.error} />
          <Text style={[styles.listButtonText, styles.dangerText]}>Permanently Delete Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>Reado v1.2.0 • Premium Obsidian UI</Text>
      </View>
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
    paddingTop: theme.spacing.lg,
    paddingBottom: 60,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.md,
    marginLeft: 4,
  },
  card: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  field: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.onSurface,
    fontSize: 16,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primaryContainer,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    ...theme.typography.labelCaps,
    color: theme.colors.onPrimaryContainer,
    fontWeight: '900',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  listButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  listButtonText: {
    ...theme.typography.bodyLg,
    color: theme.colors.onSurface,
    flex: 1,
    marginLeft: 12,
  },
  dangerButton: {
    borderColor: theme.colors.errorContainer,
    backgroundColor: 'rgba(147, 0, 10, 0.05)',
  },
  dangerText: {
    color: theme.colors.error,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  versionText: {
    ...theme.typography.labelCaps,
    color: theme.colors.outline,
    fontSize: 10,
  }
});
