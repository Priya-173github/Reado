import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import api from '../../services/api';

export default function SessionStarterScreen() {
  const navigation = useNavigation<any>();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/books/');
      setBooks(response.data);
    } catch (error) {
      console.error('Failed to fetch books', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchBooks();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBooks();
  };

  const handleContinueBook = (book: any) => {
    navigation.navigate('ReadingTimer', {
      book_id: book.book_id,
      book_title: book.book.title,
      total_pages: book.book.total_pages,
      current_page: book.current_page
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Start Reading</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* New Book Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NEW SESSION</Text>
          <TouchableOpacity 
            style={styles.newBookButton}
            onPress={() => navigation.navigate('AddBook')}
          >
            <View style={styles.newBookIconContainer}>
              <MaterialIcons name="add" size={32} color={theme.colors.onPrimary} />
            </View>
            <View>
              <Text style={styles.newBookText}>Start New Book</Text>
              <Text style={styles.newBookSubtext}>Search Google Books library</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Continue Reading Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTINUE READING</Text>
          {loading && !refreshing ? (
            <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 20 }} />
          ) : books.length > 0 ? (
            books.map((item) => (
              <View key={item.id} style={styles.bookTile}>
                <Image 
                  source={{ uri: item.book.cover_url || 'https://via.placeholder.com/150x220?text=No+Cover' }} 
                  style={styles.bookCover} 
                />
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle} numberOfLines={1}>{item.book.title}</Text>
                  <Text style={styles.bookAuthor} numberOfLines={1}>{item.book.author}</Text>
                  <View style={styles.progressRow}>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${item.progress_percentage || 0}%` }]} /> 
                    </View>
                    <Text style={styles.progressText}>{item.progress_percentage || 0}%</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.continueButton}
                  onPress={() => handleContinueBook(item)}
                >
                  <MaterialIcons name="play-arrow" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="library-books" size={48} color={theme.colors.outlineVariant} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No books in your library yet.</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AddBook')}>
                <Text style={styles.emptyAction}>Add your first book</Text>
              </TouchableOpacity>
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
    justifyContent: 'center',
    paddingHorizontal: 20,
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.onSurface,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
  },
  content: {
    padding: 20,
    paddingBottom: 100, // For tab bar space
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16,
    letterSpacing: 1.5,
  },
  newBookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainer,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    gap: 16,
  },
  newBookIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBookText: {
    ...theme.typography.h3,
    color: theme.colors.onSurface,
  },
  newBookSubtext: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
  },
  bookTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    marginBottom: 12,
  },
  bookCover: {
    width: 60,
    height: 90,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceContainerHighest,
  },
  bookInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  bookTitle: {
    ...theme.typography.bodyLg,
    color: theme.colors.onSurface,
  },
  bookAuthor: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.surfaceContainerHighest,
    borderRadius: 3,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  progressText: {
    ...theme.typography.labelSm,
    color: theme.colors.onSurfaceVariant,
  },
  continueButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  emptyText: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
  },
  emptyAction: {
    ...theme.typography.labelCaps,
    color: theme.colors.primary,
    marginTop: 12,
    textDecorationLine: 'underline',
  },
});
