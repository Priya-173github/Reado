import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

interface SessionCardProps {
  session: any;
  onDelete?: (id: string) => void;
  onEdit?: (session: any) => void;
  showActions?: boolean;
  showProgress?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function SessionCard({ 
  session, 
  onDelete, 
  onEdit, 
  showActions = false, 
  showProgress = false,
  containerStyle 
}: SessionCardProps) {
  const durationMins = Math.floor(session.duration_seconds / 60);
  const dateStr = new Date(session.started_at).toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    year: showActions ? 'numeric' : undefined
  });

  return (
    <View style={[styles.card, containerStyle]}>
      <View style={styles.cardTop}>
        <Image 
          source={{ uri: session.book?.cover_url || 'https://via.placeholder.com/150x220?text=No+Cover' }} 
          style={styles.bookCover} 
        />
        <View style={styles.cardInfo}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>{session.book_title || session.book?.title || 'Unknown Book'}</Text>
              <Text style={styles.meta}>Reading session • {dateStr}</Text>
            </View>
            {onDelete && (
              <TouchableOpacity onPress={() => onDelete(session.id)}>
                <MaterialIcons name="delete-outline" size={22} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            )}
            {!onDelete && !showActions && (
               <MaterialIcons name="more-horiz" size={24} color={theme.colors.onSurfaceVariant} />
            )}
          </View>
          
          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statLabel}>PAGES</Text>
              <Text style={styles.statValue}>+{session.pages_read}</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>TIME</Text>
              <Text style={styles.statValue}>{durationMins}m</Text>
            </View>
          </View>
        </View>
      </View>

      {showProgress && (
        <View style={styles.progressSection}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '45%' }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>PROGRESS</Text>
            <Text style={styles.progressPercent}>45%</Text>
          </View>
        </View>
      )}

      {showActions && (
        <View style={styles.cardActions}>
          {onEdit && (
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => onEdit(session)}
            >
              <MaterialIcons name="edit" size={18} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { 
    backgroundColor: theme.colors.surfaceContainer, 
    borderRadius: theme.borderRadius.lg, 
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
    backgroundColor: theme.colors.surfaceContainerHighest,
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
