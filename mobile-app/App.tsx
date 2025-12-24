/**
 * Main App Component
 * Entry point for the React Native application
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import StorageService from './src/services/storageService';

// Screens
import LoginScreen from './src/screens/AuthScreens/LoginScreen';
import RecordingScreen from './src/screens/PatientScreens/RecordingScreen';
import ResultsScreen from './src/screens/PatientScreens/ResultsScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize storage
      await StorageService.initialize();

      // Check authentication
      const token = await SecureStore.getItemAsync('accessToken');
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('App initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null; // Show splash screen
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4CAF50',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Recording"
              component={RecordingScreen}
              options={{ title: 'Voice Recording' }}
            />
            <Stack.Screen
              name="Results"
              component={ResultsScreen}
              options={{ title: 'Analysis Results' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

