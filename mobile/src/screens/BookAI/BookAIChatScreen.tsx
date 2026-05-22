import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import WebView from 'react-native-webview';

import { useBookAI } from '../../hooks/useBookAI';
import { ChatBubble } from '../../components/BookAI/ChatBubble';
import { TypingIndicator } from '../../components/BookAI/TypingIndicator';
import { PDFUploadCard } from '../../components/BookAI/PDFUploadCard';
import { QuickPromptChips } from '../../components/BookAI/QuickPromptChips';
import { ChatMessage } from '../../types/bookAI.types';
import { getPDFExtractorHTML, parsePDFMessage } from '../../services/ai/pdfExtractor';
import { theme } from '../../styles/theme';

interface Props {
  navigation?: any; // replace with your navigator type
}

export default function BookAIChatScreen({ navigation }: Props) {
  const {
    messages,
    mode,
    bookMeta,
    isLoading,
    isExtracting,
    pdfBase64,
    handleUploadPress,
    handleExtractedText,
    handleExtractionProgress,
    handleExtractionError,
    sendMessage,
  } = useBookAI();

  const [inputText, setInputText] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  // ─── WebView message handler ───────────────────────────────────────────────
  const onWebViewMessage = useCallback(
    (event: any) => {
      const msg = parsePDFMessage(event.nativeEvent.data);
      if (!msg) return;
      if (msg.type === 'progress') handleExtractionProgress(msg.percent);
      else if (msg.type === 'done') handleExtractedText(msg.text, msg.totalPages);
      else if (msg.type === 'error') handleExtractionError(msg.message);
    },
    [handleExtractedText, handleExtractionError, handleExtractionProgress],
  );

  // ─── Send handler ──────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText('');
    await sendMessage(text);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [inputText, isLoading, sendMessage]);

  const handleChipSelect = useCallback(
    (prompt: string) => {
      setInputText('');
      sendMessage(prompt).then(() =>
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100),
      );
    },
    [sendMessage],
  );

  // ─── Render item ──────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => <ChatBubble message={item} />,
    [],
  );

  const renderFooter = useCallback(
    () => (isLoading ? <TypingIndicator /> : null),
    [isLoading],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  // ─── Injected JS to trigger extraction once base64 is set ────────────────
  const injectedJS = pdfBase64
    ? `window.pdfBase64="${pdfBase64}"; extractPDF(); true;`
    : '';

  // ─── Empty state ──────────────────────────────────────────────────────────
  const ListEmptyComponent = (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateEmoji}>📖</Text>
      <Text style={styles.emptyStateTitle}>Your book awaits</Text>
      <Text style={styles.emptyStateSubtitle}>
        Upload a PDF and start a conversation — ask about characters, plot, themes, or
        find similar reads.
      </Text>
      {!bookMeta && (
        <TouchableOpacity
          style={styles.emptyStateBtn}
          onPress={handleUploadPress}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyStateBtnText}>Upload a Book</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      {/* Hidden WebView for PDF.js extraction */}
      {pdfBase64 && (
        <WebView
          style={styles.hiddenWebView}
          source={{ html: getPDFExtractorHTML() }}
          injectedJavaScript={injectedJS}
          onMessage={onWebViewMessage}
          javaScriptEnabled
          originWhitelist={['*']}
        />
      )}

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={{ fontSize: 20, color: theme.colors.primary }}>‹</Text>
        </TouchableOpacity>

        <View style={styles.bookMetaHead}>
          <Text style={styles.bookName} numberOfLines={1}>
            {bookMeta ? bookMeta.fileName.replace('.pdf', '') : 'BookMind AI'}
          </Text>
          <Text style={styles.bookSub}>
            {bookMeta?.isReady
              ? `${bookMeta.totalPages} pages · ${bookMeta.totalChunks} chunks indexed`
              : 'Upload a book to begin'}
          </Text>
        </View>

        <View style={styles.bookIconWrap}>
          <Text style={{ fontSize: 18 }}></Text>
        </View>
      </View>

      {/* PDF Upload / Progress Banner */}
      <PDFUploadCard
        bookMeta={bookMeta}
        isExtracting={isExtracting}
        onUploadPress={handleUploadPress}
      />

      {/* Chat List */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={ListEmptyComponent}
          ListFooterComponent={renderFooter}
          style={styles.chatList}
          contentContainerStyle={[
            styles.chatListContent,
            messages.length === 0 && { flex: 1 },
          ]}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        {/* Quick Prompt Chips */}
        <QuickPromptChips
          mode={mode}
          onSelect={handleChipSelect}
          disabled={!bookMeta?.isReady || isLoading}
        />

        {/* Input Dock */}
        <View style={styles.inputDock}>
          <View style={styles.inputWrap}>
            <Text style={{ fontSize: 16, color: theme.colors.onSurfaceVariant }}></Text>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask the book anything…"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              editable={bookMeta?.isReady && !isLoading}
              multiline={false}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!bookMeta?.isReady || isLoading || !inputText.trim()) &&
              styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!bookMeta?.isReady || isLoading || !inputText.trim()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Text style={{ fontSize: 17, color: theme.colors.onPrimary }}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.container_margin,
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surface,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookMetaHead: {
    flex: 1,
  },
  bookName: {
    fontSize: 18,
    color: theme.colors.onSurface,
    fontFamily: theme.typography.h3.fontFamily,
    fontWeight: '600',
  },
  bookSub: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  bookIconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBar: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.outline,
    backgroundColor: theme.colors.background,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    gap: 5,
  },
  modeTabText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  modeTabTextActive: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  modeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  uploadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.container_margin,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    gap: 12,
  },
  uploadIconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBannerText: {
    flex: 1,
  },
  uploadFileName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  uploadStatusText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  uploadProgressBar: {
    height: 4,
    backgroundColor: theme.colors.outlineVariant,
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  uploadProgressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  uploadPercentLabel: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  chatList: {
    flex: 1,
    paddingHorizontal: theme.spacing.container_margin,
    paddingTop: theme.spacing.md,
  },
  chatListContent: {
    paddingBottom: 16,
    gap: 14,
  },
  dateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  dateDividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: theme.colors.outline,
  },
  dateDividerText: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: 14,
  },
  emptyStateEmoji: {
    fontSize: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    color: theme.colors.onSurface,
    fontFamily: theme.typography.h3.fontFamily,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyStateBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
  },
  emptyStateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.container_margin,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    gap: 8,
    backgroundColor: theme.colors.surface,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  chipText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  inputDock: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.container_margin,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    gap: 10,
    backgroundColor: theme.colors.surface,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    paddingHorizontal: 14,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.onSurface,
    paddingVertical: 12,
    fontFamily: theme.typography.bodyMd.fontFamily,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  hiddenWebView: {
    width: 0,
    height: 0,
    position: 'absolute',
  },
});
