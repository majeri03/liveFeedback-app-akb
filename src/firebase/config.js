import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDdWUun-sBtuV62QYg5TZ30J0Gp7TYmkZo",
  authDomain: "live-feedback-akb00.firebaseapp.com",
  projectId: "live-feedback-akb00",
  storageBucket: "live-feedback-akb00.firebasestorage.app",
  messagingSenderId: "770250161039",
  appId: "1:770250161039:web:33da053f6a2266ff8969fa"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };