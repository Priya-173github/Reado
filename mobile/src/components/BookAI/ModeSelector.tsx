import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChatMode } from '../../types/bookAI.types';
import { COLORS } from '../../screens/BookAI/BookAIChatScreen.styles';

const TABS: { mode: ChatMode; label: string; emoji: string }[] = [
  { mode: 'story',   label: 'Talk to Book', emoji: '💬' },
  { mode: 'suggest', label: 'Similar',       emoji: '📚' },
  { mode: 'analyze', label: 'Analyse',       emoji: '🔍' },
];

interface ModeSelectorProps {
  current: ChatMode;
  onChange: (mode: ChatMode) => void;
}

export const ModeSelector = memo(({ current, onChange }: ModeSelectorProps) => (
  <View style={styles.bar}>
    {TABS.map(tab => {
      const active = tab.mode === current;
      return (
        <TouchableOpacity
          key={tab.mode}
          style={styles.tab}
          activeOpacity={0.7}
          onPress={() => onChange(tab.mode)}
          accessibilityRole="tab"
          accessibilityState={{ selected: active }}
        >
          <Text style={styles.tabEmoji}>{tab.emoji}</Text>
          <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
            {tab.label}
          </Text>
          {active && <View style={styles.indicator} />}
        </TouchableOpacity>
      );
    })}
  </View>
));

ModeSelector.displayName = 'ModeSelector';

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    gap: 5,
    position: 'relative',
  },
  tabEmoji: {
    fontSize: 13,
  },
  tabLabel: {
    fontSize: 12,
    color: COLORS.textDim,
  },
  tabLabelActive: {
    color: COLORS.gold,
    fontWeight: '500',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: COLORS.gold,
    borderRadius: 2,
  },
});
