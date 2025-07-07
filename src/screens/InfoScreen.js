import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const palette = {
  surface: '#2F2F2F',
  offWhite: '#F6F6F6',
  accent: '#FFCB74',
  primary: '#111111',
};

const currentYear = new Date().getFullYear();

export default function InfoScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <MaterialIcons name="feedback" size={80} color={palette.accent} />
        <Text style={styles.appName}>Live Feedback App</Text>
        <Text style={styles.version}>Versi 1.0.0</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tentang Aplikasi</Text>
          <Text style={styles.description}>
            Aplikasi ini dirancang untuk memfasilitasi sesi umpan balik (feedback) dan tanya jawab secara langsung dan interaktif. Presenter dapat dengan mudah membuat sesi Word Cloud atau Q&A, sementara peserta dapat berpartisipasi secara anonim untuk memberikan masukan yang jujur dan real-time.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tim Pengembang</Text>
          <View style={styles.section}>
            <Text style={styles.developerName}>• Majeri       [105841103622]</Text>
            <Text style={styles.developerName}>• Ali Sulton S Palilati [105841102222]</Text>
            <Text style={styles.developerName}>• Ahmad Fatir [105841102922]</Text>
            <Text style={styles.developerName}>• Siti Marwa [105841100122]</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.copyright}>
            © {currentYear} [Kelompok 1 - dibuat sebagai syarat UTS APLIKASI KOMPUTASI BERGERAK]. All Rights Reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.surface },
  container: { 
    alignItems: 'center', 
    padding: 50 
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: palette.offWhite,
    marginTop: 15,
  },
  version: {
    fontSize: 14,
    color: '#888',
    marginBottom: 40,
  },
  section: {
    width: '100%',
    backgroundColor: palette.primary,
    padding: 20,
    borderRadius: 10,
    marginBottom: 25,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: palette.accent,
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: palette.offWhite,
    textAlign: 'center',
    lineHeight: 24,
  },
  developerName: {
    fontSize: 15,
    color: palette.offWhite,
    marginTop: 10,
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  developerRole: {
    fontSize: 14,
    color: '#aaa',
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 40,
  },
  copyright: {
    fontSize: 12,
    color: palette.offWhite,
    textAlign: 'center',
  },
  
});