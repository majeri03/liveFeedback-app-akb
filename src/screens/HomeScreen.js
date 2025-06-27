import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView, Alert, Modal, Switch } from 'react-native';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import { getCreatedSessions, saveCreatedSession, saveJoinedSession, getJoinedSessions } from '../utils/sessionManager';

const palette = {
  surface: '#2F2F2F', 
  offWhite: '#F6F6F6',
  accent: '#FFCB74',
  primary: '#111111',
};

export default function HomeScreen({ navigation }) {
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const [publicSessions, setPublicSessions] = useState([]);
  const [isFetchingPublic, setIsFetchingPublic] = useState(true);

  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [promptQuestion, setPromptQuestion] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [sessionTypeToCreate, setSessionTypeToCreate] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where("isPublic", "==", true),
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPublicSessions(sessionsData);
      setIsFetchingPublic(false);
    }, (error) => {
      console.error("Error fetching public sessions: ", error);
      setIsFetchingPublic(false);
    });
    return () => unsubscribe();
  }, []);

  const openCreateModal = (sessionType) => {
    setSessionTypeToCreate(sessionType);
    setCreateModalVisible(true);
  };

  const handleCreateSession = async () => {
    if (sessionTitle.trim() === '') { Alert.alert("Judul Kosong", "Silakan masukkan judul untuk sesi Anda."); return; }
    setIsCreating(true);
    setCreateModalVisible(false);
    try {
      const code = Math.random().toString(36).substring(2, 7).toUpperCase();
      const sessionData = { title: sessionTitle, sessionCode: code, type: sessionTypeToCreate, isActive: true, isPublic: isPublic, prompt: promptQuestion, description: sessionDescription, createdAt: serverTimestamp() };
      const sessionRef = await addDoc(collection(db, 'sessions'), sessionData);
      
      await saveCreatedSession({ id: sessionRef.id, title: sessionTitle, code: code,  type: sessionTypeToCreate, });
      
      navigation.navigate('PresenterSession', { sessionId: sessionRef.id, sessionCode: code });
    } catch (error) { Alert.alert("Error", "Gagal membuat sesi baru."); } 
    finally {
      setIsCreating(false);
      setSessionTitle('');
      setIsPublic(false);
      setPromptQuestion(''); 
      setSessionDescription(''); 
    }
  };

  const checkOwnershipAndNavigate = async (session) => {
    try {
      const savedSessions = await getCreatedSessions();
      const isOwner = savedSessions.some(s => s.id === session.id);

      if (isOwner) {
        navigation.navigate('PresenterSession', { 
          sessionId: session.id, 
          sessionCode: session.sessionCode 
        });
      } else {
        openInfoModal(session);
      }
    } catch (e) {
      console.error("Gagal memeriksa kepemilikan sesi:", e);
      openInfoModal(session);
    }
  };
  const handleJoinWithCode = async () => {
    if (joinCode.trim() === '') { Alert.alert("Input Kosong", "Silakan masukkan kode sesi."); return; }
    setIsJoining(true);
    try {
      const q = query(collection(db, 'sessions'), where("sessionCode", "==", joinCode.toUpperCase()));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        Alert.alert("Sesi Tidak Ditemukan", "Kode sesi tidak valid atau sesi sudah tidak aktif.");
      } else {
        const sessionDoc = querySnapshot.docs[0];
        //navigation.navigate('ParticipantSession', { sessionId: sessionDoc.id });
         await checkOwnershipAndNavigate({ id: sessionDoc.id, ...sessionDoc.data() });
      }
    } catch (error) { Alert.alert("Error", "Gagal bergabung ke sesi."); } 
    finally { setIsJoining(false); }
  };
  
  const handleJoinPublicSession = (session) => {
    openInfoModal({ id: sessionDoc.id, ...sessionDoc.data() });
  };


  const openInfoModal = (session) => {
    setSelectedSession(session);
    setInfoModalVisible(true);
  };

  const handleJoinFromModal =  async () => {
    if (!selectedSession) return;
    await saveJoinedSession(selectedSession);
    setInfoModalVisible(false);
    navigation.navigate('ParticipantSession', { sessionId: selectedSession.id });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.privateSection}>
          <Text style={styles.title}>Live Feedback</Text>
          
          <TouchableOpacity style={styles.button} onPress={() => openCreateModal('WORD_CLOUD')}>
            <MaterialIcons name="cloud-queue" size={24} color={palette.primary} />
            <Text style={styles.buttonText}>Buat Sesi Word Cloud</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => openCreateModal('Q_AND_A')}>
            <MaterialIcons name="question-answer" size={24} color={palette.accent} />
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Buat Sesi Q&A</Text>
          </TouchableOpacity>

          <Text style={styles.separator}>atau</Text>
          
          <View style={styles.joinCodeContainer}>
            <TextInput style={styles.input} placeholder="Masukkan Kode Sesi" placeholderTextColor="#888" value={joinCode} onChangeText={setJoinCode} autoCapitalize="characters" />
            <TouchableOpacity style={styles.joinButton} onPress={handleJoinWithCode}>
              {isJoining ? <ActivityIndicator color={palette.primary} /> : <Text style={styles.joinButtonText}>Gabung</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.publicSection}>
          <Text style={styles.publicTitle}>Sesi Publik Aktif</Text>
          {isFetchingPublic ? (
            <ActivityIndicator color={palette.accent} />
          ) : (
            <FlatList
              data={publicSessions}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => checkOwnershipAndNavigate(item)}>
                  <View style={styles.publicCard}>
                    <Text style={styles.publicCardTitle}>{item.title}</Text>
                    <Text style={styles.publicCardType}>Tipe: {item.type}</Text>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={<Text style={styles.emptyText}>Tidak ada sesi publik saat ini.</Text>}
            />
          )}
        </View>
      </View>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCreateModalVisible}
        onRequestClose={() => setCreateModalVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer_light}> 
            <Text style={styles.modalTitle_light}>Detail Sesi Baru</Text>
            
            <Text style={styles.inputLabel_light}>Judul Sesi</Text>
            <TextInput style={styles.modalInput_light} placeholder="Ketik judul di sini..." placeholderTextColor="#888" value={sessionTitle} onChangeText={setSessionTitle} />
            
            <Text style={styles.inputLabel_light}>Deskripsi Singkat (Opsional)</Text>
            <TextInput style={[styles.modalInput_light, {height: 80, textAlignVertical: 'top'}]} placeholder="Jelaskan tujuan sesi ini..." placeholderTextColor="#888" value={sessionDescription} onChangeText={setSessionDescription} multiline/>
            
            {sessionTypeToCreate === 'WORD_CLOUD' && (
              <>
                <Text style={styles.inputLabel_light}>Pertanyaan untuk Audiens</Text>
                <TextInput style={styles.modalInput_light} placeholder="Contoh: Satu kata untuk hari ini?" placeholderTextColor="#888" value={promptQuestion} onChangeText={setPromptQuestion} />
              </>
            )}

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel_light}>Jadikan Sesi Ini Publik?</Text>
              <Switch trackColor={{ false: "#767577", true: '#ccc' }} thumbColor={isPublic ? palette.accent : "#f4f3f4"} onValueChange={setIsPublic} value={isPublic}/>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={handleCreateSession} disabled={isCreating}>
              <Text style={styles.modalButtonText}>{isCreating ? 'Membuat...' : 'Buat Sesi & Mulai'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)} disabled={isCreating}>
              <Text style={styles.closeButtonText_light}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={infoModalVisible}
        onRequestClose={() => setInfoModalVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{selectedSession?.title}</Text>
            <Text style={styles.infoDescription}>
              {selectedSession?.description || 'Tidak ada deskripsi untuk sesi ini.'}
            </Text>
            {selectedSession?.type === 'WORD_CLOUD' && selectedSession?.prompt && (
              <View style={styles.promptContainer}>
                <Text style={styles.promptLabel}>Pertanyaan Sesi:</Text>
                <Text style={styles.promptText}>"{selectedSession.prompt}"</Text>
              </View>
            )}
            <TouchableOpacity style={styles.modalButton} onPress={handleJoinFromModal}>
              <Text style={styles.modalButtonText}>Lanjutkan & Gabung Sesi</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setInfoModalVisible(false)}>
              <Text style={styles.closeButtonText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.surface },
  container: { flex: 1 },
  privateSection: { width: '100%', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: palette.primary },
  title: { fontSize: 60, fontWeight: 'bold', color: palette.offWhite, marginBottom: 15, textAlign: 'center', marginTop: 50},
  button: { flexDirection: 'row', backgroundColor: palette.accent, paddingVertical: 15, borderRadius: 10, width: '100%', alignItems: 'center', justifyContent: 'center', marginVertical: 6 },
  buttonSecondary: { backgroundColor: palette.primary, borderWidth: 2, borderColor: palette.accent }, 
  buttonText: { color: palette.primary, fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  buttonTextSecondary: { color: palette.accent },
  dashboardButton: { flexDirection: 'row', paddingVertical: 10, alignItems: 'center', justifyContent: 'center', marginVertical: 6 },
  dashboardButtonText: { color: palette.offWhite, fontSize: 16, marginLeft: 8 },
  separator: { color: palette.offWhite, fontSize: 16, marginVertical: 12 },
  joinCodeContainer: { flexDirection: 'row', width: '100%' },
  input: { flex: 1, backgroundColor: palette.primary, color: palette.offWhite, padding: 15, borderRadius: 10, fontSize: 18, textAlign: 'center', letterSpacing: 3 },
  joinButton: { backgroundColor: palette.accent, padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  joinButtonText: { color: palette.primary, fontSize: 18, fontWeight: 'bold' },
  publicSection: { flex: 1, width: '100%', paddingHorizontal: 20 },
  publicTitle: { color: palette.accent, fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginVertical: 15 },
  publicCard: { backgroundColor: palette.primary, padding: 20, borderRadius: 10, marginBottom: 10 },
  publicCardTitle: { color: palette.offWhite, fontSize: 18, fontWeight: 'bold' },
  publicCardType: { color: palette.offWhite, fontSize: 14, opacity: 0.7, marginTop: 4 },
  emptyText: { color: '#999', textAlign: 'center', fontStyle: 'italic', marginTop: 20 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' },
  modalContainer: { width: '90%', backgroundColor: palette.surface, padding: 25, borderRadius: 15, borderWidth: 1, borderColor: palette.primary },
  modalTitle: { color: palette.accent, fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalInput: { backgroundColor: palette.primary, color: palette.offWhite, borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 20 },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  switchLabel: { color: palette.offWhite, fontSize: 16 },
  modalButton: { backgroundColor: palette.accent, padding: 15, borderRadius: 10, alignItems: 'center' },
  modalButtonText: { color: palette.primary, fontSize: 18, fontWeight: 'bold' },
  closeButtonText: { color: palette.offWhite, textAlign: 'center', marginTop: 15, padding: 5 },
  infoDescription: {
      color: palette.offWhite,
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 30,
      lineHeight: 24,
  },
  promptContainer: {
    backgroundColor: palette.primary,
    borderRadius: 8,
    padding: 15,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: palette.accent,
  },
  promptLabel: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 5,
  },
  promptText: {
    color: palette.offWhite,
    fontSize: 16,
    fontStyle: 'italic',
  },
  modalContainer_light: {
    width: '90%',
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
  },
  modalTitle_light: {
    color: palette.primary, 
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel_light: {
    color: '#333',
    marginBottom: 5,
    marginLeft: 2,
    fontWeight: '500',
  },
  modalInput_light: {
    backgroundColor: '#f0f0f0', 
    color: palette.primary, 
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  switchLabel_light: {
    color: palette.primary, 
    fontSize: 16,
  },
  closeButtonText_light: {
    color: '#777',
    textAlign: 'center',
    marginTop: 15,
    padding: 5,
  },
});