'use client';

import { createContext, useContext, useEffect, useReducer } from 'react';
import { buildAdminWorkspaceData, IDLE_SYNC_STATUS } from '@/lib/domain/workspaceState';

const AdminWorkspaceContext = createContext(null);

function createAdminBaseState(initialData) {
  return {
    members: initialData.members || [],
    bulletins: initialData.bulletins || [],
    loans: initialData.loans || [],
    loanRequests: initialData.loanRequests || [],
    payments: initialData.payments || [],
    audits: initialData.audits || [],
    syncStatus: IDLE_SYNC_STATUS,
  };
}

function adminWorkspaceReducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return createAdminBaseState(action.payload);
    case 'member_create_started':
      return {
        ...state,
        members: [action.payload.member, ...state.members],
        syncStatus: {
          state: 'saving',
          message: 'Saving member to Google Sheets...',
        },
      };
    case 'member_create_succeeded':
      return {
        ...state,
        members: state.members.map((member) => (
          member.member_id === action.payload.tempId
            ? action.payload.member
            : member
        )),
        syncStatus: {
          state: 'saved',
          message: 'Member safely saved to Google Sheets.',
        },
      };
    case 'member_create_failed':
      return {
        ...state,
        members: state.members.filter((member) => member.member_id !== action.payload.tempId),
        syncStatus: {
          state: 'error',
          message: action.payload.message,
        },
      };
    case 'member_update_started':
      return {
        ...state,
        members: state.members.map((member) => (
          member.member_id === action.payload.member.member_id
            ? action.payload.member
            : member
        )),
        syncStatus: {
          state: 'saving',
          message: 'Saving member update to Google Sheets...',
        },
      };
    case 'member_update_succeeded':
      return {
        ...state,
        members: state.members.map((member) => (
          member.member_id === action.payload.member.member_id
            ? action.payload.member
            : member
        )),
        syncStatus: {
          state: 'saved',
          message: 'Member safely updated in Google Sheets.',
        },
      };
    case 'member_update_failed':
      return {
        ...state,
        members: state.members.map((member) => (
          member.member_id === action.payload.member.member_id
            ? action.payload.member
            : member
        )),
        syncStatus: {
          state: 'error',
          message: action.payload.message,
        },
      };
    case 'loan_create_started':
      return {
        ...state,
        loans: [action.payload.loan, ...state.loans],
        syncStatus: {
          state: 'saving',
          message: 'Saving loan to Google Sheets...',
        },
      };
    case 'loan_create_succeeded':
      return {
        ...state,
        loans: state.loans.map((loan) => (
          loan.loan_id === action.payload.tempId
            ? action.payload.loan
            : loan
        )),
        syncStatus: {
          state: 'saved',
          message: 'Loan safely saved to Google Sheets.',
        },
      };
    case 'loan_create_failed':
      return {
        ...state,
        loans: state.loans.filter((loan) => loan.loan_id !== action.payload.tempId),
        syncStatus: {
          state: 'error',
          message: action.payload.message,
        },
      };
    case 'bulletin_save_started':
      return {
        ...state,
        bulletins: action.payload.bulletin
          ? [action.payload.bulletin, ...state.bulletins.filter((bulletin) => bulletin.status !== 'active')]
          : state.bulletins.filter((bulletin) => bulletin.status !== 'active'),
        syncStatus: {
          state: 'saving',
          message: 'Saving bulletin to Google Sheets...',
        },
      };
    case 'bulletin_save_succeeded':
      return {
        ...state,
        bulletins: action.payload.bulletin
          ? [action.payload.bulletin, ...state.bulletins.filter((bulletin) => bulletin.bulletin_id !== action.payload.tempId && bulletin.status !== 'active')]
          : state.bulletins.filter((bulletin) => bulletin.status !== 'active' && bulletin.bulletin_id !== action.payload.tempId),
        syncStatus: {
          state: 'saved',
          message: action.payload.message,
        },
      };
    case 'bulletin_save_failed':
      return {
        ...state,
        bulletins: action.payload.previousBulletins,
        syncStatus: {
          state: 'error',
          message: action.payload.message,
        },
      };
    case 'loan_request_update_started':
      return {
        ...state,
        loanRequests: state.loanRequests.map((request) => (
          request.request_id === action.payload.request.request_id
            ? action.payload.request
            : request
        )),
        loans: action.payload.loan
          ? [action.payload.loan, ...state.loans]
          : state.loans,
        syncStatus: {
          state: 'saving',
          message: action.payload.message,
        },
      };
    case 'loan_request_update_succeeded':
      return {
        ...state,
        loanRequests: state.loanRequests.map((request) => (
          request.request_id === action.payload.request.request_id
            ? action.payload.request
            : request
        )),
        loans: action.payload.loan
          ? state.loans.map((loan) => (
            loan.loan_id === action.payload.tempLoanId
              ? action.payload.loan
              : loan
          ))
          : state.loans,
        syncStatus: {
          state: 'saved',
          message: action.payload.message,
        },
      };
    case 'loan_request_update_failed':
      return {
        ...state,
        loanRequests: state.loanRequests.map((request) => (
          request.request_id === action.payload.previousRequest.request_id
            ? action.payload.previousRequest
            : request
        )),
        loans: action.payload.tempLoanId
          ? state.loans.filter((loan) => loan.loan_id !== action.payload.tempLoanId)
          : state.loans,
        syncStatus: {
          state: 'error',
          message: action.payload.message,
        },
      };
    case 'payment_record_started':
      return {
        ...state,
        payments: [action.payload.payment, ...state.payments],
        loans: state.loans.map((loan) => (
          loan.loan_id === action.payload.loan.loan_id
            ? action.payload.loan
            : loan
        )),
        syncStatus: {
          state: 'saving',
          message: 'Saving payment to Google Sheets...',
        },
      };
    case 'payment_record_succeeded':
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
    case 'payment_record_failed':
      return {
        ...state,
        payments: state.payments.filter((payment) => payment.payment_id !== action.payload.tempId),
        loans: state.loans.map((loan) => (
          loan.loan_id === action.payload.loan.loan_id
            ? action.payload.loan
            : loan
        )),
        syncStatus: {
          state: 'error',
          message: action.payload.message,
        },
      };
    case 'payment_update_started':
      return {
        ...state,
        payments: state.payments.map((payment) => (
          payment.payment_id === action.payload.payment.payment_id
            ? action.payload.payment
            : payment
        )),
        loans: action.payload.loan
          ? state.loans.map((loan) => (
            loan.loan_id === action.payload.loan.loan_id
              ? action.payload.loan
              : loan
          ))
          : state.loans,
        syncStatus: {
          state: 'saving',
          message: action.payload.message,
        },
      };
    case 'payment_update_succeeded':
      return {
        ...state,
        payments: state.payments.map((payment) => (
          payment.payment_id === action.payload.payment.payment_id
            ? action.payload.payment
            : payment
        )),
        syncStatus: {
          state: 'saved',
          message: action.payload.message,
        },
      };
    case 'payment_update_failed':
      return {
        ...state,
        payments: state.payments.map((payment) => (
          payment.payment_id === action.payload.payment.payment_id
            ? action.payload.payment
            : payment
        )),
        loans: action.payload.loan
          ? state.loans.map((loan) => (
            loan.loan_id === action.payload.loan.loan_id
              ? action.payload.loan
              : loan
          ))
          : state.loans,
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

export function AdminWorkspaceProvider({ initialData, today, children }) {
  const [workspace, dispatch] = useReducer(adminWorkspaceReducer, initialData, createAdminBaseState);

  useEffect(() => {
    dispatch({ type: 'hydrate', payload: initialData });
  }, [initialData]);

  const derivedWorkspace = buildAdminWorkspaceData(workspace);

  return (
    <AdminWorkspaceContext.Provider value={{ ...derivedWorkspace, today, dispatch }}>
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