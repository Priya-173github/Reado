import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../styles/theme';
import api from '../../services/api';
import Avatar from '../../components/Avatar';
import StatCard from '../../components/StatCard';
import ReadingHistoryTimeline from '../../components/ReadingHistoryTimeline';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen({ navigation }: any) {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<any>({});
  const [stats, setStats] = useState<any>({});
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, statsRes, heatmapRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/users/me/stats'),
        api.get('/sessions/heatmap')
      ]);
      setProfile(profileRes.data);
      setStats(statsRes.data);
      setHeatmap(heatmapRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handle = `@${profile.full_name?.replace(/\s+/g, '').toLowerCase() || profile.email?.split('@')[0] || 'user'}`;

  // Computed Stats
  const totalHours = Math.floor((stats.total_reading_time_minutes || 0) / 60);

  // Achievements logic
  const achievements = [];
  if (stats.books_finished >= 1) {
    achievements.push({ id: 'first_book', title: 'FIRST BOOK', icon: 'menu-book', type: 'material' });
  }
  if (stats.current_streak_days >= 7) {
    achievements.push({ id: '7_day', title: '7-DAY STREAK', icon: 'local-fire-department', type: 'material' });
  }
  if (totalHours >= 10) {
    achievements.push({ id: 'night_owl', title: 'NIGHT OWL', icon: 'moon', type: 'ionicons' });
  }

  // If missing achievements, add placeholders so the UI looks complete
  if (!achievements.find(a => a.id === 'first_book')) achievements.push({ id: 'first_book_p', title: 'FIRST BOOK', icon: 'menu-book', type: 'material', locked: true });
  if (!achievements.find(a => a.id === '7_day')) achievements.push({ id: '7_day_p', title: '7-DAY STREAK', icon: 'local-fire-department', type: 'material', locked: true });
  if (!achievements.find(a => a.id === 'night_owl')) achievements.push({ id: 'night_owl_p', title: 'NIGHT OWL', icon: 'moon', type: 'ionicons', locked: true });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <Text style={styles.logoText}>Reado</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
            <MaterialIcons name="settings" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={logout}>
            <MaterialIcons name="logout" size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Avatar uri={profile.avatar_url} size={90} showBadge={true} containerStyle={{ marginBottom: 16 }} />
          <Text style={styles.userName}>{profile.full_name || 'Reader'}</Text>
          <Text style={styles.userHandle}>{handle}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            label="TOTAL PAGES"
            value={stats.total_pages_read > 1000 ? (stats.total_pages_read / 1000).toFixed(1) + 'k' : stats.total_pages_read || 0}
            valueColor={theme.colors.onSecondary}
            style={styles.statCardFixed}
          />
          <StatCard
            label="BOOKS FINISHED"
            value={stats.books_finished || 0}
            valueColor={theme.colors.onSecondary}
            style={styles.statCardFixed}
          />
          <StatCard
            label="TOTAL HOURS"
            value={totalHours}
            valueColor={theme.colors.onSecondary}
            style={styles.statCardFixed}
          />
          <StatCard
            label="LONGEST STREAK"
            value={stats.current_streak_days || 0}
            unit="DAYS"
            valueColor={theme.colors.onSecondary}
            style={styles.statCardFixed}
          />
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader} 
            onPress={() => navigation.navigate('Activity')}
          >
            <Text style={styles.sectionTitle}>Achievements</Text>
            <MaterialIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementsList}>
            {achievements.map((ach) => (
              <View key={ach.id} style={[styles.achievementCard, ach.locked && { opacity: 0.3 }]}>
                <View style={styles.achievementIconWrapper}>
                  {ach.type === 'material' ? (
                    <MaterialIcons name={ach.icon as any} size={20} color="#211E26" />
                  ) : (
                    <Ionicons name={ach.icon as any} size={20} color="#211E26" />
                  )}
                </View>
                <Text style={styles.achievementText}>{ach.title}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Activity Heatmap */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reading Activity</Text>
            <Text style={styles.viewAllText}>Last 90 days</Text>
          </View>
          
          <View style={styles.heatmapCard}>
            <View style={styles.heatmapGrid}>
              {/* Labels for weeks/months could go here */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.heatmapColumns}>
                  {Array.from({ length: 13 }).map((_, weekIndex) => (
                    <View key={weekIndex} style={styles.heatmapColumn}>
                      {Array.from({ length: 7 }).map((_, dayIndex) => {
                        const dataIndex = weekIndex * 7 + dayIndex;
                        const dayData = heatmap[dataIndex];
                        if (!dayData) return <View key={dayIndex} style={styles.heatmapSquareEmpty} />;
                        
                        let color = 'rgba(255, 255, 255, 0.05)';
                        if (dayData.count > 0) color = 'rgba(2, 211, 138, 0.2)';
                        if (dayData.count > 2) color = 'rgba(2, 211, 138, 0.5)';
                        if (dayData.count > 4) color = 'rgba(2, 211, 138, 0.8)';
                        if (dayData.count > 6) color = '#02D38A';

                        return (
                          <View 
                            key={dayIndex} 
                            style={[styles.heatmapSquare, { backgroundColor: color }]} 
                          />
                        );
                      })}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
            
            <View style={styles.heatmapFooter}>
              <Text style={styles.heatmapLegendText}>Less</Text>
              <View style={[styles.heatmapSquareSmall, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]} />
              <View style={[styles.heatmapSquareSmall, { backgroundColor: 'rgba(2, 211, 138, 0.2)' }]} />
              <View style={[styles.heatmapSquareSmall, { backgroundColor: 'rgba(2, 211, 138, 0.5)' }]} />
              <View style={[styles.heatmapSquareSmall, { backgroundColor: 'rgba(2, 211, 138, 0.8)' }]} />
              <View style={[styles.heatmapSquareSmall, { backgroundColor: '#02D38A' }]} />
              <Text style={styles.heatmapLegendText}>More</Text>
            </View>
          </View>
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  logoText: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    fontWeight: '900',
    letterSpacing: -1,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  userName: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    fontWeight: 'bold',
  },
  userHandle: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  statCardFixed: {
    width: '48%',
    marginBottom: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    fontWeight: 'bold',
  },
  achievementsList: {
    gap: 16,
  },
  achievementCard: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
    width: 120,
  },
  achievementIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.achievementBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementText: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    fontSize: 10,
  },
  viewAllText: {
    ...theme.typography.labelCaps,
    color: theme.colors.primary,
    fontSize: 10,
  },
  heatmapCard: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  heatmapGrid: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  heatmapColumns: {
    flexDirection: 'row',
    gap: 4,
  },
  heatmapColumn: {
    gap: 4,
  },
  heatmapSquare: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  heatmapSquareEmpty: {
    width: 14,
    height: 14,
  },
  heatmapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 8,
  },
  heatmapSquareSmall: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  heatmapLegendText: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    fontSize: 8,
    marginHorizontal: 4,
  },
});
