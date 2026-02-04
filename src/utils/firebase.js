import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD1lwCgEVsVf_V5SOXKYWutpVAxBeqvQTU",
  authDomain: "escapeit-b9b45.firebaseapp.com",
  projectId: "escapeit-b9b45",
  storageBucket: "escapeit-b9b45.firebasestorage.app",
  messagingSenderId: "850179694159",
  appId: "1:850179694159:web:04ac85e90cae76cf95943a",
  measurementId: "G-CFYW483556"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
