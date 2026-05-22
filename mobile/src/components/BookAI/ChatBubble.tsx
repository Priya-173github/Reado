import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '../../types/bookAI.types';
import { theme } from '../../styles/theme';

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble = memo(({ message }: ChatBubbleProps) => {
  const isAI = message.role === 'ai';

  return (
    <View style={[styles.row, isAI ? styles.rowAI : styles.rowUser]}>
      {/* Avatar */}
      <View style={[styles.avatar, isAI ? styles.avatarAI : styles.avatarUser]}>
        <Text style={styles.avatarText}>{isAI ? '📖' : 'U'}</Text>
      </View>

      {/* Bubble */}
      <View style={[styles.bubble, isAI ? styles.bubbleAI : styles.bubbleUser]}>
        {/* Chunk reference badge (AI only) */}
        {isAI && message.chunkRef && message.chunkRef !== 'ready' && (
          <View style={styles.citeBadge}>
            <Text style={styles.citeText}>{message.chunkRef}</Text>
          </View>
        )}

        <Text style={[styles.bubbleText, isAI ? styles.bubbleTextAI : styles.bubbleTextUser]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
});

ChatBubble.displayName = 'ChatBubble';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  rowAI: {
    flexDirection: 'row',
  },
  rowUser: {
    flexDirection: 'row-reverse',
  },

  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarAI: {
    backgroundColor: theme.colors.surface,
    borderWidth: 0.5,
    borderColor: theme.colors.outline,
  },
  avatarUser: {
    backgroundColor: '#2a1f0e',
    borderWidth: 0.5,
    borderColor: '#3a2f1a',
  },
  avatarText: {
    fontSize: 13,
  },

  bubble: {
    maxWidth: '72%',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleAI: {
    backgroundColor: theme.colors.primary,
    borderWidth: 0.5,
    borderColor: theme.colors.outline,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },

  citeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(200,169,110,0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  citeText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontFamily: theme.typography.h3.fontFamily,
  },

  bubbleText: {
    fontSize: 13.5,
    lineHeight: 21,
  },
  bubbleTextAI: {
    color: theme.colors.onSurface,
    fontFamily: theme.typography.fontFamily,
  },
  bubbleTextUser: {
    color: theme.colors.onPrimary,
    fontFamily: theme.typography.fontFamily,
  },
});
