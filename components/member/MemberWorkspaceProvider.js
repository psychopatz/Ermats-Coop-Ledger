'use client';

import { createContext, useContext, useEffect, useReducer } from 'react';

const MemberWorkspaceContext = createContext(null);

function memberWorkspaceReducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return action.payload;
    default:
      return state;
  }
}

export function MemberWorkspaceProvider({ initialData, today, children }) {
  const [workspace, dispatch] = useReducer(memberWorkspaceReducer, initialData);

  useEffect(() => {
    dispatch({ type: 'hydrate', payload: initialData });
  }, [initialData]);

  return (
    <MemberWorkspaceContext.Provider value={{ ...workspace, today }}>
      {children}
    </MemberWorkspaceContext.Provider>
  );
}

export function useMemberWorkspace() {
  const context = useContext(MemberWorkspaceContext);

  if (!context) {
    throw new Error('useMemberWorkspace must be used within a MemberWorkspaceProvider.');
  }

  return context;
}