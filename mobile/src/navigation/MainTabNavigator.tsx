import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Platform } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReadingTimerScreen from '../screens/ReadingTimerScreen';
import SessionHistoryScreen from '../screens/SessionHistoryScreen';
import EditSessionScreen from '../screens/EditSessionScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ManualLogScreen from '../screens/ManualLogScreen';

import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surfaceContainerLow,
          borderTopColor: theme.colors.outlineVariant,
          height: Platform.OS === 'ios' ? 88 : 72,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 12,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
          elevation: 0,
        },
        tabBarLabelStyle: {
          ...theme.typography.labelCaps,
          fontSize: 10,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home';
          } else if (route.name === 'Activity') {
            iconName = 'leaderboard';
          } else if (route.name === 'Library') {
            iconName = 'book';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons 
                name={iconName} 
                size={28} 
                color={color} 
                style={focused ? { opacity: 1 } : { opacity: 0.7 }}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Activity" component={SessionHistoryScreen} options={{ title: 'Stats' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function MainTabNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        animation: 'slide_from_right',
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.onBackground,
        headerTitleStyle: { ...theme.typography.h3 },
        contentStyle: { backgroundColor: theme.colors.background }
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="ReadingTimer" component={ReadingTimerScreen} options={{ title: 'Reading Timer' }} />
      <Stack.Screen name="ManualLog" component={ManualLogScreen} options={{ title: 'Add Activity' }} />
      <Stack.Screen name="EditSession" component={EditSessionScreen} options={{ title: 'Edit Session' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}
