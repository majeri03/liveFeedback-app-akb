// Lokasi: App.js (Versi Final dengan Arsitektur Tab Navigator)

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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
    primary: palette.accent,      // Warna untuk elemen UI aktif (misal: warna badge tab)
    background: palette.surface,  // Warna latar belakang utama layar
    card: palette.primary,        // Warna latar belakang header dan kartu
    text: palette.offWhite,       // Warna teks default
    border: '#444',               // Warna border (misal: garis di atas tab bar)
  },
};

export default function App() {
  return (
    <>
      <NavigationContainer theme={MyTheme}>
        <Stack.Navigator
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