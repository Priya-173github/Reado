import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

interface AvatarProps {
  uri: string | null;
  size?: number;
  showBadge?: boolean;
  onPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export default function Avatar({ uri, size = 90, showBadge = false, onPress, containerStyle, imageStyle }: AvatarProps) {
  const getAvatarUri = (avatarUrl: string | null) => {
    if (!avatarUrl) return 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
    if (avatarUrl.startsWith('http')) return avatarUrl;
    const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace('/v1', '') || 'http://localhost:8001';
    return `${baseUrl}${avatarUrl}`;
  };

  const Component = onPress ? TouchableOpacity : View;
  
  return (
    <Component onPress={onPress} style={[styles.avatarWrapper, containerStyle]}>
      <Image 
        source={{ uri: getAvatarUri(uri) }} 
        style={[
          styles.avatar, 
          { width: size, height: size, borderRadius: size / 2 },
          imageStyle
        ]} 
      />
      {showBadge && (
        <View style={styles.badge}>
          <MaterialIcons name="bolt" size={12} color="#000" />
        </View>
      )}
    </Component>
  );
}

const styles = StyleSheet.create({
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    borderWidth: 2,
    borderColor: theme.colors.badgeGreen,
    backgroundColor: theme.colors.surfaceContainerHighest,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.badgeGreen,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
});
