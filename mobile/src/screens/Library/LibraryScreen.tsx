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
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import api from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const columnWidth = (width - theme.spacing.container_margin * 2 - theme.spacing.md) / 2;

export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<'library' | 'wishlist'>('library');
  const [search, setSearch] = useState('');
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [externalResults, setExternalResults] = useState<any[]>([]);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const cacheRef = React.useRef<Record<string, any>>({});

  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (activeTab === 'wishlist' && search.trim().length >= 3) {
        searchGoogleBooks(search);
      } else if (search.length === 0) {
        setExternalResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, activeTab]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/books/');
      setBooks(response.data);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error('Failed to fetch books', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchBooks();
    }, [])
  );

  const searchGoogleBooks = async (query: string) => {
    try {
      if (cacheRef.current[query]) {
        setExternalResults(cacheRef.current[query]);
        return;
      }
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsSearching(true);
      const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`,
        {
          signal: controller.signal,
        });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      cacheRef.current[query] = data.docs || [];
      setExternalResults(data.docs || []);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error('Search failed', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRemoveBook = async (userBookId: string) => {
    Alert.alert(
      'Remove Book',
      'Are you sure you want to remove this book from your library?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/books/${userBookId}`);
              fetchBooks();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove book');
            }
          }
        }
      ]
    );
  };

  const handleAddToWishlist = async (book: any) => {

    const info = {
      title: book.title,
      authors: book.author_name,
      pageCount: book.number_of_pages_median,
      imageLinks: {
        thumbnail: book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
          : null
      }
    };

    try {

      await api.post('/books/', {
        title: info.title,
        author: info.authors?.[0] || 'Unknown Author',
        total_pages: info.pageCount || 0,
        google_books_id: book.key || `openlib_${Date.now()}`,
        cover_url:
          info.imageLinks.thumbnail ||
          'https://via.placeholder.com/150x220?text=No+Cover',
        status: 'want_to_read'
      });

      Alert.alert('Success', 'Added to Wishlist');

      setSearch('');
      setExternalResults([]);

      fetchBooks();

    } catch (error) {

      Alert.alert('Error', 'Failed to add book');

    }
  };

  const filteredBooks = books.filter(ub =>
    ub.book.title.toLowerCase().includes(search.toLowerCase()) ||
    ub.book.author.toLowerCase().includes(search.toLowerCase())
  );

  const currentlyReading = filteredBooks.filter(ub => ub.status === 'reading');
  const finishedBooks = filteredBooks.filter(ub => ub.status === 'finished');
  const wishlistBooks = filteredBooks.filter(ub => ub.status === 'want_to_read');

  const renderBookItem = ({ item }: any) => (
    <TouchableOpacity style={styles.bookCard}>
      <View style={styles.coverContainer}>
        <Image source={{ uri: item.book.cover_url }} style={styles.cover} />
        {item.status === 'finished' && (
          <View style={styles.finishedBadge}>
            <MaterialIcons name="check-circle" size={16} color={theme.colors.primary} />
          </View>
        )}
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemoveBook(item.id)}
        >
          <MaterialIcons name="delete-outline" size={16} color="#FF4757" />
        </TouchableOpacity>
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={1}>{item.book.title}</Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>{item.book.author}</Text>
        {item.status !== 'want_to_read' && (
          <View style={styles.progressRow}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${item.progress_percentage}%` }]} />
            </View>
            <Text style={styles.progressText}>{item.progress_percentage}%</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderExternalItem = ({ item }: any) => {
    const info = {
      title: item.title,
      authors: item.author_name,
      pageCount: item.number_of_pages_median,
      imageLinks: {
        thumbnail: item.cover_i
          ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
          : null
      }
    };
    return (
      <View style={styles.externalCard}>
        <Image
          source={{ uri: info.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/150x220?text=No+Cover' }}
          style={styles.externalCover}
        />
        <View style={styles.externalInfo}>
          <Text style={styles.externalTitle} numberOfLines={1}>{info.title}</Text>
          <Text style={styles.externalAuthor} numberOfLines={1}>{info.authors?.[0] || 'Unknown'}</Text>
          <TouchableOpacity
            style={styles.addWishlistBtn}
            onPress={() => handleAddToWishlist(item)}
          >
            <MaterialIcons name="bookmark-border" size={18} color={theme.colors.onPrimary} />
            <Text style={styles.addWishlistText}>Wishlist</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Library</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'library' && styles.activeTab]}
            onPress={() => { setActiveTab('library'); setSearch(''); setExternalResults([]); }}
          >
            <Text style={[styles.tabText, activeTab === 'library' && styles.activeTabText]}>My Library</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'wishlist' && styles.activeTab]}
            onPress={() => { setActiveTab('wishlist'); setSearch(''); setExternalResults([]); }}
          >
            <Text style={[styles.tabText, activeTab === 'wishlist' && styles.activeTabText]}>Wishlist</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={theme.colors.onSurfaceVariant} />
        <TextInput
          style={styles.searchInput}
          placeholder={activeTab === 'library' ? "Search library..." : "Search new books..."}
          placeholderTextColor={theme.colors.outline}
          value={search}
          onChangeText={(text) => {
            setSearch(text);
          }}
        />
        {isSearching && <ActivityIndicator size="small" color={theme.colors.primary} />}
      </View>

      {activeTab === 'library' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {currentlyReading.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>CURRENTLY READING</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                {currentlyReading.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.readingCard}>
                    <Image source={{ uri: item.book.cover_url }} style={styles.readingCover} />
                    <View style={styles.readingInfo}>
                      <Text style={styles.readingTitle} numberOfLines={1}>{item.book.title}</Text>
                      <View style={styles.readingProgress}>
                        <View style={styles.progressBarBg}>
                          <View style={[styles.progressBarFill, { width: `${item.progress_percentage}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{item.progress_percentage}%</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionHeader}>FINISHED BOOKS</Text>
            <View style={styles.gridContainer}>
              {finishedBooks.map((item) => (
                <View key={item.id} style={styles.gridItem}>
                  {renderBookItem({ item })}
                </View>
              ))}
              {finishedBooks.length === 0 && (
                <Text style={styles.emptyText}>No finished books yet.</Text>
              )}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {externalResults.length > 0 ? (
            <FlatList
              key="external-results"
              data={externalResults}
              keyExtractor={(item) => item.id}
              renderItem={renderExternalItem}
              contentContainerStyle={styles.externalList}
            />
          ) : (
            <FlatList
              key="wishlist-grid"
              data={wishlistBooks}
              keyExtractor={(item) => item.id}
              renderItem={renderBookItem}
              numColumns={2}
              contentContainerStyle={styles.list}
              columnWrapperStyle={styles.columnWrapper}
              ListHeaderComponent={<Text style={styles.sectionHeader}>MY WISHLIST</Text>}
              ListEmptyComponent={<Text style={styles.emptyText}>Search to add books to your wishlist.</Text>}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.container_margin,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.sm,
  },
  headerTitle: {
    ...theme.typography.h1,
    color: theme.colors.onBackground,
    fontWeight: '900',
    letterSpacing: -1.5,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: theme.colors.surfaceContainerHighest,
  },
  tabText: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    marginHorizontal: theme.spacing.container_margin,
    marginVertical: theme.spacing.md,
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
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
    letterSpacing: 1.5,
    paddingHorizontal: theme.spacing.container_margin,
    marginBottom: 16,
  },
  horizontalList: {
    paddingHorizontal: theme.spacing.container_margin,
    gap: 16,
  },
  readingCard: {
    width: 280,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    gap: 16,
  },
  readingCover: {
    width: 60,
    height: 90,
    borderRadius: 8,
  },
  readingInfo: {
    flex: 1,
  },
  readingTitle: {
    ...theme.typography.h3,
    color: theme.colors.onSurface,
    fontSize: 16,
    marginBottom: 8,
  },
  readingProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.container_margin,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: 20,
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
    aspectRatio: 2 / 3,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  cover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  finishedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 4,
  },
  removeBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 4,
  },
  bookInfo: {
    marginTop: 10,
  },
  bookTitle: {
    ...theme.typography.bodyMd,
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
    fontSize: 9,
    color: theme.colors.onSurfaceVariant,
    minWidth: 24,
  },
  externalList: {
    paddingHorizontal: theme.spacing.container_margin,
    gap: 12,
    paddingBottom: 100,
  },
  externalCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  externalCover: {
    width: 48,
    height: 72,
    borderRadius: 4,
  },
  externalInfo: {
    flex: 1,
  },
  externalTitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    fontWeight: 'bold',
  },
  externalAuthor: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  addWishlistBtn: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  addWishlistText: {
    ...theme.typography.labelCaps,
    color: theme.colors.onPrimary,
    fontSize: 10,
  },
  emptyText: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 40,
  },
});
