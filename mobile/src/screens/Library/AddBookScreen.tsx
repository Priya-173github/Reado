import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function AddBookScreen() {
  const navigation = useNavigation<any>();
  
  // Form State
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookTotalPages, setNewBookTotalPages] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Search State
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBookData, setSelectedBookData] = useState<any>(null);

  const searchGoogleBooks = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsSearching(true);
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(query)}&maxResults=10`);
      const data = await response.json();
      setSearchResults(data.items || []);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBook = (item: any) => {
    const info = item.volumeInfo;
    setNewBookTitle(info.title);
    setNewBookAuthor(info.authors ? info.authors[0] : 'Unknown Author');
    setNewBookTotalPages(info.pageCount ? info.pageCount.toString() : '');
    setSelectedBookData({
      google_books_id: item.id,
      cover_url: info.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/150x220?text=No+Cover'
    });
    setSearchResults([]);
  };

  const handleStartNewBook = async () => {
    if (!newBookTitle.trim() || !newBookAuthor.trim() || !newBookTotalPages.trim()) {
      Alert.alert('Error', 'Please enter book title, author and total pages');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post('/books/', {
        title: newBookTitle,
        author: newBookAuthor,
        total_pages: parseInt(newBookTotalPages, 10),
        google_books_id: selectedBookData?.google_books_id || `manual_${Date.now()}`,
        cover_url: selectedBookData?.cover_url || 'https://via.placeholder.com/150x220?text=Manual+Entry'
      });
      
      const newBook = response.data;
      
      // Navigate to Timer
      navigation.replace('ReadingTimer', {
        book_id: newBook.book_id,
        book_title: newBook.book.title,
        total_pages: newBook.book.total_pages,
        current_page: newBook.current_page
      });
    } catch (error) {
      console.error('Failed to add book', error);
      Alert.alert('Error', 'Failed to add new book');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Book</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.formGroup}>
          <Text style={styles.label}>BOOK TITLE</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Search by title..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={newBookTitle}
              onChangeText={(text) => {
                setNewBookTitle(text);
                searchGoogleBooks(text);
              }}
            />
            {isSearching && (
              <ActivityIndicator color={theme.colors.primary} style={styles.searchLoader} />
            )}
          </View>

          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.searchResultItem}
                  onPress={() => handleSelectBook(item)}
                >
                  <Image 
                    source={{ uri: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/150x220?text=No+Cover' }} 
                    style={styles.resultCover} 
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultTitle} numberOfLines={1}>{item.volumeInfo.title}</Text>
                    <Text style={styles.resultAuthor} numberOfLines={1}>{item.volumeInfo.authors?.[0] || 'Unknown Author'}</Text>
                    <Text style={styles.resultPages}>{item.volumeInfo.pageCount || '?'} pages</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>AUTHOR</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter author"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={newBookAuthor}
            onChangeText={setNewBookAuthor}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>TOTAL PAGES</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter total pages"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={newBookTotalPages}
            onChangeText={setNewBookTotalPages}
            keyboardType="number-pad"
          />
        </View>

        {selectedBookData && (
          <View style={styles.previewCard}>
            <Image source={{ uri: selectedBookData.cover_url }} style={styles.previewCover} />
            <View style={styles.previewInfo}>
              <Text style={styles.previewLabel}>SELECTED EDITION</Text>
              <Text style={styles.previewTitle} numberOfLines={2}>{newBookTitle}</Text>
              <TouchableOpacity onPress={() => setSelectedBookData(null)}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
          onPress={handleStartNewBook}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={theme.colors.onPrimary} />
          ) : (
            <Text style={styles.submitButtonText}>START TIMER</Text>
          )}
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.onSurface,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
    letterSpacing: 1.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 12,
    padding: 16,
    color: theme.colors.onSurface,
    ...theme.typography.bodyLg,
  },
  searchLoader: {
    position: 'absolute',
    right: 16,
  },
  searchResults: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
    alignItems: 'center',
    gap: 16,
  },
  resultCover: {
    width: 40,
    height: 60,
    borderRadius: 4,
    backgroundColor: theme.colors.surfaceContainerHighest,
  },
  resultTitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
  },
  resultAuthor: {
    ...theme.typography.labelSm,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  resultPages: {
    ...theme.typography.labelSm,
    color: theme.colors.primary,
    marginTop: 4,
  },
  previewCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 16,
  },
  previewCover: {
    width: 50,
    height: 75,
    borderRadius: 4,
  },
  previewInfo: {
    flex: 1,
  },
  previewLabel: {
    ...theme.typography.labelSm,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  previewTitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
  },
  changeText: {
    ...theme.typography.labelSm,
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonText: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
  },
});
