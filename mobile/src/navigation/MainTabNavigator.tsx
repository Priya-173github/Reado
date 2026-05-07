import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReadingTimerScreen from '../screens/ReadingTimerScreen';
import SessionHistoryScreen from '../screens/SessionHistoryScreen';
import EditSessionScreen from '../screens/EditSessionScreen';
import SettingsScreen from '../screens/SettingsScreen';

import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: '#e91e63',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Library') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={SessionHistoryScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function MainTabNavigator() {
  return (
    <Stack.Navigator screenOptions={{ animation: 'slide_from_right' }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="ReadingTimer" component={ReadingTimerScreen} options={{ title: 'Reading Timer' }} />
      <Stack.Screen name="EditSession" component={EditSessionScreen} options={{ title: 'Edit Session' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}
