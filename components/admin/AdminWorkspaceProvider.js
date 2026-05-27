'use client';

import { createContext, useContext, useEffect, useReducer } from 'react';

const AdminWorkspaceContext = createContext(null);

function adminWorkspaceReducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return action.payload;
    default:
      return state;
  }
}

export function AdminWorkspaceProvider({ initialData, today, children }) {
  const [workspace, dispatch] = useReducer(adminWorkspaceReducer, initialData);

  useEffect(() => {
    dispatch({ type: 'hydrate', payload: initialData });
  }, [initialData]);

  return (
    <AdminWorkspaceContext.Provider value={{ ...workspace, today }}>
      {children}
    </AdminWorkspaceContext.Provider>
  );
}

export function useAdminWorkspace() {
  const context = useContext(AdminWorkspaceContext);

  if (!context) {
    throw new Error('useAdminWorkspace must be used within an AdminWorkspaceProvider.');
  }

  return context;
}