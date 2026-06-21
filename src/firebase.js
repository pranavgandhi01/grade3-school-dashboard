import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBetSRMw0xxveJeS1w8ZsRp5psEpgRW8Zg",
  authDomain: "grade3-dashboard-pranav.firebaseapp.com",
  projectId: "grade3-dashboard-pranav",
  storageBucket: "grade3-dashboard-pranav.firebasestorage.app",
  messagingSenderId: "174511849856",
  appId: "1:174511849856:web:d41e6da514190480f88165"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
