import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const palette = {
  accent: '#FFCB74',
  offWhite: '#F6F6F6',
};

const STOP_WORDS = new Set([
  'di', 'ke', 'dari', 'dan', 'atau', 'tapi', 'jika', 'maka', 'dengan', 'untuk',
  'pada', 'saat', 'seperti', 'yang', 'ini', 'itu', 'adalah', 'ialah', 'sangat',
  'juga', 'hanya', 'sudah', 'belum', 'akan', 'bisa', 'tidak', 'bukan', 'saya',
  'anda', 'dia', 'kita', 'kami', 'kalian', 'mereka', 'ada', 'saja', 'lalu', 'sih', 'bagaimana'
]);

export default function WordCloudDisplay({ entries }) {

  const processedWords = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    const wordFrequencies = new Map();
    entries.forEach(entry => {
      if (!entry.text) return; 
      const words = entry.text.toLowerCase().split(/\s+/);
      words.forEach(word => {
        const cleanedWord = word.replace(/[.,!?"'()]/g, '');
        if (cleanedWord && !STOP_WORDS.has(cleanedWord)) {
          const count = wordFrequencies.get(cleanedWord) || 0;
          wordFrequencies.set(cleanedWord, count + 1);
        }
      });
    });
    return Array.from(wordFrequencies, ([text, value]) => ({ text, value }))
                .sort((a, b) => b.value - a.value);
  }, [entries]);

  if (processedWords.length === 0) {
    return <Text style={styles.emptyText}>Belum ada feedback yang cukup...</Text>
  }
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.wordContainer}>
        {processedWords.map((word) => (
          <Text
            key={word.text}
            style={[
              styles.wordText,
              { 
                fontSize: 12 + (word.value * 4),
                color: word.value > 2 ? palette.accent : palette.offWhite,
                fontWeight: word.value > 2 ? 'bold' : 'normal',
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
    flexDirection: 'row', 
    flexWrap: 'wrap',     
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