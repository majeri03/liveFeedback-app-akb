// Lokasi: src/screens/SplashScreen.js

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

const palette = {
  surface: '#FFFFFF',
};

export default function SplashScreen({ navigation }) {
  
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Main'); 
    }, 4000); 

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../assets/animations/splash-animation.json')} 
        autoPlay
        loop={false} 
        style={styles.lottie}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.surface, 
  },
  lottie: {
    width: 250,
    height: 250,
  },
});