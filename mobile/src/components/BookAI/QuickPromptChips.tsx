import React, { memo } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { ChatMode } from '../../types/bookAI.types';
import { QUICK_PROMPTS } from '../../constants/bookAIPrompts';
import { theme } from '../../styles/theme';

interface QuickPromptChipsProps {
  mode: ChatMode;
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export const QuickPromptChips = memo(
  ({ mode, onSelect, disabled = false }: QuickPromptChipsProps) => {
    const prompts = QUICK_PROMPTS[mode] ?? [];

    return (
      <View style={styles.wrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          keyboardShouldPersistTaps="handled"
        >
          {prompts.map(prompt => (
            <TouchableOpacity
              key={prompt}
              style={[styles.chip, disabled && styles.chipDisabled]}
              onPress={() => !disabled && onSelect(prompt)}
              activeOpacity={0.7}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={prompt}
            >
              <Text style={[styles.chipText, disabled && styles.chipTextDisabled]}>
                {prompt}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  },
);

QuickPromptChips.displayName = 'QuickPromptChips';

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 0.5,
    borderTopColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.background,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 7,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  chipTextDisabled: {
    color: theme.colors.onSurfaceVariant,
  },
});
