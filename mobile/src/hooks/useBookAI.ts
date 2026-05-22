import { useState, useRef, useCallback } from 'react';
import { Alert } from 'react-native';

import { ChatMessage, ChatMode, BookMeta, TextChunk, GroqMessage } from '../types/bookAI.types';
import { pickPDF, readPDFAsBase64 } from '../services/ai/pdfExtractor';
import { chunkText, chunkLabel } from '../services/ai/textChunker';
import { retrieve, formatContext } from '../services/ai/retriever';
import api from '../services/api';
import {
  STORY_PROMPT,
  SUGGEST_PROMPT,
  ANALYZE_PROMPT,
} from '../constants/bookAIPrompts';

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export interface UseBookAIReturn {
  // State
  messages: ChatMessage[];
  mode: ChatMode;
  bookMeta: BookMeta | null;
  bookText: string;
  isLoading: boolean;
  isExtracting: boolean;
  pdfBase64: string | null;   // passed to hidden WebView

  // Actions
  handleUploadPress: () => Promise<void>;
  handleExtractedText: (text: string, totalPages: number) => void;
  handleExtractionProgress: (percent: number) => void;
  handleExtractionError: (msg: string) => void;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
}

export function useBookAI(): UseBookAIReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<ChatMode>('story');
  const [bookMeta, setBookMeta] = useState<BookMeta | null>(null);
  const [bookText, setBookText] = useState('');
  const [bookChunks, setBookChunks] = useState<TextChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);

  // Keep a stable ref for chat history (for Groq context window)
  const historyRef = useRef<GroqMessage[]>([]);

  // ─── Upload Flow ───────────────────────────────────────────────────────────

  const handleUploadPress = useCallback(async () => {
    const file = await pickPDF();
    if (!file) return;

    setIsExtracting(true);
    setBookMeta({
      fileName: file.name,
      totalPages: 0,
      totalChunks: 0,
      uploadProgress: 0,
      isReady: false,
    });

    try {
      const base64 = await readPDFAsBase64(file.uri);
      setPdfBase64(base64); // triggers WebView injection
    } catch (e: any) {
      setIsExtracting(false);
      Alert.alert('Error reading file', e.message);
    }
  }, []);

  const handleExtractionProgress = useCallback((percent: number) => {
    setBookMeta(prev =>
      prev ? { ...prev, uploadProgress: percent } : prev,
    );
  }, []);

  const handleExtractedText = useCallback(
    (text: string, totalPages: number) => {
      const chunks = chunkText(text);
      setBookText(text);
      setBookChunks(chunks);
      setIsExtracting(false);
      setPdfBase64(null); // dismiss WebView

      setBookMeta(prev =>
        prev
          ? { ...prev, totalPages, totalChunks: chunks.length, uploadProgress: 100, isReady: true }
          : prev,
      );

      historyRef.current = [];
      setMessages([
        {
          id: uid(),
          role: 'ai',
          text: `I've read every page. Ask me anything — about characters, plot, themes — or switch modes to find similar books.`,
          timestamp: new Date(),
          chunkRef: 'ready',
        },
      ]);
    },
    [],
  );

  const handleExtractionError = useCallback((msg: string) => {
    setIsExtracting(false);
    setPdfBase64(null);
    Alert.alert('Extraction failed', msg);
  }, []);

  // ─── Chat Flow ─────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      if (!bookMeta?.isReady) {
        Alert.alert('No book loaded', 'Please upload a PDF first.');
        return;
      }

      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        text: text.trim(),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMsg]);
      historyRef.current = [
        ...historyRef.current,
        { role: 'user', content: text.trim() },
      ];

      setIsLoading(true);

      try {
        let systemPrompt = '';
        let chunkRef: string | undefined;

        if (mode === 'story') {
          const retrieved = retrieve(text, bookChunks);
          const context = formatContext(retrieved);
          systemPrompt = STORY_PROMPT(context);
          if (retrieved[0]) {
            chunkRef = chunkLabel(retrieved[0].chunk.index);
          }
        } else if (mode === 'suggest') {
          systemPrompt = SUGGEST_PROMPT(bookMeta.fileName.replace('.pdf', ''), bookText);
        } else {
          systemPrompt = ANALYZE_PROMPT(bookMeta.fileName.replace('.pdf', ''), bookText);
        }

        const response = await api.post('/ai/chat', {
          message: text,
          context: systemPrompt,
        });

        const reply = response.data.reply;

        historyRef.current = [
          ...historyRef.current,
          { role: 'assistant', content: reply },
        ];

        const aiMsg: ChatMessage = {
          id: uid(),
          role: 'ai',
          text: reply,
          timestamp: new Date(),
          chunkRef,
        };

        setMessages(prev => [...prev, aiMsg]);
      } catch (e: any) {
        const errMsg: ChatMessage = {
          id: uid(),
          role: 'ai',
          text: `Something went wrong: ${e.message}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [bookChunks, bookMeta, bookText, mode],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    historyRef.current = [];
  }, []);

  return {
    messages,
    mode,
    bookMeta,
    bookText,
    isLoading,
    isExtracting,
    pdfBase64,
    handleUploadPress,
    handleExtractedText,
    handleExtractionProgress,
    handleExtractionError,
    sendMessage,
    clearChat,
  };
}
