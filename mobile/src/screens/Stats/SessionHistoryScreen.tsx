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
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../styles/theme';
import api from '../../services/api';
import SessionCard from '../../components/SessionCard';
import StatCard from '../../components/StatCard';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function SessionHistoryScreen({ navigation }: any) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.started_at).toDateString();
    const targetDate = selectedDate.toDateString();
    return sessionDate === targetDate;
  });

  const fetchData = async () => {
    try {
      const [sessionsRes, statsRes, heatmapRes] = await Promise.all([
        api.get('/sessions/'),
        api.get('/users/me/stats'),
        api.get('/sessions/heatmap')
      ]);
      setSessions(sessionsRes.data);
      setStats(statsRes.data);
      setHeatmap(heatmapRes.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Session', 'Are you sure you want to remove this reading session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/sessions/${id}`);
            setSessions(prev => prev.filter(s => s.session_id !== id));
          } catch (error) {
            console.error(error);
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }: any) => (
    <SessionCard
      session={item}
      onDelete={handleDelete}
      onEdit={(sess) => navigation.navigate('EditSession', { session: sess })}
      showActions={true}
      showProgress={true}
    />
  );

  const renderDashboard = () => {
    if (!stats) return null;

    const weeks = [];
    for (let i = 0; i < heatmap.length; i += 7) {
      weeks.push(heatmap.slice(i, i + 7));
    }

    return (
      <View style={styles.dashboard}>
        {/* Stats Row */}
        <View style={styles.statsGrid}>
          <StatCard
            label="STREAK"
            value={stats.current_streak_days}
            icon={<MaterialCommunityIcons name="fire" size={20} color="#FF6B6B" />}
            style={{ flex: 1 }}
          />
          <StatCard
            label="PAGES"
            value={stats.total_pages_read}
            icon={<MaterialCommunityIcons name="book-open-page-variant" size={20} color={theme.colors.primary} />}
            style={{ flex: 1 }}
          />
          <StatCard
            label="TIME"
            value={`${Math.round(stats.total_reading_time_minutes / 60)}h`}
            icon={<MaterialCommunityIcons name="clock-outline" size={20} color="#4D96FF" />}
            style={{ flex: 1 }}
          />
        </View>

        {/* Heatmap Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Activity Heatmap</Text>
          <View style={styles.heatmapContainer}>
            {weeks.map((week, wIndex) => (
              <View key={wIndex} style={styles.heatmapColumn}>
                {week.map((day, dIndex) => {
                  let color = theme.colors.surfaceContainerHighest;
                  const count = day?.count ?? 0;
                  if (count > 0) color = 'rgba(2, 211, 138, 0.3)';
                  if (count > 2) color = 'rgba(2, 211, 138, 0.6)';
                  if (count > 5) color = theme.colors.primary;

                  return (
                    <View
                      key={dIndex}
                      style={[styles.heatmapSquare, { backgroundColor: color }]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
          <View style={styles.heatmapFooter}>
            <Text style={styles.heatmapLegendText}>Less</Text>
            <View style={[styles.heatmapSquare, { backgroundColor: theme.colors.surfaceContainerHighest, marginHorizontal: 2 }]} />
            <View style={[styles.heatmapSquare, { backgroundColor: 'rgba(2, 211, 138, 0.3)', marginHorizontal: 2 }]} />
            <View style={[styles.heatmapSquare, { backgroundColor: 'rgba(2, 211, 138, 0.6)', marginHorizontal: 2 }]} />
            <View style={[styles.heatmapSquare, { backgroundColor: theme.colors.primary, marginHorizontal: 2 }]} />
            <Text style={styles.heatmapLegendText}>More</Text>
          </View>
        </View>

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>History</Text>
          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {selectedDate.toDateString() === new Date().toDateString() ? 'Today' : selectedDate.toLocaleDateString()}
            </Text>
            <MaterialIcons name="calendar-today" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date);
            }}
          />
        )}
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
        data={filteredSessions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderDashboard}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="calendar-blank" size={48} color={theme.colors.surfaceContainerHighest} />
            <Text style={styles.emptyStateText}>No activity recorded for this date.</Text>
          </View>
        }
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
  dashboard: {
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  sectionCard: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.onSurface,
    marginBottom: 16,
  },
  heatmapContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heatmapColumn: {
    gap: 4,
  },
  heatmapSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  heatmapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  heatmapLegendText: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
    marginHorizontal: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    gap: 8,
  },
  dateText: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyStateText: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
