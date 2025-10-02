import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAjKRridqLFy8i-of3wQCe28dvgNYFR010",
  authDomain: "simpleinfo-a02b0.firebaseapp.com",
  projectId: "simpleinfo-a02b0",
  storageBucket: "simpleinfo-a02b0.firebasestorage.app",
  messagingSenderId: "955726620263",
  appId: "1:955726620263:web:70143a50d08bc19696d6c2",
  measurementId: "G-GZBSSL4298"
};
// Firebase 초기화
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
