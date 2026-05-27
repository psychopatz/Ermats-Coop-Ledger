'use client';

import { createContext, useContext, useEffect, useReducer } from 'react';
import { buildMemberWorkspaceData, IDLE_SYNC_STATUS } from '@/lib/domain/workspaceState';

const MemberWorkspaceContext = createContext(null);

function createMemberBaseState(initialData) {
  return {
    bulletins: initialData.bulletins || [],
    loans: initialData.loans || [],
    payments: initialData.payments || [],
    loanRequests: initialData.loanRequests || [],
    syncStatus: IDLE_SYNC_STATUS,
  };
}

function memberWorkspaceReducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return createMemberBaseState(action.payload);
    case 'payment_submit_started':
      return {
        ...state,
        payments: [action.payload.payment, ...state.payments],
        syncStatus: {
          state: 'saving',
          message: 'Saving payment to Google Sheets...',
        },
      };
    case 'payment_submit_succeeded':
      return {
        ...state,
        payments: state.payments.map((payment) => (
          payment.payment_id === action.payload.tempId
            ? action.payload.payment
            : payment
        )),
        syncStatus: {
          state: 'saved',
          message: 'Payment safely saved to Google Sheets.',
        },
      };
    case 'payment_submit_failed':
      return {
        ...state,
        payments: state.payments.filter((payment) => payment.payment_id !== action.payload.tempId),
        syncStatus: {
          state: 'error',
          message: action.payload.message,
        },
      };
    case 'loan_request_submit_started':
      return {
        ...state,
        loanRequests: [action.payload.request, ...state.loanRequests],
        syncStatus: {
          state: 'saving',
          message: 'Saving loan request to Google Sheets...',
        },
      };
    case 'loan_request_submit_succeeded':
      return {
        ...state,
        loanRequests: state.loanRequests.map((request) => (
          request.request_id === action.payload.tempId
            ? action.payload.request
            : request
        )),
        syncStatus: {
          state: 'saved',
          message: 'Loan request safely saved to Google Sheets.',
        },
      };
    case 'loan_request_submit_failed':
      return {
        ...state,
        loanRequests: state.loanRequests.filter((request) => request.request_id !== action.payload.tempId),
        syncStatus: {
          state: 'error',
          message: action.payload.message,
        },
      };
    case 'clear_sync_status':
      return {
        ...state,
        syncStatus: IDLE_SYNC_STATUS,
      };
    default:
      return state;
  }
}

export function MemberWorkspaceProvider({ initialData, today, children }) {
  const [workspace, dispatch] = useReducer(memberWorkspaceReducer, initialData, createMemberBaseState);

  useEffect(() => {
    dispatch({ type: 'hydrate', payload: initialData });
  }, [initialData]);

  const derivedWorkspace = buildMemberWorkspaceData(workspace);

  return (
    <MemberWorkspaceContext.Provider value={{ ...derivedWorkspace, today, dispatch }}>
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