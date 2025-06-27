import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Switch, Alert, SafeAreaView , KeyboardAvoidingView, Platform} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { getCreatedSessions } from '../utils/sessionManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase/config';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore'; 
import { MaterialIcons } from '@expo/vector-icons'; 

const palette = {
  surface: '#2F2F2F',
  offWhite: '#F6F6F6',
  accent: '#FFCB74',
  primary: '#111111',
  danger: '#E57373',
  info: '#90CAF9',
  success: '#66BB6A',
};

export default function DashboardScreen({ navigation }) {
  const [mySessions, setMySessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrompt, setNewPrompt] = useState('');

  useEffect(() => {
    if (isFocused) {
      const loadSessions = async () => {
        setLoading(true);
        const sessions = await getCreatedSessions();
        setMySessions(sessions.reverse());
        setLoading(false);
      };
      loadSessions();
    }
  }, [isFocused]);

  const goToPresenterScreen = (session) => {
    navigation.navigate('PresenterSession', {
      sessionId: session.id,
      sessionCode: session.code
    });
  };

  const handleDeleteSession = (sessionToDelete) => {
    Alert.alert(
      "Hapus Sesi Permanen",
      `Anda yakin ingin menghapus sesi "${sessionToDelete.title}"? Aksi ini tidak bisa dibatalkan.`,
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Ya, Hapus", 
          style: "destructive", 
          onPress: async () => {
            try {
              // Hapus dari Firestore
              await deleteDoc(doc(db, "sessions", sessionToDelete.id));
              // Hapus dari state & AsyncStorage
              const updatedSessions = mySessions.filter(s => s.id !== sessionToDelete.id);
              setMySessions(updatedSessions);
              await AsyncStorage.setItem('@MyCreatedSessions', JSON.stringify(updatedSessions));
              Alert.alert("Sukses", "Sesi telah dihapus permanen.");
            } catch (error) {
              console.error("Gagal menghapus sesi: ", error);
              Alert.alert("Error", "Terjadi kesalahan saat menghapus sesi.");
            }
          } 
        }
      ]
    );
  };

  const handleClearHistory = () => {
    Alert.alert(
      "Reset & Hapus Semua Sesi",
      "ANDA YAKIN? Aksi ini akan menghapus SEMUA sesi dari dasbor ini secara PERMANEN dari database.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, Hapus Semua",
          style: "destructive",
          onPress: async () => {
            const sessionsToDelete = [...mySessions];
            try {
              const deletePromises = sessionsToDelete.map(session => deleteDoc(doc(db, "sessions", session.id)));
              await Promise.all(deletePromises);
              await AsyncStorage.removeItem('@MyCreatedSessions');
              setMySessions([]);
              Alert.alert("Sukses", "Semua sesi Anda telah dihapus permanen.");
            } catch (e) {
              Alert.alert("Error", "Gagal menghapus semua sesi.");
            }
          },
        },
      ]
    );
  };
  
  const openEditModal = (session) => {
    setEditingSession(session);
    setNewTitle(session.title);
    setNewDescription(session.description || '');
    setNewPrompt(session.prompt || '');
    setIsEditModalVisible(true);
  };

  const handleUpdateSession = async () => {
    if (!editingSession) return;
    try {
      const sessionRef = doc(db, "sessions", editingSession.id);
      const updatedData = {
        title: newTitle,
        description: newDescription,
      };
      if (editingSession.type === 'WORD_CLOUD') {
        updatedData.prompt = newPrompt;
      }
      await updateDoc(sessionRef, updatedData);

      const updatedSessions = mySessions.map(s => 
        s.id === editingSession.id ? { ...s, ...updatedData } : s
      );
      setMySessions(updatedSessions);
      await AsyncStorage.setItem('@MyCreatedSessions', JSON.stringify(updatedSessions));
      setIsEditModalVisible(false);
      Alert.alert("Sukses", "Detail sesi telah diperbarui.");
    } catch (error) {
      console.error("Gagal update sesi:", error);
      Alert.alert("Error", "Gagal memperbarui sesi.");
    }
  };

  const renderSessionItem = ({ item }) => (
    <View style={styles.sessionCard}>
      <TouchableOpacity style={styles.cardClickableArea} onPress={() => goToPresenterScreen(item)}>
        <Text style={styles.sessionTitle}>{item.title}</Text>
        <View style={styles.typeContainer}>
          <MaterialIcons 
            name={item.type === 'WORD_CLOUD' ? 'cloud-queue' : 'question-answer'} 
            size={16} 
            color={palette.accent} 
          />
          <Text style={styles.sessionType}>{item.type === 'WORD_CLOUD' ? 'Word Cloud' : 'Q & A'}</Text>
        </View>
        <Text style={styles.sessionCode}>Kode: {item.code}</Text>
      </TouchableOpacity>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
          <MaterialIcons name="edit" size={24} color={palette.info} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteSession(item)}>
          <MaterialIcons name="delete-forever" size={24} color={palette.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>Dashboard Sesi</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={palette.accent} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={mySessions}
            renderItem={renderSessionItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.emptyText}>Anda belum membuat sesi dari perangkat ini.</Text>}
            style={{ width: '100%' }}
          />
        )}
        
        {!loading && mySessions.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClearHistory}>
            <Text style={styles.clearButtonText}>Reset Semua Riwayat Lokal</Text>
          </TouchableOpacity>
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={isEditModalVisible}
          onRequestClose={() => setIsEditModalVisible(false)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Edit Sesi</Text>
              <Text style={styles.inputLabel}>Judul Sesi</Text>
              <TextInput style={styles.modalInput} value={newTitle} onChangeText={setNewTitle} />
              <Text style={styles.inputLabel}>Deskripsi Singkat</Text>
              <TextInput style={[styles.modalInput, {height: 80, textAlignVertical: 'top'}]} value={newDescription} onChangeText={setNewDescription} multiline />
              {editingSession?.type === 'WORD_CLOUD' && (
                <>
                  <Text style={styles.inputLabel}>Pertanyaan Pemicu Word Cloud</Text>
                  <TextInput style={styles.modalInput} value={newPrompt} onChangeText={setNewPrompt} />
                </>
              )}
              <TouchableOpacity style={styles.modalButton} onPress={handleUpdateSession}>
                <Text style={styles.modalButtonText}>Simpan Perubahan</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Text style={styles.closeButtonText}>Batal</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.surface , marginTop: 40},
  container: { flex: 1, padding: 20 },
  header: { color: palette.accent, fontSize: 35, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  sessionCard: { backgroundColor: palette.primary, padding: 20, borderRadius: 10, marginBottom: 15, flexDirection: 'row', alignItems: 'center' },
  cardClickableArea: { flex: 1, marginRight: 10 },
  sessionTitle: { color: palette.offWhite, fontSize: 18, fontWeight: 'bold' },
  typeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  sessionType: { color: palette.accent, fontSize: 14, marginLeft: 6 },
  sessionCode: { color: '#999', fontSize: 14, marginTop: 8, fontStyle: 'italic' },
  actionButtons: { flexDirection: 'row' },
  editButton: { padding: 5 },
  deleteButton: { padding: 5 },
  emptyText: { color: '#999', textAlign: 'center', fontStyle: 'italic', marginTop: 50 },
  clearButton: { backgroundColor: palette.danger, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  clearButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' },
  modalContainer: { width: '90%', backgroundColor: palette.surface, padding: 25, borderRadius: 15, borderWidth: 1, borderColor: palette.primary },
  modalTitle: { color: palette.accent, fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  inputLabel: { color: palette.offWhite, marginBottom: 5, marginLeft: 2 },
  modalInput: { backgroundColor: palette.primary, color: palette.offWhite, borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 15 },
  modalButton: { backgroundColor: palette.accent, padding: 15, borderRadius: 10, alignItems: 'center' },
  modalButtonText: { color: palette.primary, fontSize: 18, fontWeight: 'bold' },
  closeButtonText: { color: palette.offWhite, textAlign: 'center', marginTop: 15, padding: 5 },
});