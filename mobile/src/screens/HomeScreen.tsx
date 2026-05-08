import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Image, 
  StatusBar,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import api from '../services/api';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<any>(null);
  const [latestSession, setLatestSession] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const statsRes = await api.get('/users/me/stats');
      setStats(statsRes.data);
      
      const sessionsRes = await api.get('/sessions/?limit=1');
      if (sessionsRes.data.length > 0) {
        setLatestSession(sessionsRes.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch home data', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDi0HTL8H1oNPXzTcDYdK0kUoUG6dRHzsX2lK-NfwwT8TArTI-JEOftKrBv5EUvMUiPJ0JhY-OsoK5E0XXc0cZbvjZRwW8qU195akIpOiWPnSLazWxHvdrsdQb3tAYsbKkoWRNSak1X0lvKQYxxm6lYpDeGKVX0su_iKnDEgYnZV4q1lLgwbd10CRQSTmBjgjhLbOx3Acmnnv17ykn56YIEsOotFE2ZEEtgJQRuliRj4-PRhTlW6OrV6flB-NhMXmp3n67vd-PH' }} 
          style={styles.avatar} 
        />
        <Text style={styles.logoText}>Reado</Text>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="notifications-none" size={26} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Stats Strip */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.statsStrip}
          contentContainerStyle={styles.statsStripContent}
        >
          <StatCard label="STREAK" value={stats?.current_streak_days || 0} unit="DAYS" />
          <StatCard label="PAGES" value={stats?.total_pages_read || 0} />
          <StatCard label="TIME READ" value={((stats?.total_reading_time_minutes || 0) / 60).toFixed(1)} unit="HRS" />
          <StatCard label="FINISHED" value={stats?.books_finished || 0} unit="BOOKS" />
        </ScrollView>

        {/* Your Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Activity')}>
              <Text style={styles.viewAllText}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>

          {latestSession ? (
            <TouchableOpacity style={styles.activityCard}>
              <View style={styles.activityContent}>
                <Image 
                  source={{ uri: latestSession.book?.cover_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0_MXSn8SBWzEO__JK0JKR4PsciizduRLwZoDaOnC9Kh-b1lNCwl0_NLkjZPAVD9Eb4KuF1IzDdbeiLBSeDMdGMhuIn-dyhwr0GOs8Xr-Z_CIb-JnxfJvVt4clFqMFwz9qtyVkCwyXrBb_3KoBVJFnFaGX450-RQHboa3ggo0cE6JEuDNcF4kDFw8XUkZK4jOl-UWpHqeYGvv65vOovfaI-axz3u0Ob5SaV1htW1af3N_kSXOT1pkkq0qiz_BaQDVuABMOt6b3' }} 
                  style={styles.bookCover} 
                />
                <View style={styles.activityInfo}>
                  <View style={styles.activityHeader}>
                    <View>
                      <Text style={styles.bookTitle} numberOfLines={1}>{latestSession.book?.title || latestSession.book_title}</Text>
                      <Text style={styles.sessionMeta}>Reading session • Today</Text>
                    </View>
                    <MaterialIcons name="more-horiz" size={24} color={theme.colors.onSurfaceVariant} />
                  </View>
                  
                  <View style={styles.statsGrid}>
                    <View>
                      <Text style={styles.statLabel}>PAGES</Text>
                      <Text style={styles.statValue}>+{latestSession.pages_read}</Text>
                    </View>
                    <View>
                      <Text style={styles.statLabel}>TIME</Text>
                      <Text style={styles.statValue}>{Math.floor(latestSession.duration_seconds / 60)}m</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Progress Bar placeholder */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '65%' }]} />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressLabel}>CURRENT PROGRESS</Text>
                  <Text style={styles.progressPercentage}>65%</Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.cardAction}>
                  <MaterialIcons name="favorite-border" size={20} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.actionText}>Kudos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cardAction}>
                  <MaterialIcons name="chat-bubble-outline" size={18} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.actionText}>Comment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.cardAction, { marginLeft: 'auto' }]}>
                  <MaterialIcons name="share" size={20} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No recent activity. Start reading!</Text>
            </View>
          )}
        </View>

        {/* Following */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Following</Text>
          <View style={styles.friendCard}>
            <View style={styles.friendHeader}>
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1pfXxEbYCnI9vQXsZDyh2qFB3Bf--1-BKSxbI0humx-jHAEwvIDn7UKmoo_RZRrGE1b-FXDmwUSDHBEe6T3rb4wi6REwg_rpCyA1GXastYmgwI42_DjAjwYBJ7EdZpVWyvxdsgxZPNQ96xuPKv4Ieein0wvZ6QYFfN0Plb58hLxmTjG-w3yqFASnQ5pAYrT_-Kl2AdZTnVtBo7RsIIT8b0YHzzpiuoMLBwQA2Q1uT6V2v8Zleniv6R6ZFDIll0zm-XxD_4Lcu' }} 
                style={styles.friendAvatar} 
              />
              <View>
                <Text style={styles.friendName}>Sarah Chen</Text>
                <Text style={styles.friendAction}>Finished "Atomic Habits"</Text>
              </View>
              <View style={styles.badge}>
                <MaterialIcons name="local-fire-department" size={12} color={theme.colors.tertiary} />
                <Text style={styles.badgeText}>30 DAY CLUB</Text>
              </View>
            </View>
            <View style={styles.friendActivityContent}>
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwB54mEvob2ZAgjnmGtIGD1qk1PwAYxQr9P1n0AW2IGYb3pNGYZefdIkVIaSmvPA-NucSPX3kH7qmk_X3s3Ovi_DrQiy2H4nGl-qco16qtcwxhhFWf5oLc5eNLP0ZpKmTpesKwONXOOVnbc6-YhuBrrU_rfwHo6mQwLXtvuZhzxB8V8HCwMdcBS5-ln0-sXTuKuan_MFwHOqoYGIlXf3q9_IB6hF1MSM8RJztefZbH-wXmf1lAd0_0HR0zMWGDoZ3q98kysmos' }} 
                style={styles.miniBookCover} 
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.friendQuote}>"One of the best books on habit formation I've ever read..."</Text>
                <View style={styles.friendInteractions}>
                  <View style={styles.friendStat}>
                    <MaterialIcons name="favorite" size={14} color={theme.colors.onSurfaceVariant} />
                    <Text style={styles.friendStatText}>12</Text>
                  </View>
                  <View style={styles.friendStat}>
                    <MaterialIcons name="chat-bubble-outline" size={14} color={theme.colors.onSurfaceVariant} />
                    <Text style={styles.friendStatText}>3</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('ManualLog')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color={theme.colors.background} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function StatCard({ label, value, unit }: any) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statCardLabel}>{label}</Text>
      <View style={styles.statCardValueRow}>
        <Text style={styles.statCardValue}>{value}</Text>
        {unit && <Text style={styles.statCardUnit}>{unit}</Text>}
      </View>
    </View>
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  logoText: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  iconButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  statsStrip: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  statsStripContent: {
    paddingHorizontal: theme.spacing.container_margin,
    gap: theme.spacing.md,
  },
  statCard: {
    minWidth: 140,
    height: 128,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  statCardLabel: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
  },
  statCardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statCardValue: {
    ...theme.typography.statsDisplay,
    color: theme.colors.primary,
  },
  statCardUnit: {
    ...theme.typography.labelCaps,
    color: theme.colors.primary,
    paddingBottom: 4,
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
    width: '80%',
  },
  sessionMeta: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  statLabel: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  statValue: {
    ...theme.typography.h3,
    color: theme.colors.primary,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.colors.surfaceContainerHighest,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  progressLabel: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
  },
  progressPercentage: {
    ...theme.typography.labelCaps,
    color: theme.colors.primary,
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    flexDirection: 'row',
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  actionText: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurface,
  },
  friendCard: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: theme.spacing.md,
  },
  friendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  friendName: {
    ...theme.typography.bodyLg,
    color: theme.colors.onSurface,
    fontWeight: 'bold',
  },
  friendAction: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
  },
  badge: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(231, 195, 101, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    ...theme.typography.labelCaps,
    color: theme.colors.tertiary,
    fontSize: 10,
  },
  friendActivityContent: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  miniBookCover: {
    width: 64,
    height: 96,
    borderRadius: 4,
  },
  friendQuote: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  friendInteractions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  friendStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  friendStatText: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
  },
  emptyCard: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.borderRadius.lg,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderStyle: 'dashed',
  },
  emptyText: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 110,
    backgroundColor: theme.colors.primary,
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
