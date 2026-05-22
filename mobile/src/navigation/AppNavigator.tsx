import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';

import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';

import SplashScreen from '../screens/Auth/SplashScreen';
import BookAIChatScreen from '../screens/BookAI';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabNavigator}
            />

            <Stack.Screen
              name="BookAIChat"
              component={BookAIChatScreen}
            />
          </>
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}