import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme'

export function TypingIndicator() {
  const anims = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const makeLoop = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: -5, duration: 280, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(600),
        ]),
      );

    const loops = anims.map((a, i) => makeLoop(a, i * 150));
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, []);

  return (
    <View style={styles.row}>
      <View style={[styles.avatar]}>
        <View style={styles.avatarInner} />
      </View>
      <View style={styles.bubble}>
        <View style={styles.dotsRow}>
          {anims.map((anim, i) => (
            <Animated.View
              key={i}
              style={[styles.dot, { transform: [{ translateY: anim }] }]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 0.5,
    borderColor: theme.colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.primaryContainer,
    opacity: 0.6,
  },
  bubble: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 0.5,
    borderColor: theme.colors.outline,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.onSurfaceVariant,
  },
});
