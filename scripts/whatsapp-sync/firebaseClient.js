import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

// We can use default credentials or a service account key
// Since this is for a personal project, the user can run `export GOOGLE_APPLICATION_CREDENTIALS="path/to/key.json"`
// Or we can just use simple REST / web SDK with API key since the rules are completely open right now.
// Since rules are open, using the web SDK might be easier for the user to avoid downloading service account keys!

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function uploadDailyUpdate(dateStr, updateData) {
  const docId = dateStr.replace(/ /g, '_');
  await setDoc(doc(db, 'daily_updates', docId), updateData, { merge: true });
  console.log(`✅ Uploaded to Firebase: ${docId}`);
}

export function listenForSyncRequest(callback) {
  onSnapshot(doc(db, 'system', 'flags'), (docSnap) => {
    if (docSnap.exists() && docSnap.data().sync_requested === true) {
      console.log("⚡ On-demand sync requested from Dashboard!");
      callback();
    }
  });
}

export async function clearSyncRequest() {
  await setDoc(doc(db, 'system', 'flags'), { sync_requested: false }, { merge: true });
}
