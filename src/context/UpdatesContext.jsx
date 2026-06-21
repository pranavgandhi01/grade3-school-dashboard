import { createContext, useContext } from 'react';
import { useDailyUpdates } from '../hooks/useDailyUpdates';

const UpdatesContext = createContext({ updates: [], loading: true });

export function UpdatesProvider({ children }) {
  const { updates, loading } = useDailyUpdates();
  
  return (
    <UpdatesContext.Provider value={{ updates, loading }}>
      {children}
    </UpdatesContext.Provider>
  );
}

export function useUpdatesContext() {
  return useContext(UpdatesContext);
}
