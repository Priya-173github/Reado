import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity, 
  Alert, 
  Image,
  StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
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
    Alert.alert('Delete Session', 'Are you sure you want to remove this reading session?', [
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
    const dateStr = new Date(item.started_at).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Image 
            source={{ uri: item.book?.cover_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0_MXSn8SBWzEO__JK0JKR4PsciizduRLwZoDaOnC9Kh-b1lNCwl0_NLkjZPAVD9Eb4KuF1IzDdbeiLBSeDMdGMhuIn-dyhwr0GOs8Xr-Z_CIb-JnxfJvVt4clFqMFwz9qtyVkCwyXrBb_3KoBVJFnFaGX450-RQHboa3ggo0cE6JEuDNcF4kDFw8XUkZK4jOl-UWpHqeYGvv65vOovfaI-axz3u0Ob5SaV1htW1af3N_kSXOT1pkkq0qiz_BaQDVuABMOt6b3' }} 
            style={styles.bookCover} 
          />
          <View style={styles.cardInfo}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{item.book_title || item.book?.title || 'Unknown Book'}</Text>
                <Text style={styles.meta}>Reading session • {dateStr}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <MaterialIcons name="delete-outline" size={22} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statLabel}>PAGES</Text>
                <Text style={styles.statValue}>+{item.pages_read}</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>TIME</Text>
                <Text style={styles.statValue}>{durationMins}m</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Progress Bar Placeholder */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '45%' }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>PROGRESS</Text>
            <Text style={styles.progressPercent}>45%</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <MaterialIcons name="favorite-border" size={18} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.actionText}>Kudos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => navigation.navigate('EditSession', { session: item })}
          >
            <MaterialIcons name="edit" size={18} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { marginLeft: 'auto' }]}>
            <MaterialIcons name="share" size={18} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity</Text>
      </View>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  header: {
    paddingHorizontal: theme.spacing.container_margin,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    ...theme.typography.h1,
    color: theme.colors.onBackground,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  list: { 
    padding: theme.spacing.container_margin,
    paddingTop: 0,
    paddingBottom: 100,
  },
  card: { 
    backgroundColor: theme.colors.surfaceContainer, 
    borderRadius: theme.borderRadius.lg, 
    marginBottom: theme.spacing.md, 
    borderWidth: 1, 
    borderColor: theme.colors.outlineVariant,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  bookCover: {
    width: 64,
    height: 96,
    borderRadius: 4,
  },
  cardInfo: { 
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: { 
    ...theme.typography.h3,
    color: theme.colors.onSurface,
    fontSize: 18,
  },
  meta: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  statLabel: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
  },
  statValue: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    fontSize: 18,
  },
  progressSection: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: theme.colors.surfaceContainerHighest,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressLabel: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
  },
  progressPercent: {
    ...theme.typography.labelCaps,
    color: theme.colors.primary,
    fontSize: 10,
  },
  cardActions: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    gap: theme.spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  actionText: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  }
});
