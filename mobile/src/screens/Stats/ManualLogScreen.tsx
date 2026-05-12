import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Platform,
  StatusBar,
  ActivityIndicator,
  Image,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import api from '../../services/api';
import axios from 'axios';

const { width } = Dimensions.get('window');

export default function ManualLogScreen() {
  const navigation = useNavigation<any>();
  
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [myBooks, setMyBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [pagesRead, setPagesRead] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingLibrary, setFetchingLibrary] = useState(true);

  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date(new Date().getTime() - 30 * 60 * 1000));
  const [endTime, setEndTime] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    try {
      const response = await api.get('/books/');
      setMyBooks(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setFetchingLibrary(false);
    }
  };

  const searchBooks = async (query: string) => {
    if (!query) return;
    setSearching(true);
    try {
      const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=5`);
      const items = response.data.items || [];
      const formatted = items.map((item: any) => ({
        google_books_id: item.id,
        title: item.volumeInfo.title,
        author: item.volumeInfo.authors?.[0] || 'Unknown Author',
        cover_url: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
        total_pages: item.volumeInfo.pageCount,
        isbn: item.volumeInfo.industryIdentifiers?.[0]?.identifier
      }));
      setSearchResults(formatted);
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectNewBook = async (book: any) => {
    setLoading(true);
    try {
      // First add the book to the user's library
      const response = await api.post('/books/', {
        ...book,
        status: 'reading'
      });
      setSelectedBook(response.data);
      setSearchResults([]);
      setSearchQuery('');
      Alert.alert('Book Added', `${book.title} has been added to your library.`);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to add new book to your library.');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(Platform.OS === 'ios');
    if (selectedTime) setStartTime(selectedTime);
  };

  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (selectedTime) setEndTime(selectedTime);
  };

  const handleSave = async () => {
    const pages = parseInt(pagesRead, 10) || 0;

    if (!selectedBook || pages <= 0) {
      Alert.alert('Missing Info', 'Please select a book and enter at least 1 page read.');
      return;
    }

    const startedAt = new Date(date);
    startedAt.setHours(startTime.getHours());
    startedAt.setMinutes(startTime.getMinutes());

    const endedAt = new Date(date);
    endedAt.setHours(endTime.getHours());
    endedAt.setMinutes(endTime.getMinutes());

    if (endedAt <= startedAt) {
      Alert.alert('Invalid Times', 'End time must be after start time.');
      return;
    }

    const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

    setLoading(true);
    try {
      await api.post('/sessions/', {
        book_id: selectedBook.book_id,
        book_title: selectedBook.book.title,
        pages_read: parseInt(pagesRead, 10),
        duration_seconds: durationSeconds,
        notes,
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
      });
      Alert.alert('Success', 'Activity saved successfully!');
      navigation.goBack();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Failed to save activity.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Log activity</Text>

        {/* Mode Selector */}
        <View style={styles.modeToggle}>
          <TouchableOpacity 
            style={[styles.modeBtn, mode === 'existing' && styles.activeModeBtn]} 
            onPress={() => setMode('existing')}
          >
            <Text style={[styles.modeBtnText, mode === 'existing' && styles.activeModeBtnText]}>MY BOOKS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeBtn, mode === 'new' && styles.activeModeBtn]} 
            onPress={() => setMode('new')}
          >
            <Text style={[styles.modeBtnText, mode === 'new' && styles.activeModeBtnText]}>ADD NEW</Text>
          </TouchableOpacity>
        </View>

        {mode === 'existing' ? (
          <View style={styles.field}>
            <Text style={styles.label}>SELECT BOOK</Text>
            {fetchingLibrary ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bookSelector}>
                {myBooks.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.bookCard, selectedBook?.id === item.id && styles.selectedBookCard]}
                    onPress={() => setSelectedBook(item)}
                  >
                    <Image source={{ uri: item.book.cover_url }} style={styles.selectorCover} />
                    <Text style={styles.selectorTitle} numberOfLines={2}>{item.book.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        ) : (
          <View style={styles.field}>
            <Text style={styles.label}>SEARCH NEW BOOK</Text>
            <View style={styles.searchRow}>
              <TextInput 
                style={[styles.input, { flex: 1 }]} 
                placeholder="Search Google Books..." 
                placeholderTextColor={theme.colors.outline}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => searchBooks(searchQuery)}
              />
              <TouchableOpacity style={styles.searchBtn} onPress={() => searchBooks(searchQuery)}>
                {searching ? <ActivityIndicator color="#fff" size="small" /> : <MaterialIcons name="search" size={24} color="#fff" />}
              </TouchableOpacity>
            </View>
            
            {searchResults.length > 0 && (
              <View style={styles.resultsList}>
                {searchResults.map((book) => (
                  <TouchableOpacity key={book.google_books_id} style={styles.resultItem} onPress={() => handleSelectNewBook(book)}>
                    <Image source={{ uri: book.cover_url }} style={styles.resultCover} />
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultTitle} numberOfLines={1}>{book.title}</Text>
                      <Text style={styles.resultAuthor}>{book.author}</Text>
                    </View>
                    <MaterialIcons name="add-circle-outline" size={24} color={theme.colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}


        <View style={styles.field}>
          <Text style={styles.label}>PAGES READ</Text>
          <TextInput 
            style={styles.input} 
            placeholder="How many pages?" 
            placeholderTextColor={theme.colors.outline}
            keyboardType="number-pad" 
            value={pagesRead} 
            onChangeText={setPagesRead}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 12 }]}>
            <Text style={styles.label}>DATE</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
              <MaterialIcons name="calendar-today" size={20} color={theme.colors.primary} />
              <Text style={styles.pickerText}>{formatDate(date)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 12 }]}>
            <Text style={styles.label}>START TIME</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowStartTimePicker(true)}>
              <MaterialIcons name="access-time" size={20} color={theme.colors.primary} />
              <Text style={styles.pickerText}>{formatTime(startTime)}</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>END TIME</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowEndTimePicker(true)}>
              <MaterialIcons name="access-time" size={20} color={theme.colors.primary} />
              <Text style={styles.pickerText}>{formatTime(endTime)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>NOTES (OPTIONAL)</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Share your thoughts..." 
            placeholderTextColor={theme.colors.outline}
            multiline 
            numberOfLines={4} 
            value={notes} 
            onChangeText={setNotes}
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, (loading || !selectedBook) && styles.disabledBtn]} 
          onPress={handleSave}
          disabled={loading || !selectedBook}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>SAVE LOG</Text>}
        </TouchableOpacity>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />
      )}
      {showStartTimePicker && (
        <DateTimePicker value={startTime} mode="time" display="default" onChange={onStartTimeChange} />
      )}
      {showEndTimePicker && (
        <DateTimePicker value={endTime} mode="time" display="default" onChange={onEndTimeChange} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingTop: 40, paddingBottom: 60 },
  header: { ...theme.typography.h1, color: theme.colors.onBackground, marginBottom: 24, fontWeight: '900' },
  
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeModeBtn: {
    backgroundColor: theme.colors.primary,
  },
  modeBtnText: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  activeModeBtnText: {
    color: theme.colors.onPrimary,
  },

  field: { marginBottom: 24 },
  label: { ...theme.typography.labelCaps, color: theme.colors.onSurfaceVariant, marginBottom: 8, fontSize: 10 },
  input: { 
    backgroundColor: theme.colors.surfaceContainerLow, 
    borderWidth: 1, 
    borderColor: theme.colors.outlineVariant, 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 16, 
    color: theme.colors.onSurface 
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  
  bookSelector: { flexDirection: 'row' },
  bookCard: { width: 100, marginRight: 16, alignItems: 'center' },
  selectedBookCard: { opacity: 1, transform: [{ scale: 1.05 }] },
  selectorCover: { width: 80, height: 120, borderRadius: 8, marginBottom: 8 },
  selectorTitle: { ...theme.typography.bodySm, color: theme.colors.onSurface, textAlign: 'center', fontSize: 11 },
  
  searchRow: { flexDirection: 'row', gap: 10 },
  searchBtn: { backgroundColor: theme.colors.primary, width: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  
  resultsList: { marginTop: 12, backgroundColor: theme.colors.surfaceContainerLow, borderRadius: 12, overflow: 'hidden' },
  resultItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant },
  resultCover: { width: 40, height: 60, borderRadius: 4, marginRight: 12 },
  resultInfo: { flex: 1 },
  resultTitle: { ...theme.typography.bodyLg, color: theme.colors.onSurface, fontWeight: 'bold' },
  resultAuthor: { ...theme.typography.bodySm, color: theme.colors.onSurfaceVariant },
  
  selectedIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(2, 211, 138, 0.1)', padding: 12, borderRadius: 8, marginBottom: 24, gap: 8 },
  selectedText: { ...theme.typography.bodySm, color: theme.colors.primary, fontWeight: 'bold' },

  row: { flexDirection: 'row' },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 12,
    padding: 14,
  },
  pickerText: { marginLeft: 8, fontSize: 16, color: theme.colors.onSurface },
  
  saveBtn: { 
    backgroundColor: theme.colors.primary, 
    paddingVertical: 18, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginTop: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  disabledBtn: { backgroundColor: theme.colors.outline, opacity: 0.5 },
  saveBtnText: { ...theme.typography.labelCaps, color: theme.colors.onPrimary, fontSize: 16, fontWeight: '900' }
});
