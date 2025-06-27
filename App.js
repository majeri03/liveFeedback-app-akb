// Lokasi: App.js (Versi Final dengan Arsitektur Tab Navigator)

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './src/screens/SplashScreen';

// Impor komponen navigasi dan semua layar kita
import MainTabNavigator from './src/navigation/TabNavigator';
import PresenterScreen from './src/screens/PresenterScreen';
import ParticipantScreen from './src/screens/ParticipantScreen';

const Stack = createNativeStackNavigator();

const palette = {
  surface: '#2F2F2F',
  primary: '#111111',
  offWhite: '#F6F6F6',
};

const MyTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: palette.accent,      
    background: palette.surface,  
    card: palette.primary,       
    text: palette.offWhite,      
    border: '#444',              
  },
};

export default function App() {
  return (
    <>
      <NavigationContainer theme={MyTheme}>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerStyle: {
              backgroundColor: palette.primary,
            },
            headerTintColor: palette.offWhite,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            contentStyle: {
              backgroundColor: palette.surface,
            }
          }}
        >
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Main" 
            component={MainTabNavigator} 
            options={{ headerShown: false }} 
          />

          <Stack.Screen 
            name="PresenterSession" 
            component={PresenterScreen}
            options={{ title: 'Dasbor Presenter' }}
          />
          <Stack.Screen 
            name="ParticipantSession" 
            component={ParticipantScreen}
            options={{ title: 'Gabung Sesi' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </>
  );
}