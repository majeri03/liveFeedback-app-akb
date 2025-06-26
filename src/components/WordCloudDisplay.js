// Lokasi: src/components/WordCloudDisplay.js (Versi Manual & Stabil)

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

// Palet warna kita untuk styling
const palette = {
  accent: '#FFCB74',
  offWhite: '#F6F6F6',
};

// Daftar kata umum dalam Bahasa Indonesia yang akan kita abaikan (tetap kita gunakan)
const STOP_WORDS = new Set([
  'di', 'ke', 'dari', 'dan', 'atau', 'tapi', 'jika', 'maka', 'dengan', 'untuk',
  'pada', 'saat', 'seperti', 'yang', 'ini', 'itu', 'adalah', 'ialah', 'sangat',
  'juga', 'hanya', 'sudah', 'belum', 'akan', 'bisa', 'tidak', 'bukan', 'saya',
  'anda', 'dia', 'kita', 'kami', 'kalian', 'mereka', 'ada', 'saja', 'lalu'
]);

export default function WordCloudDisplay({ entries }) {

  // Logika pemrosesan teks ini tetap sama, karena sudah bekerja dengan baik.
  const processedWords = useMemo(() => {
    if (!entries || entries.length === 0) {
      return [];
    }

    const wordFrequencies = new Map();
    entries.forEach(entry => {
      const words = entry.text.toLowerCase().split(/\s+/);
      words.forEach(word => {
        const cleanedWord = word.replace(/[.,!?"'()]/g, '');
        if (cleanedWord && !STOP_WORDS.has(cleanedWord)) {
          const count = wordFrequencies.get(cleanedWord) || 0;
          wordFrequencies.set(cleanedWord, count + 1);
        }
      });
    });
    
    // Kita ubah ke array dan urutkan dari yang paling sering muncul
    return Array.from(wordFrequencies, ([text, value]) => ({ text, value }))
                .sort((a, b) => b.value - a.value);

  }, [entries]);

  if (processedWords.length === 0) {
    return <Text style={styles.emptyText}>Belum ada feedback yang cukup untuk ditampilkan...</Text>
  }
  
  // Ini adalah bagian rendering yang baru
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.wordContainer}>
        {processedWords.map((word) => (
          <Text
            key={word.text}
            style={[
              styles.wordText,
              { 
                fontSize: 12 + (word.value * 4), // Ukuran font berdasarkan frekuensi
                color: word.value > 3 ? palette.accent : palette.offWhite, // Warna berdasarkan frekuensi
                fontWeight: word.value > 3 ? 'bold' : 'normal',
              }
            ]}
          >
            {word.text}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  wordContainer: {
    flexDirection: 'row', // Membuat kata-kata berjajar
    flexWrap: 'wrap',     // Jika tidak muat, akan pindah ke baris baru
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordText: {
    marginHorizontal: 8,
    marginVertical: 4,
  },
  emptyText: {
    color: palette.offWhite,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16
  }
});