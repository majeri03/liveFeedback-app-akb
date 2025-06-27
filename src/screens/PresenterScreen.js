
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { db } from '../firebase/config';
import { doc, getDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { generateRandomName } from '../utils/nameGenerator';

import WordCloudDisplay from '../components/WordCloudDisplay';
import QandADisplay from '../components/QandADisplay';

const palette = {
  surface: '#2F2F2F',
  offWhite: '#F6F6F6',
  accent: '#FFCB74',
  primary: '#111111',
};

const COMMENT_DURATION = 7000;  

export default function PresenterScreen({ route }) {
  const { sessionId, sessionCode } = route.params;
  const [session, setSession] = useState(null);
  const [allEntries, setAllEntries] = useState([]);
  const [liveComments, setLiveComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const addNewLiveComment = useCallback((newEntry) => {
    const commentId = newEntry.id;
    const newComment = {
      id: commentId,
      text: newEntry.text,
      author: generateRandomName(),
    };
    setLiveComments(prev => [newComment, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setLiveComments(prev => prev.filter(comment => comment.id !== commentId));
    }, COMMENT_DURATION);
  }, []);

  useEffect(() => {
    const getSessionDetails = async () => {
      const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
      if (sessionDoc.exists()) {
        setSession(sessionDoc.data());
      }
    };
    getSessionDetails();

    const entriesQuery = query(collection(db, 'sessions', sessionId, 'entries'), orderBy('submittedAt', 'asc'));
    const unsubscribe = onSnapshot(entriesQuery, (querySnapshot) => {
      const entriesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllEntries(entriesData);
      querySnapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          addNewLiveComment({ id: change.doc.id, ...change.doc.data() });
        }
      });
      setLoading(false);
    });
    return () => unsubscribe();
  }, [sessionId, addNewLiveComment]);

  const renderVisualization = () => {
    if (loading || !session) {
      return <ActivityIndicator size="large" color={palette.accent} />;
    }

    switch (session.type) {
      case 'WORD_CLOUD':
        return <WordCloudDisplay entries={allEntries} />;
      case 'Q_AND_A':
        return <QandADisplay entries={allEntries} sessionId={sessionId} />;
      default:
        return <Text style={styles.emptyText}>Tipe sesi tidak dikenal.</Text>;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{session ? session.title : 'Memuat...'}</Text>
      {session?.description && (
        <Text style={styles.descriptionText}>{session.description}</Text>
      )}
      <Text style={styles.subTitle}>Kode Sesi: <Text style={styles.code}>{sessionCode}</Text></Text>
      {session?.type === 'WORD_CLOUD' && session.prompt && (
        <Text style={styles.promptText}>Pertanyaan: "{session.prompt}"</Text>
      )}
      <View style={styles.visualizationContainer}>
        {renderVisualization()}
      </View>

      <View style={styles.liveCommentsContainer}>
        {liveComments.map(comment => (
          <View key={comment.id} style={styles.commentCard}>
            <Text style={styles.commentAuthor}>{comment.author}:</Text>
            <Text style={styles.commentText}>{comment.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.surface, alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: palette.offWhite, textAlign: 'center' },
  subTitle: { fontSize: 16, color: palette.offWhite, marginTop: 10 },
  code: { fontWeight: 'bold', color: palette.accent },
  visualizationContainer: {
    flex: 3,
    width: '100%',
    marginTop: 20,
  },
  liveCommentsContainer: {
    flex: 2,
    width: '100%',
    justifyContent: 'flex-end',
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: palette.primary,
    marginTop: 10
  },
  commentCard: {
    backgroundColor: palette.primary,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  commentAuthor: {
    color: palette.accent,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  commentText: {
    color: palette.offWhite,
    fontSize: 16,
  },
  emptyText: { color: palette.offWhite, fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  promptText: {
  color: '#ccc',
  fontSize: 16,
  fontStyle: 'italic',
  textAlign: 'center',
  marginTop: 10,
  marginBottom: -10,
  },
  descriptionText: {
  color: '#ccc',
  fontSize: 15,
  textAlign: 'center',
  fontStyle: 'italic',
  marginTop: 4,
  marginBottom: 10,
  paddingHorizontal: 10,
},
});