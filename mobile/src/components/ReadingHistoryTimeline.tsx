import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

interface ReadingHistoryTimelineProps {
  sessions: any[];
}

export default function ReadingHistoryTimeline({ sessions }: ReadingHistoryTimelineProps) {
  // Group sessions by date
  const groupedSessions = sessions.reduce((acc: any, session: any) => {
    const date = new Date(session.started_at);
    const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    if (!acc[dateString]) acc[dateString] = [];
    acc[dateString].push(session);
    return acc;
  }, {});

  // Convert to array of [date, sessions] and sort by date descending
  const sortedDateGroups = Object.entries(groupedSessions).sort((a: any, b: any) => {
    return new Date(b[0]).getTime() - new Date(a[0]).getTime();
  });

  if (sortedDateGroups.length === 0) {
    return (
      <Text style={styles.emptyText}>No reading history yet.</Text>
    );
  }

  return (
    <View style={styles.timeline}>
      {sortedDateGroups.map(([date, daySessions]: [string, any]) => (
        <View key={date} style={styles.timelineGroup}>
          <View style={styles.timelineDateRow}>
            <View style={styles.timelineDotWrapper}>
              <MaterialIcons name="history" size={14} color={theme.colors.onSurfaceVariant} />
            </View>
            <Text style={styles.timelineDate}>{date}</Text>
          </View>

          <View style={styles.historyItemsContainer}>
            <View style={styles.timelineLineWrapper}>
              <View style={styles.timelineLine} />
            </View>

            <View style={styles.historyCardsCol}>
              {daySessions.map((session: any) => {
                const durationMins = Math.floor((session.duration_seconds || 0) / 60);
                const statusText = session.pages_read > 0 ? 'SESSION' : 'DONE'; 
                
                return (
                  <View key={session.id} style={styles.historyCard}>
                    <Image 
                      source={{ uri: session.book?.cover_url || 'https://via.placeholder.com/150x220?text=No+Cover' }} 
                      style={styles.historyCover} 
                    />
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyTitle} numberOfLines={1}>{session.book?.title || session.book_title}</Text>
                      <Text style={styles.historyMeta}>{session.pages_read} pages • {durationMins} mins</Text>
                    </View>
                    <Text style={styles.historyStatus}>{statusText}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 20,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineGroup: {
    marginBottom: 24,
  },
  timelineDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    left: -15, 
  },
  timelineDotWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.timelineGrey,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDate: {
    ...theme.typography.bodyMd,
    color: theme.colors.onBackground,
  },
  historyItemsContainer: {
    flexDirection: 'row',
  },
  timelineLineWrapper: {
    width: 30,
    alignItems: 'center',
    marginRight: 12,
    marginLeft: -15,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: theme.colors.timelineGrey,
  },
  historyCardsCol: {
    flex: 1,
    gap: 12,
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
  },
  historyCover: {
    width: 44,
    height: 64,
    borderRadius: 4,
    backgroundColor: theme.colors.surfaceContainerHighest,
  },
  historyInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  historyTitle: {
    ...theme.typography.bodyLg,
    color: theme.colors.onBackground,
    marginBottom: 4,
  },
  historyMeta: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
  },
  historyStatus: {
    ...theme.typography.labelCaps,
    color: theme.colors.statPurple,
    marginLeft: 12,
  },
});
