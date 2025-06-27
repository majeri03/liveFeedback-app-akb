import AsyncStorage from '@react-native-async-storage/async-storage';

const CREATED_SESSIONS_KEY = '@MyCreatedSessions';
const JOINED_SESSIONS_KEY = '@JoinedSessionsHistory';


export const getCreatedSessions = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(CREATED_SESSIONS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("Gagal mengambil sesi buatan dari storage", e);
    return [];
  }
};

export const saveCreatedSession = async (newSession) => {
  try {
    const existingSessions = await getCreatedSessions();
    if (existingSessions.some(s => s.id === newSession.id)) return;
    const updatedSessions = [...existingSessions, newSession];
    const jsonValue = JSON.stringify(updatedSessions);
    await AsyncStorage.setItem(CREATED_SESSIONS_KEY, jsonValue);
  } catch (e) {
    console.error("Gagal menyimpan sesi buatan ke storage", e);
  }
};



export const getJoinedSessions = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(JOINED_SESSIONS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("Gagal mengambil riwayat sesi dari storage", e);
    return [];
  }
};

export const saveJoinedSession = async (sessionToJoin) => {
  try {
    const existingSessions = await getJoinedSessions();
    if (existingSessions.some(s => s.id === sessionToJoin.id)) return;

    const updatedSessions = [...existingSessions, sessionToJoin];
    const jsonValue = JSON.stringify(updatedSessions);
    await AsyncStorage.setItem(JOINED_SESSIONS_KEY, jsonValue);
  } catch (e) {
    console.error("Gagal menyimpan riwayat sesi ke storage", e);
  }
};