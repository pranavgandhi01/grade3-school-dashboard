import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { DAILY_UPDATES } from '../src/data/schoolData.js';

const firebaseConfig = {
  apiKey: "AIzaSyBetSRMw0xxveJeS1w8ZsRp5psEpgRW8Zg",
  authDomain: "grade3-dashboard-pranav.firebaseapp.com",
  projectId: "grade3-dashboard-pranav",
  storageBucket: "grade3-dashboard-pranav.firebasestorage.app",
  messagingSenderId: "174511849856",
  appId: "1:174511849856:web:d41e6da514190480f88165"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
  console.log(`Starting migration of ${DAILY_UPDATES.length} updates...`);
  
  for (const update of DAILY_UPDATES) {
    const docId = update.date.replace(/ /g, '_');
    console.log(`Saving: ${docId}`);
    await setDoc(doc(db, 'daily_updates', docId), update);
  }
  
  console.log("Migration complete!");
  process.exit(0);
}

migrate();
