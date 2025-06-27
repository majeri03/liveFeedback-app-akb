// Lokasi: src/utils/sessionManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_SESSIONS_KEY = '@MyCreatedSessions';

export const getSavedSessions = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(SAVED_SESSIONS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("Gagal mengambil sesi dari storage", e);
    return [];
  }
};

export const saveSession = async (newSession) => {
  try {
    const existingSessions = await getSavedSessions();
    const updatedSessions = [...existingSessions, newSession];
    const jsonValue = JSON.stringify(updatedSessions);
    await AsyncStorage.setItem(SAVED_SESSIONS_KEY, jsonValue);
  } catch (e) {
    console.error("Gagal menyimpan sesi ke storage", e);
  }
};