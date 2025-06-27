import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, FlatList, ActivityIndicator } from 'react-native';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, updateDoc, increment, getDoc } from 'firebase/firestore';

const palette = {
  surface: '#2F2F2F',
  offWhite: '#F6F6F6',
  accent: '#FFCB74',
  primary: '#111111',
};

const QandAView = ({ sessionId }) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const entriesQuery = query(collection(db, 'sessions', sessionId, 'entries'), orderBy('submittedAt', 'desc'));
    const unsubscribe = onSnapshot(entriesQuery, (snapshot) => {
      setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [sessionId]);

  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
  }, [questions]);

  const handleSubmit = async () => {
    if (feedbackText.trim() === '' || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const entriesCollection = collection(db, 'sessions', sessionId, 'entries');
      await addDoc(entriesCollection, {
        text: feedbackText,
        submittedAt: serverTimestamp(),
        upvotes: 0,
        status: 'pending',
      });
      setFeedbackText('');
    } catch (error) {
      Alert.alert("Error", "Gagal mengirim pertanyaan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <View style={styles.inputContainer}>
        <TextInput style={styles.input} placeholder="Ketik pertanyaan Anda..." placeholderTextColor="#888" value={feedbackText} onChangeText={setFeedbackText} />
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
          <Text style={styles.submitButtonText}>{isSubmitting ? "..." : "Kirim"}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={sortedQuestions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <QuestionItem item={item} sessionId={sessionId} />}
        style={{width: '100%', marginTop: 20}}
        ListHeaderComponent={<Text style={styles.listHeader}>Beri suara untuk pertanyaan terpenting:</Text>}
      />
    </>
  );
};

const WordCloudView = ({ sessionId, session}) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (feedbackText.trim() === '' || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const entriesCollection = collection(db, 'sessions', sessionId, 'entries');
      await addDoc(entriesCollection, { text: feedbackText, submittedAt: serverTimestamp() });
      setFeedbackText('');
      Alert.alert("Sukses", "Feedback Anda telah terkirim!");
    } catch (error) { Alert.alert("Error", "Gagal mengirim feedback."); } 
    finally { setIsSubmitting(false); }
  };
  
  return (
    <View style={styles.wordCloudInputContainer}>
      <Text style={styles.promptQuestion}>{session?.prompt || "Sumbangkan kata untuk Word Cloud!"}</Text>
      <TextInput
        style={styles.wordCloudInput}
        placeholder="Ketik ide atau perasaan Anda dalam satu kalimat..."
        placeholderTextColor="#888"
        value={feedbackText}
        onChangeText={setFeedbackText}
        multiline
      />
      <TouchableOpacity style={styles.submitButtonFull} onPress={handleSubmit} disabled={isSubmitting}>
        <Text style={styles.submitButtonText}>{isSubmitting ? "Mengirim..." : "Kirim Feedback"}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function ParticipantScreen({ route }) {
  const { sessionId } = route.params;
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSessionDetails = async () => {
      if (!sessionId) return;
      const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
      if (sessionDoc.exists()) {
        setSession(sessionDoc.data());
      }
      setLoading(false);
    };
    getSessionDetails();
  }, [sessionId]);

  if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" color={palette.accent} /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{session?.title || 'Sesi Feedback'}</Text>
      {session?.type === 'Q_AND_A' ? (
        <QandAView sessionId={sessionId} />
      ) : (
        <WordCloudView sessionId={sessionId} session={session} />
      )}
    </View>
  );
}


const QuestionItem = ({ item, sessionId }) => {
  const [isVoting, setIsVoting] = useState(false);
  const handleUpvote = async () => {
      console.log(`Tombol upvote ditekan untuk item ID: ${item?.id}`);
      
      if (!item || !item.id || !sessionId) {
        console.error("DATA TIDAK LENGKAP UNTUK UPVOTE!", { itemId: item?.id, sessionId });
        Alert.alert("Error Internal", "Data tidak lengkap untuk melakukan upvote.");
        return;
      }

      setIsVoting(true);
      const entryRef = doc(db, 'sessions', sessionId, 'entries', item.id);
      try {
        await updateDoc(entryRef, { upvotes: increment(1) });
      } catch (error) { 
        console.error("Error saat upvoting di Firebase:", error);
      } 
      finally { 
        setIsVoting(false); 
      }
  };
  return (
    <View style={styles.entryCard}>
      <View style={styles.questionSection}>
        <Text style={styles.entryText}>{item.text}</Text>
        <TouchableOpacity style={styles.voteButton} onPress={handleUpvote} disabled={isVoting || !!item.answerText}>
          <Text style={styles.voteButtonText}>👍 {item.upvotes || 0}</Text>
        </TouchableOpacity>
      </View>
      {item.answerText && (
        <View style={styles.answerSection}>
          <Text style={styles.answerAuthor}>Presenter Menjawab:</Text>
          <Text style={styles.answerText}>{item.answerText}</Text>
        </View>
      )}
    </View>
  );
};


// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.surface, paddingTop: 60, paddingHorizontal: 10 },
  title: { fontSize: 32, fontWeight: 'bold', color: palette.offWhite, textAlign: 'center', marginBottom: 20 },
  subTitle: { fontSize: 18, color: palette.offWhite, textAlign: 'center', marginBottom: 20 },
  inputContainer: { flexDirection: 'row', marginBottom: 10, paddingHorizontal: 10 },
  input: { flex: 1, backgroundColor: palette.primary, color: palette.offWhite, borderRadius: 10, padding: 15, fontSize: 16 },
  submitButton: { backgroundColor: palette.accent, padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  submitButtonText: { color: palette.primary, fontSize: 16, fontWeight: 'bold' },
  listHeader: { color: palette.offWhite, fontSize: 16, marginBottom: 10, textAlign: 'center' },
  entryCard: { backgroundColor: palette.primary, padding: 15, borderRadius: 8, marginBottom: 10 },
  questionSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryText: { color: palette.offWhite, fontSize: 16, flex: 1, marginRight: 10 },
  voteButton: { flexDirection: 'row', backgroundColor: palette.surface, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, alignItems: 'center' },
  voteButtonText: { color: palette.accent, fontSize: 16, marginLeft: 5 },
  answerSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#444', paddingTop: 10, backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 10, borderRadius: 5},
  answerAuthor: { color: palette.accent, fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  answerText: { color: palette.offWhite, fontSize: 16 },
  wordCloudInputContainer: { width: '100%', paddingHorizontal: 10 },
  wordCloudInput: {
    backgroundColor: palette.primary,
    color: palette.offWhite,
    height: 150,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
    borderWidth: 1, 
    borderColor: '#555',
  },
  submitButtonFull: { backgroundColor: palette.accent, padding: 20, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  promptQuestion: {
  color: palette.offWhite,
  fontSize: 20,
  textAlign: 'center',
  fontStyle: 'italic',
  marginBottom: 25,
  paddingHorizontal: 10,
  },
});