import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal, Switch, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { db } from './src/firebase/config';
import { collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';

import PresenterScreen from './src/screens/PresenterScreen';
import ParticipantScreen from './src/screens/ParticipantScreen';

const palette = {
  surface: '#2F2F2F',
  offWhite: '#F6F6F6',
  accent: '#FFCB74',
  primary: '#111111',
};

export default function App() {
  const [screen, setScreen] = useState('home');
  const [sessionId, setSessionId] = useState(null);
  const [sessionCode, setSessionCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [sessionTypeToCreate, setSessionTypeToCreate] = useState(null);

  // State baru untuk menampung daftar sesi publik
  const [publicSessions, setPublicSessions] = useState([]);
  const [isFetchingPublic, setIsFetchingPublic] = useState(true);

  // useEffect untuk mengambil daftar sesi publik secara real-time
  useEffect(() => {
    // Hanya jalankan jika kita berada di layar home
    if (screen === 'home') {
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where("isPublic", "==", true),
        where("isActive", "==", true),
        orderBy("createdAt", "desc")
      );

      // onSnapshot akan membuat listener real-time
      const unsubscribe = onSnapshot(sessionsQuery, (querySnapshot) => {
        const sessionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPublicSessions(sessionsData);
        setIsFetchingPublic(false);
      });

      // Membersihkan listener saat komponen tidak lagi ditampilkan
      return () => unsubscribe();
    }
  }, [screen]); // Dijalankan kembali setiap kali nilai 'screen' berubah

  const openCreateModal = (sessionType) => {
    setSessionTypeToCreate(sessionType);
    setCreateModalVisible(true);
  };

  const handleCreateSession = async () => { /* ... kode ini tidak berubah ... */
    if (sessionTitle.trim() === '') { Alert.alert("Judul Kosong", "Silakan masukkan judul untuk sesi Anda."); return; }
    setIsLoading(true); setCreateModalVisible(false);
    try {
      const code = Math.random().toString(36).substring(2, 7).toUpperCase();
      const sessionRef = await addDoc(collection(db, 'sessions'), {
        title: sessionTitle, type: sessionTypeToCreate, sessionCode: code, isActive: true, isPublic: isPublic, createdAt: serverTimestamp(),
      });
      setSessionId(sessionRef.id); setSessionCode(code); setScreen('presenter');
    } catch (error) { Alert.alert("Error", "Gagal membuat sesi baru."); } 
    finally { setIsLoading(false); setSessionTitle(''); setIsPublic(false); }
  };

  const handleJoinSession = async () => { /* ... kode ini tidak berubah ... */
    if (joinCode.trim() === '') { Alert.alert("Input Kosong", "Silakan masukkan kode sesi."); return; }
    setIsLoading(true);
    try {
      const q = query(collection(db, 'sessions'), where("sessionCode", "==", joinCode.toUpperCase()));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        Alert.alert("Sesi Tidak Ditemukan", "Kode sesi tidak valid atau sesi sudah tidak aktif.");
      } else {
        const sessionDoc = querySnapshot.docs[0];
        setSessionId(sessionDoc.id); setScreen('participant');
      }
    } catch (error) { Alert.alert("Error", "Gagal bergabung ke sesi."); } 
    finally { setIsLoading(false); }
  };
  
  // Fungsi baru untuk bergabung dari daftar publik
  const handleJoinPublicSession = (session) => {
    setSessionId(session.id);
    setScreen('participant');
  };

  if (screen === 'presenter') return <PresenterScreen sessionId={sessionId} sessionCode={sessionCode} />;
  if (screen === 'participant') return <ParticipantScreen sessionId={sessionId} />;

  return (
    <View style={styles.container}>
      <View style={styles.privateSection}>
        <Text style={styles.title}>Live Feedback App</Text>
        <TouchableOpacity style={styles.button} onPress={() => openCreateModal('WORD_CLOUD')}>
          <Text style={styles.buttonText}>Buat Sesi Word Cloud</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => openCreateModal('Q_AND_A')}>
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Buat Sesi Q&A</Text>
        </TouchableOpacity>
        <Text style={styles.separator}>atau</Text>
        <TextInput style={styles.input} placeholder="Masukkan Kode Sesi" placeholderTextColor="#888" value={joinCode} onChangeText={setJoinCode} autoCapitalize="characters" />
        <TouchableOpacity style={styles.button} onPress={handleJoinSession}>
          <Text style={styles.buttonText}>Gabung dengan Kode</Text>
        </TouchableOpacity>
      </View>
      
      {isLoading && <ActivityIndicator size="large" color={palette.accent} />}

      {/* Bagian Baru: Daftar Sesi Publik */}
      <View style={styles.publicSection}>
        <Text style={styles.publicTitle}>Sesi Publik Aktif</Text>
        {isFetchingPublic ? (
          <ActivityIndicator color={palette.accent} />
        ) : (
          <FlatList
            data={publicSessions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleJoinPublicSession(item)}>
                <View style={styles.publicCard}>
                  <Text style={styles.publicCardTitle}>{item.title}</Text>
                  <Text style={styles.publicCardType}>Tipe: {item.type}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Tidak ada sesi publik yang aktif saat ini.</Text>}
          />
        )}
      </View>
      
      {/* Modal untuk Membuat Sesi */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCreateModalVisible}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Detail Sesi</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Masukkan Judul Sesi..."
              placeholderTextColor="#888"
              value={sessionTitle}
              onChangeText={setSessionTitle}
            />
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Jadikan Sesi Ini Publik?</Text>
              <Switch
                trackColor={{ false: "#767577", true: palette.primary }}
                thumbColor={isPublic ? palette.accent : "#f4f3f4"}
                onValueChange={setIsPublic}
                value={isPublic}
              />
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={handleCreateSession}>
              <Text style={styles.modalButtonText}>Buat Sesi & Mulai</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
              <Text style={styles.closeButtonText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
        <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 60 },
    privateSection: { width: '100%', alignItems: 'center', paddingHorizontal: 20 },
    title: { fontSize: 36, fontWeight: 'bold', color: palette.offWhite, marginBottom: 30, textAlign: 'center' },
    button: { backgroundColor: palette.accent, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 10, width: '100%', alignItems: 'center', marginVertical: 8 },
    buttonSecondary: { backgroundColor: palette.primary, borderWidth: 2, borderColor: palette.accent }, 
    buttonText: { color: palette.primary, fontSize: 18, fontWeight: 'bold' },
    buttonTextSecondary: { color: palette.accent },
    separator: { color: palette.offWhite, fontSize: 16, marginVertical: 10 },
    input: { backgroundColor: palette.primary, color: palette.offWhite, width: '100%', padding: 15, borderRadius: 10, fontSize: 18, textAlign: 'center', letterSpacing: 3, marginVertical: 8 },
    
    // Public Section Styles
    publicSection: { flex: 1, width: '100%', marginTop: 20, borderTopWidth: 1, borderTopColor: palette.primary, paddingHorizontal: 20 },
    publicTitle: { color: palette.accent, fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginVertical: 15 },
    publicCard: { backgroundColor: palette.primary, padding: 20, borderRadius: 10, marginBottom: 10 },
    publicCardTitle: { color: palette.offWhite, fontSize: 18, fontWeight: 'bold' },
    publicCardType: { color: palette.offWhite, fontSize: 14, opacity: 0.7, marginTop: 4 },
    emptyText: { color: '#999', textAlign: 'center', fontStyle: 'italic', marginTop: 20 },
    
    // Modal Styles
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' },
    modalContainer: { width: '90%', backgroundColor: palette.surface, padding: 25, borderRadius: 15, borderWidth: 1, borderColor: palette.primary },
    modalTitle: { color: palette.accent, fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    modalInput: { backgroundColor: palette.primary, color: palette.offWhite, borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 20 },
    switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    switchLabel: { color: palette.offWhite, fontSize: 16 },
    modalButton: { backgroundColor: palette.accent, padding: 15, borderRadius: 10, alignItems: 'center' },
    modalButtonText: { color: palette.primary, fontSize: 18, fontWeight: 'bold' },
    closeButtonText: { color: palette.offWhite, textAlign: 'center', marginTop: 15, padding: 5 },
});