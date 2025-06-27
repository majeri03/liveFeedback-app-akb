import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { db } from '../firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const palette = {
  accent: '#FFCB74',
  offWhite: '#F6F6F6',
  primary: '#111111',
  surface: '#2F2F2F',
  success: '#66BB6A',
};

export default function QandADisplay({ entries, sessionId }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedEntries = useMemo(() => {
    if (!entries) return [];
    return [...entries].sort((a, b) => {
      if (a.answerText && !b.answerText) return 1;
      if (!a.answerText && b.answerText) return -1;
      return (b.upvotes || 0) - (a.upvotes || 0);
    });
  }, [entries]);

  const handleOpenAnswerModal = (question) => {
    setSelectedQuestion(question);
    setModalVisible(true);
  };

  const handleSendAnswer = async () => {
    if (!selectedQuestion || answerText.trim() === '') return;
    setIsSubmitting(true);
    const entryRef = doc(db, 'sessions', sessionId, 'entries', selectedQuestion.id);
    try {
      await updateDoc(entryRef, {
        answerText: answerText,
        answeredAt: serverTimestamp(),
        status: 'answered',
      });
      setModalVisible(false);
      setAnswerText('');
      setSelectedQuestion(null);
    } catch (error) {
      console.error("Error sending answer:", error);
      Alert.alert("Error", "Gagal mengirim jawaban.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{flex: 1}}>
      <FlatList
        data={sortedEntries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleOpenAnswerModal(item)}>
            <View style={[styles.entryCard, item.answerText && styles.entryCardAnswered]}>
              <View style={{flex: 1}}>
                <Text style={styles.entryText}>{item.text}</Text>
                {item.answerText && <Text style={styles.answerIndicator}>✓ Sudah Dijawab</Text>}
              </View>
              <View style={styles.voteContainer}>
                <Text style={styles.voteIcon}>👍</Text>
                <Text style={styles.voteCount}>{item.upvotes || 0}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Belum ada pertanyaan dari audiens...</Text>}
        contentContainerStyle={{ paddingTop: 10 }}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Balas Pertanyaan</Text>
            <Text style={styles.modalQuestion}>{selectedQuestion?.text}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ketik jawaban Anda di sini..."
              placeholderTextColor="#888"
              value={answerText}
              onChangeText={setAnswerText}
              multiline
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleSendAnswer} disabled={isSubmitting}>
              <Text style={styles.modalButtonText}>{isSubmitting ? 'Mengirim...' : 'Kirim Jawaban'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  entryCard: { backgroundColor: palette.primary, padding: 15, borderRadius: 8, marginBottom: 10, marginHorizontal: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryCardAnswered: { opacity: 0.7, backgroundColor: '#222' },
  entryText: { color: palette.offWhite, fontSize: 16, flex: 1, marginRight: 10 },
  voteContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.surface, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 15 },
  voteIcon: { fontSize: 16 },
  voteCount: { color: palette.accent, fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  answerIndicator: { color: palette.success, fontSize: 12, fontStyle: 'italic', marginTop: 8 },
  emptyText: { color: palette.offWhite, fontStyle: 'italic', textAlign: 'center', marginTop: 50, fontSize: 16 },
  
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContainer: { backgroundColor: palette.surface, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { color: palette.accent, fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  modalQuestion: { color: palette.offWhite, fontSize: 16, fontStyle: 'italic', marginBottom: 20, padding: 10, borderWidth: 1, borderColor: palette.primary, borderRadius: 5 },
  modalInput: { backgroundColor: palette.primary, color: palette.offWhite, height: 120, borderRadius: 10, padding: 15, fontSize: 16, textAlignVertical: 'top', marginBottom: 20 },
  modalButton: { backgroundColor: palette.accent, padding: 15, borderRadius: 10, alignItems: 'center' },
  modalButtonText: { color: palette.primary, fontSize: 18, fontWeight: 'bold' },
  closeButtonText: { color: palette.offWhite, textAlign: 'center', marginTop: 15, padding: 5 },
});