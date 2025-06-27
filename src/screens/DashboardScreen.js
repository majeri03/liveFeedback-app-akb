// Lokasi: src/screens/DashboardScreen.js

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Switch } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { getSavedSessions, saveSession } from '../utils/sessionManager';
import { Alert } from 'react-native';
import { db } from '../firebase/config';
import { doc, deleteDoc,updateDoc } from 'firebase/firestore'; 
import { MaterialIcons } from '@expo/vector-icons'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const palette = {
  surface: '#2F2F2F',
  offWhite: '#F6F6F6',
  accent: '#FFCB74',
  primary: '#111111',
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
    // Muat data setiap kali layar ini menjadi fokus
    if (isFocused) {
      const loadSessions = async () => {
        setLoading(true);
        const sessions = await getSavedSessions();
        setMySessions(sessions.reverse()); // Tampilkan yang terbaru di atas
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
      `Anda yakin ingin menghapus sesi "${sessionToDelete.title}"? Semua data feedback di dalamnya akan hilang selamanya.`,
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Ya, Hapus Permanen", 
          style: "destructive", 
          onPress: async () => {
            try {
              // 1. Hapus dokumen dari Firestore
              await deleteDoc(doc(db, "sessions", sessionToDelete.id));

              // 2. Hapus dari penyimpanan lokal (AsyncStorage)
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
      "Reset Riwayat & Hapus Semua Sesi",
      "ANDA YAKIN? Aksi ini akan menghapus SEMUA sesi yang Anda buat dari perangkat ini secara PERMANEN dari database.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, Saya Mengerti, Hapus Semua",
          style: "destructive",
          onPress: async () => {
            const sessionsToDelete = [...mySessions]; // Salin daftar sesi sebelum dikosongkan
            try {
              // Hapus semua sesi dari Firestore satu per satu
              const deletePromises = sessionsToDelete.map(session => 
                deleteDoc(doc(db, "sessions", session.id))
              );
              await Promise.all(deletePromises);

              // Hapus dari penyimpanan lokal
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
      
      // 1. Siapkan semua data baru dalam satu objek terlebih dahulu
      const updatedData = {
        title: newTitle,
        description: newDescription,
      };
      
      // 2. Jika ini sesi Word Cloud, tambahkan field 'prompt' ke objek data
      if (editingSession.type === 'WORD_CLOUD') {
        updatedData.prompt = newPrompt;
      }
      
      // 3. Panggil 'updateDoc' HANYA SATU KALI dengan data yang sudah lengkap
      await updateDoc(sessionRef, updatedData);

      // 4. Update state lokal dan AsyncStorage dengan data baru yang sama persis
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
      {/* Bagian yang bisa diklik untuk masuk ke sesi (TIDAK LAGI MENGGUNAKAN flex: 1) */}
      <TouchableOpacity style={styles.cardClickableArea} onPress={() => goToPresenterScreen(item)}>
        <Text style={styles.sessionTitle}>{item.title}</Text>
        <View style={styles.typeContainer}>
          <MaterialIcons name={item.type === 'WORD_CLOUD' ? 'cloud-queue' : 'question-answer'} size={16} color={palette.accent} />
          <Text style={styles.sessionType}>{item.type === 'WORD_CLOUD' ? 'Word Cloud' : 'Q & A'}</Text>
        </View>
        <Text style={styles.sessionCode}>Kode: {item.code}</Text>
      </TouchableOpacity>
      {/* Wadah untuk tombol-tombol aksi */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
          <MaterialIcons name="edit" size={24} color="#90CAF9" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteSession(item)}>
          <MaterialIcons name="archive" size={24} color={palette.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={palette.accent} />
      ) : (
        <FlatList
          data={mySessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.sessionCard}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => goToPresenterScreen(item)}>
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
                  <MaterialIcons name="edit" size={24} color="#90CAF9" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteSession(item)}>
                  <MaterialIcons name="archive" size={24} color="#E57373" />
                </TouchableOpacity>
              </View>
              <Modal
                animationType="slide"
                transparent={true}
                visible={isEditModalVisible}
                onRequestClose={() => setIsEditModalVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Edit Sesi</Text>
                    <Text style={styles.inputLabel}>Judul Sesi</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={newTitle}
                      onChangeText={setNewTitle}
                    />
                    <Text style={styles.inputLabel}>Deskripsi Singkat</Text>
                    <TextInput
                      style={[styles.modalInput, {height: 80, textAlignVertical: 'top'}]}
                      value={newDescription}
                      onChangeText={setNewDescription}
                      multiline
                    />
                    {editingSession?.type === 'WORD_CLOUD' && (
                      <>
                        <Text style={styles.inputLabel}>Pertanyaan Pemicu Word Cloud</Text>
                        <TextInput
                          style={styles.modalInput}
                          value={newPrompt}
                          onChangeText={setNewPrompt}
                        />
                      </>
                    )}
                    <TouchableOpacity style={styles.modalButton} onPress={handleUpdateSession}>
                      <Text style={styles.modalButtonText}>Simpan Perubahan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                      <Text style={styles.closeButtonText}>Batal</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </View>
          )}
          ListHeaderComponent={<Text style={styles.header}>Sesi yang Pernah Anda Buat</Text>}
          ListEmptyComponent={<Text style={styles.emptyText}>Anda belum membuat sesi apapun dari perangkat ini.</Text>}
        />
      )}
        <TouchableOpacity style={styles.clearButton} onPress={handleClearHistory}>
          <Text style={styles.clearButtonText}>Reset Riwayat Lokal</Text>
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.surface, padding: 20 },
    header: { color: palette.accent, fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, marginTop: 30 },
    sessionCard: { backgroundColor: palette.primary, padding: 20, borderRadius: 10, marginBottom: 15 },
    sessionTitle: { color: palette.offWhite, fontSize: 18, fontWeight: 'bold' },
    sessionCode: { color: palette.accent, fontSize: 14, marginTop: 5 },
    emptyText: { color: '#999', textAlign: 'center', fontStyle: 'italic', marginTop: 40 },
    sessionCard: { backgroundColor: palette.primary, padding: 20, borderRadius: 10, marginBottom: 15, flexDirection: 'row', alignItems: 'center' },
    sessionTitle: { color: palette.offWhite, fontSize: 18, fontWeight: 'bold' },
    sessionCode: { color: '#999', fontSize: 14, marginTop: 8 },
    typeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    sessionType: { color: palette.accent, fontSize: 14, marginLeft: 6 },
    deleteButton: { padding: 10, marginLeft: 15 },
     clearButton: {
      backgroundColor: '#B71C1C', 
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 20,
    },
    clearButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
    editButton: { padding: 10 },
    actionButtons: { flexDirection: 'row' },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' },
    modalContainer: { width: '90%', backgroundColor: palette.surface, padding: 25, borderRadius: 15 },
    modalTitle: { color: palette.accent, fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    inputLabel: { color: palette.offWhite, marginBottom: 5, marginLeft: 2 },
    modalInput: { backgroundColor: palette.primary, color: palette.offWhite, borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 15 },
    modalButton: { backgroundColor: palette.accent, padding: 15, borderRadius: 10, alignItems: 'center' },
    modalButtonText: { color: palette.primary, fontSize: 18, fontWeight: 'bold' },
    closeButtonText: { color: palette.offWhite, textAlign: 'center', marginTop: 15, padding: 5 },
});