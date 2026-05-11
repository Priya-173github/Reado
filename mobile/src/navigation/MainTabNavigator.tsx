import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Platform } from 'react-native';

import HomeScreen from '../screens/Home/HomeScreen';
import LibraryScreen from '../screens/Library/LibraryScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ReadingTimerScreen from '../screens/Record/ReadingTimerScreen';
import SessionStarterScreen from '../screens/Record/SessionStarterScreen';
import AddBookScreen from '../screens/Library/AddBookScreen';
import SessionHistoryScreen from '../screens/Stats/SessionHistoryScreen';
import EditSessionScreen from '../screens/Stats/EditSessionScreen';
import SettingsScreen from '../screens/Profile/SettingsScreen';
import ManualLogScreen from '../screens/Stats/ManualLogScreen';

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
          } else if (route.name === 'Record') {
            iconName = 'add-circle';
          } else if (route.name === 'Activity') {
            iconName = 'leaderboard';
          } else if (route.name === 'Library') {
            iconName = 'book';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          if (route.name === 'Record') {
            return (
              <View style={{ 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: theme.colors.primary,
                width: 56,
                height: 56,
                borderRadius: 18,
                marginTop: -30,
                elevation: 4,
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}>
                <MaterialIcons name="play-arrow" size={36} color={theme.colors.onPrimary} />
              </View>
            );
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
      <Tab.Screen 
        name="Record" 
        component={SessionStarterScreen} 
        options={{ 
          tabBarLabel: () => null,
          title: 'Record',
          tabBarStyle: { display: 'none' }
        }} 
      />
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
      <Stack.Screen name="AddBook" component={AddBookScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ManualLog" component={ManualLogScreen} options={{ title: 'Add Activity' }} />
      <Stack.Screen name="EditSession" component={EditSessionScreen} options={{ title: 'Edit Session' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}
