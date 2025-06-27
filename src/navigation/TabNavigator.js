import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import InfoScreen from '../screens/InfoScreen';

import HomeScreen from '../screens/HomeScreen';
import DashboardScreen from '../screens/DashboardScreen';

const Tab = createBottomTabNavigator();

const palette = {
  accent: '#FFCB74',
  primary: '#111111',
};

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: palette.primary,
          borderTopColor: '#444',
          height: 60 + insets.bottom, 
          paddingBottom: insets.bottom + 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontWeight: 'bold',
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardScreen}
        options={{
          title: 'Dasbor Saya',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
      name="InfoTab" 
      component={InfoScreen}
      options={{
        title: 'Info',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="info-outline" color={color} size={size} />
        ),
      }}
    />
    </Tab.Navigator>
  );
}