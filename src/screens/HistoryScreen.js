import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { getJoinedSessions } from '../utils/sessionManager';

const palette = {
  surface: '#2F2F2F', offWhite: '#F6F6F6', accent: '#FFCB74', primary: '#111111',
};

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      const loadHistory = async () => {
        setLoading(true);
        const sessions = await getJoinedSessions();
        setHistory(sessions.reverse());
        setLoading(false);
      };
      loadHistory();
    }
  }, [isFocused]);

  const rejoinSession = (session) => {
    navigation.navigate('ParticipantSession', { sessionId: session.id });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={palette.accent} />
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => rejoinSession(item)}>
                <View style={styles.sessionCard}>
                  <Text style={styles.sessionTitle}>{item.title}</Text>
                  <Text style={styles.sessionCode}>Kode: {item.sessionCode || item.code}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListHeaderComponent={<Text style={styles.header}>Riwayat Sesi yang Diikuti</Text>}
            ListEmptyComponent={<Text style={styles.emptyText}>Anda belum pernah bergabung ke sesi manapun.</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.surface, marginTop: 40 },
  container: { flex: 1, padding: 20 },
  header: { color: palette.accent, fontSize: 35, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  sessionCard: { backgroundColor: palette.primary, padding: 20, borderRadius: 10, marginBottom: 15 },
  sessionTitle: { color: palette.offWhite, fontSize: 18, fontWeight: 'bold' },
  sessionCode: { color: '#999', fontSize: 14, marginTop: 5 },
  emptyText: { color: '#999', textAlign: 'center', fontStyle: 'italic', marginTop: 40 },
});