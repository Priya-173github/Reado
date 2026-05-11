import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  valueColor?: string;
  unitColor?: string;
  style?: object;
}

export default function StatCard({ label, value, unit, valueColor = theme.colors.primary, unitColor, style }: StatCardProps) {
  return (
    <View style={[styles.statCard, style]}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
        {unit && <Text style={[styles.statUnit, { color: unitColor || valueColor }]}> {unit}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  statLabel: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: 'row', 
    alignItems: 'baseline'
  },
  statValue: {
    ...theme.typography.statsDisplay,
    fontSize: 32,
    lineHeight: 36,
  },
  statUnit: {
    ...theme.typography.labelCaps,
    marginLeft: 4,
  },
});
