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
  RefreshControl,
  Alert
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../styles/theme';
import api from '../../services/api';
import Avatar from '../../components/Avatar';
import StatCard from '../../components/StatCard';
import SessionCard from '../../components/SessionCard';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [latestSession, setLatestSession] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [userRes, statsRes, sessionsRes, activityRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/users/me/stats'),
        api.get('/sessions/?limit=1'),
        api.get('/sessions/activity')
      ]);

      setUser(userRes.data);
      setStats(statsRes.data);
      setActivity(activityRes.data);
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

  const maxPages = Math.max(...activity.map(a => a.pages), 10); // min height base
  const totalWeeklyPages = activity.reduce((sum, a) => sum + a.pages, 0);


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
        <View style={styles.rightHeader}>
          <TouchableOpacity
            style={styles.aiBtn}
            onPress={() => navigation.navigate('BookAIChat')}
            accessibilityLabel="Open Book AI"
          >
            <MaterialCommunityIcons name="robot" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          <View style={styles.streakBadge}>
            <MaterialIcons name="local-fire-department" size={20} color={theme.colors.statOrange} />
            <Text style={styles.streakText}>{stats?.current_streak_days || 0}</Text>
          </View>
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
        {/* Weekly Progress Chart */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Weekly Progress</Text>
              <Text style={styles.chartSubtitle}>{totalWeeklyPages} pages read this week</Text>
            </View>
            <View style={styles.chartLegend}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
              <Text style={styles.legendText}>Pages</Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <LineChart
              data={{
                labels: activity.map(a => a.day[0]),
                datasets: [{
                  data: activity.map(a => a.pages)
                }]
              }}
              width={width - 72} // Subtracting padding/margins
              height={180}
              chartConfig={{
                backgroundColor: theme.colors.surfaceContainerLow,
                backgroundGradientFrom: theme.colors.surfaceContainerLow,
                backgroundGradientTo: theme.colors.surfaceContainerLow,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(2, 211, 138, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.5})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: theme.colors.primary
                }
              }}
              bezier
              onDataPointClick={({ value, dataset, getColor }) => {
                Alert.alert('Reading Activity', `You read ${value} pages on this day.`);
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
              withInnerLines={false}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={false}
              withShadow={false}
            />
          </View>
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
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('ReadingTimer', {
                book_id: latestSession.book?.id || latestSession.book_id,
                book_title: latestSession.book?.title || latestSession.book_title,
                total_pages: latestSession.book?.total_pages || 0,
                current_page: latestSession.book?.current_page || 0
              })}
            >
              <SessionCard session={latestSession} />
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No recent activity. Start reading!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Manual Log Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ManualLog')}
      >
        <MaterialIcons name="add" size={28} color={theme.colors.primary} />
      </TouchableOpacity>
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
    ...theme.typography.h2,
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

  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  streakText: {
    ...theme.typography.labelCaps,
    color: theme.colors.statOrange,
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  chartSection: {
    backgroundColor: theme.colors.surfaceContainerLow,
    marginHorizontal: theme.spacing.container_margin,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  chartTitle: {
    ...theme.typography.h3,
    color: theme.colors.onSurface,
    fontWeight: 'bold',
  },
  chartSubtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginTop: -10,
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
  addManualBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100, // Above the tab bar
    width: 44,
    height: 44,
    borderRadius: 38, // Matching the play button's radius logic
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(2, 211, 138, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
