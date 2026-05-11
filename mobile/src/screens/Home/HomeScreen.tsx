import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Dimensions,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../styles/theme';
import api from '../../services/api';
import Avatar from '../../components/Avatar';
import StatCard from '../../components/StatCard';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [latestSession, setLatestSession] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [userRes, statsRes, sessionsRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/users/me/stats'),
        api.get('/sessions/?limit=1')
      ]);

      setUser(userRes.data);
      setStats(statsRes.data);
      if (sessionsRes.data.length > 0) {
        setLatestSession(sessionsRes.data[0]);
      } else {
        setLatestSession(null);
      }
    } catch (error) {
      console.error('Failed to fetch home data', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Avatar 
          uri={user?.avatar_url} 
          size={32} 
          onPress={() => navigation.navigate('Profile')} 
          containerStyle={{ marginBottom: 0 }}
        />
        <Text style={styles.logoText}>Reado</Text>
        <View style={styles.streakBadge}>
          <MaterialIcons name="local-fire-department" size={20} color={theme.colors.statOrange} />
          <Text style={styles.streakText}>{stats?.current_streak_days || 0}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard 
            label="STREAK" 
            value={stats?.current_streak_days || 0} 
            unit="DAYS" 
            valueColor={theme.colors.statOrange}
            style={styles.statCardFixed} 
          />
          <StatCard 
            label="PAGES" 
            value={stats?.total_pages_read > 1000 ? (stats?.total_pages_read / 1000).toFixed(1) + 'k' : stats?.total_pages_read || 0} 
            valueColor={theme.colors.statPurple}
            style={styles.statCardFixed} 
          />
          <StatCard 
            label="TIME READ" 
            value={((stats?.total_reading_time_minutes || 0) / 60).toFixed(1)} 
            unit="HRS" 
            valueColor={theme.colors.statPurple}
            style={styles.statCardFixed} 
          />
          <StatCard 
            label="FINISHED" 
            value={stats?.books_finished || 0} 
            unit="BOOKS" 
            valueColor={theme.colors.statYellow}
            style={styles.statCardFixed} 
          />
        </View>

        {/* Your Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Activity')}>
              <Text style={styles.viewAllText}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>

          {latestSession ? (
            <View style={styles.activityCard}>
              <View style={styles.activityContent}>
                <Image
                  source={{ uri: latestSession.book?.cover_url || 'https://via.placeholder.com/150x220?text=No+Cover' }}
                  style={styles.bookCover}
                />
                <View style={styles.activityInfo}>
                  <View style={styles.activityHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bookTitle} numberOfLines={1}>{latestSession.book?.title || latestSession.book_title}</Text>
                      <Text style={styles.sessionMeta}>Reading session • {new Date(latestSession.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                    </View>
                    <MaterialIcons name="more-horiz" size={24} color={theme.colors.onSurfaceVariant} />
                  </View>

                  <View style={styles.activityStatsGrid}>
                    <View>
                      <Text style={styles.activityStatLabel}>PAGES</Text>
                      <Text style={styles.activityStatValue}>+{latestSession.pages_read}</Text>
                    </View>
                    <View>
                      <Text style={styles.activityStatLabel}>TIME</Text>
                      <Text style={styles.activityStatValue}>{Math.floor(latestSession.duration_seconds / 60)}m</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No recent activity. Start reading!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.container_margin,
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  logoText: {
    ...theme.typography.h1,
    color: theme.colors.primary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    gap: 4,
  },
  streakText: {
    ...theme.typography.labelCaps,
    color: theme.colors.statOrange,
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.container_margin,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  statCardFixed: {
    width: '48%',
    marginBottom: 16,
  },
  section: {
    paddingHorizontal: theme.spacing.container_margin,
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.onSurface,
  },
  viewAllText: {
    ...theme.typography.labelCaps,
    color: theme.colors.primary,
  },
  activityCard: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    overflow: 'hidden',
  },
  activityContent: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  bookCover: {
    width: 96,
    height: 144,
    borderRadius: 4,
    backgroundColor: theme.colors.surfaceContainerHighest,
  },
  activityInfo: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bookTitle: {
    ...theme.typography.h3,
    color: theme.colors.onSurface,
  },
  sessionMeta: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  activityStatsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  activityStatLabel: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  activityStatValue: {
    ...theme.typography.h3,
    color: theme.colors.primary,
  },
  emptyCard: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.borderRadius.lg,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderStyle: 'dashed',
  },
  emptyText: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
;
