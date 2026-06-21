import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { DAILY_UPDATES as STATIC_UPDATES } from '../data/schoolData';

export function useDailyUpdates() {
  const [updates, setUpdates] = useState(STATIC_UPDATES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'daily_updates'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      
      // Sort dates correctly. Format: DD_MMMM_YYYY
      // We parse them to Date objects for sorting
      data.sort((a, b) => {
        const parseDate = (dStr) => new Date(dStr.replace(/_/g, ' '));
        return parseDate(a.date) - parseDate(b.date);
      });

      if (data.length > 0) {
        setUpdates(data);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { updates, loading };
}
