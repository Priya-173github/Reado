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

export default function ProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<any>({});
  const [stats, setStats] = useState<any>({});
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, statsRes, sessionsRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/users/me/stats'),
        api.get('/sessions/')
      ]);
      setProfile(profileRes.data);
      setStats(statsRes.data);
      setSessions(sessionsRes.data);
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
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialIcons name="notifications-none" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
            <MaterialIcons name="settings" size={24} color={theme.colors.onSurface} />
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
            valueColor={theme.colors.statPurple}
            style={styles.statCardFixed}
          />
          <StatCard 
            label="BOOKS FINISHED" 
            value={stats.books_finished || 0}
            valueColor={theme.colors.statYellow}
            style={styles.statCardFixed}
          />
          <StatCard 
            label="TOTAL HOURS" 
            value={totalHours}
            valueColor={theme.colors.statPurple}
            style={styles.statCardFixed}
          />
          <StatCard 
            label="LONGEST STREAK" 
            value={stats.current_streak_days || 0}
            unit="DAYS"
            valueColor={theme.colors.statOrange}
            style={styles.statCardFixed}
          />
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <MaterialIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
          </View>
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

        {/* Reading History */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 20 }]}>Reading History</Text>
          <ReadingHistoryTimeline sessions={sessions} />
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
});
