import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  TextInput,
  StatusBar,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');
const columnWidth = (width - theme.spacing.container_margin * 2 - theme.spacing.md) / 2;

const MOCK_BOOKS = [
  {
    id: '1',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    cover: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0_MXSn8SBWzEO__JK0JKR4PsciizduRLwZoDaOnC9Kh-b1lNCwl0_NLkjZPAVD9Eb4KuF1IzDdbeiLBSeDMdGMhuIn-dyhwr0GOs8Xr-Z_CIb-JnxfJvVt4clFqMFwz9qtyVkCwyXrBb_3KoBVJFnFaGX450-RQHboa3ggo0cE6JEuDNcF4kDFw8XUkZK4jOl-UWpHqeYGvv65vOovfaI-axz3u0Ob5SaV1htW1af3N_kSXOT1pkkq0qiz_BaQDVuABMOt6b3',
    progress: 65,
  },
  {
    id: '2',
    title: 'Atomic Habits',
    author: 'James Clear',
    cover: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwB54mEvob2ZAgjnmGtIGD1qk1PwAYxQr9P1n0AW2IGYb3pNGYZefdIkVIaSmvPA-NucSPX3kH7qmk_X3s3Ovi_DrQiy2H4nGl-qco16qtcwxhhFWf5oLc5eNLP0ZpKmTpesKwONXOOVnbc6-YhuBrrU_rfwHo6mQwLXtvuZhzxB8V8HCwMdcBS5-ln0-sXTuKuan_MFwHOqoYGIlXf3q9_IB6hF1MSM8RJztefZbH-wXmf1lAd0_0HR0zMWGDoZ3q98kysmos',
    progress: 100,
  },
  {
    id: '3',
    title: 'Deep Work',
    author: 'Cal Newport',
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=1000',
    progress: 22,
  },
  {
    id: '4',
    title: 'Zero to One',
    author: 'Peter Thiel',
    cover: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=1000',
    progress: 0,
  }
];

export default function LibraryScreen() {
  const [search, setSearch] = useState('');

  const renderBook = ({ item }: any) => (
    <TouchableOpacity style={styles.bookCard}>
      <View style={styles.coverContainer}>
        <Image source={{ uri: item.cover }} style={styles.cover} />
        {item.progress === 100 && (
          <View style={styles.finishedBadge}>
            <MaterialIcons name="check-circle" size={16} color={theme.colors.tertiary} />
          </View>
        )}
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${item.progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{item.progress}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Library</Text>
        <TouchableOpacity style={styles.addButton}>
          <MaterialIcons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={theme.colors.onSurfaceVariant} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search books..."
          placeholderTextColor={theme.colors.outline}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={MOCK_BOOKS}
        keyExtractor={(item) => item.id}
        renderItem={renderBook}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    marginHorizontal: theme.spacing.container_margin,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    color: theme.colors.onSurface,
    fontSize: 16,
  },
  list: {
    paddingHorizontal: theme.spacing.container_margin,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  bookCard: {
    width: columnWidth,
  },
  coverContainer: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  finishedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 2,
  },
  bookInfo: {
    marginTop: 10,
  },
  bookTitle: {
    ...theme.typography.bodyLg,
    color: theme.colors.onSurface,
    fontWeight: 'bold',
  },
  bookAuthor: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.surfaceContainerHighest,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressText: {
    ...theme.typography.labelCaps,
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
    minWidth: 24,
  }
});
