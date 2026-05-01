import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Image, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen() {
  // This screen is shown while AuthContext checks for stored tokens.
  // Navigation is handled by AppNavigator based on isAuthenticated state.
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>📚</Text>
      <Text style={styles.title}>Reado</Text>
      <Text style={styles.subtitle}>Your social reading tracker</Text>
      <ActivityIndicator size="large" color="#6C63FF" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0B8',
    marginBottom: 32,
  },
  loader: {
    marginTop: 24,
  },
});
