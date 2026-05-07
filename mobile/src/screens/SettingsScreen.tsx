import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import api from '../services/api';
import * as SecureStore from 'expo-secure-store';

export default function SettingsScreen({ navigation }: any) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleChangePassword = async () => {
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
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      // Root navigator should handle auth state change and show Login
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'Are you sure you want to permanently delete your account?', [
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
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Change Password</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Old Password" 
        secureTextEntry 
        value={oldPassword} 
        onChangeText={setOldPassword} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="New Password" 
        secureTextEntry 
        value={newPassword} 
        onChangeText={setNewPassword} 
      />
      <TouchableOpacity style={styles.btn} onPress={handleChangePassword}>
        <Text style={styles.btnText}>Change Password</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity style={[styles.btn, styles.logoutBtn]} onPress={handleLogout}>
        <Text style={styles.btnText}>Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.deleteBtn]} onPress={handleDeleteAccount}>
        <Text style={styles.btnText}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  btn: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  logoutBtn: { backgroundColor: '#FF9800' },
  deleteBtn: { backgroundColor: '#F44336' },
  btnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#ddd', marginVertical: 30 }
});
