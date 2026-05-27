'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createOptimisticId } from '@/lib/domain/workspaceState';
import {
  createLoanForm,
  DEFAULT_MEMBER_FORM,
} from '@/components/admin/dashboard/dashboardUi';

export default function useAdminDashboardController({
  members,
  bulletins,
  activeBulletin,
  today,
  syncStatus,
  dispatch,
}) {
  const router = useRouter();
  const [memberForm, setMemberForm] = useState(DEFAULT_MEMBER_FORM);
  const [loanForm, setLoanForm] = useState(createLoanForm(today));
  const [bulletinMessage, setBulletinMessage] = useState(activeBulletin?.message || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isBusy = isSubmitting || syncStatus.state === 'saving';

  useEffect(() => {
    setBulletinMessage(activeBulletin?.message || '');
  }, [activeBulletin]);

  const sendRequest = async (url, options, fallbackMessage) => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        return { unauthorized: true };
      }

      if (!response.ok) {
        return { error: data.error || fallbackMessage };
      }

      return { data };
    } catch (requestError) {
      return { error: requestError.message || fallbackMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = async (event) => {
    event.preventDefault();

    const optimisticId = createOptimisticId('member');
    const now = new Date().toISOString();

    dispatch({
      type: 'member_create_started',
      payload: {
        member: {
          member_id: optimisticId,
          full_name: memberForm.full_name,
          email: memberForm.email,
          status: 'active',
          created_at: now,
          updated_at: now,
        },
      },
    });

    const result = await sendRequest(
      '/api/members',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberForm),
      },
      'Failed to register member.'
    );

    if (result.unauthorized) {
      dispatch({
        type: 'member_create_failed',
        payload: {
          tempId: optimisticId,
          message: 'Your admin session expired. Please sign in again.',
        },
      });
      router.push('/admin-login');
      return;
    }

    if (result.error) {
      dispatch({
        type: 'member_create_failed',
        payload: {
          tempId: optimisticId,
          message: result.error,
        },
      });
      setError(result.error);
      return;
    }

    if (result.data) {
      dispatch({
        type: 'member_create_succeeded',
        payload: {
          tempId: optimisticId,
          member: result.data,
        },
      });
      setMemberForm(DEFAULT_MEMBER_FORM);
    }
  };

  const handleSoftDeleteMember = async (memberId) => {
    if (!confirm(`Are you sure you want to deactivate member ${memberId}?`)) {
      return;
    }

    const existingMember = members.find((member) => member.member_id === memberId);
    if (!existingMember) {
      return;
    }

    const optimisticMember = {
      ...existingMember,
      status: 'inactive',
      updated_at: new Date().toISOString(),
    };

    dispatch({
      type: 'member_update_started',
      payload: {
        member: optimisticMember,
      },
    });

    const result = await sendRequest(
      `/api/members/${memberId}`,
      { method: 'DELETE' },
      'Failed to deactivate member.'
    );

    if (result.unauthorized) {
      dispatch({
        type: 'member_update_failed',
        payload: {
          member: existingMember,
          message: 'Your admin session expired. Please sign in again.',
        },
      });
      router.push('/admin-login');
      return;
    }

    if (result.error) {
      dispatch({
        type: 'member_update_failed',
        payload: {
          member: existingMember,
          message: result.error,
        },
      });
      setError(result.error);
      return;
    }

    dispatch({
      type: 'member_update_succeeded',
      payload: {
        member: result.data,
      },
    });
  };

  const handleAddLoan = async (event) => {
    event.preventDefault();

    const principalAmount = Number.parseFloat(loanForm.principal_amount);
    const interestRate = Number.parseFloat(loanForm.interest_rate);
    const termMonths = Number.parseInt(loanForm.term_months, 10);
    const totalPayable = principalAmount + (principalAmount * interestRate * termMonths);
    const optimisticId = createOptimisticId('loan');
    const now = new Date().toISOString();

    dispatch({
      type: 'loan_create_started',
      payload: {
        loan: {
          loan_id: optimisticId,
          member_id: loanForm.member_id,
          principal_amount: principalAmount,
          interest_rate: interestRate,
          term_months: termMonths,
          total_payable: totalPayable,
          balance: totalPayable,
          status: 'active',
          release_date: loanForm.release_date,
          created_at: now,
          updated_at: now,
        },
      },
    });

    const result = await sendRequest(
      '/api/loans',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: loanForm.member_id,
          principal_amount: principalAmount,
          interest_rate: interestRate,
          term_months: termMonths,
          release_date: loanForm.release_date,
        }),
      },
      'Failed to issue loan.'
    );

    if (result.unauthorized) {
      dispatch({
        type: 'loan_create_failed',
        payload: {
          tempId: optimisticId,
          message: 'Your admin session expired. Please sign in again.',
        },
      });
      router.push('/admin-login');
      return;
    }

    if (result.error) {
      dispatch({
        type: 'loan_create_failed',
        payload: {
          tempId: optimisticId,
          message: result.error,
        },
      });
      setError(result.error);
      return;
    }

    if (result.data) {
      dispatch({
        type: 'loan_create_succeeded',
        payload: {
          tempId: optimisticId,
          loan: result.data,
        },
      });
      setLoanForm(createLoanForm(today));
    }
  };

  const handleSaveBulletin = async (event) => {
    event.preventDefault();

    const optimisticId = createOptimisticId('bulletin');
    const now = new Date().toISOString();
    const nextMessage = bulletinMessage.trim();
    const previousBulletins = bulletins;

    dispatch({
      type: 'bulletin_save_started',
      payload: {
        bulletin: nextMessage
          ? {
            bulletin_id: optimisticId,
            message: nextMessage,
            status: 'active',
            created_at: now,
            updated_at: now,
          }
          : null,
      },
    });

    const result = await sendRequest(
      '/api/bulletins',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: bulletinMessage }),
      },
      'Failed to save bulletin.'
    );

    if (result.unauthorized) {
      dispatch({
        type: 'bulletin_save_failed',
        payload: {
          previousBulletins,
          message: 'Your admin session expired. Please sign in again.',
        },
      });
      router.push('/admin-login');
      return;
    }

    if (result.error) {
      dispatch({
        type: 'bulletin_save_failed',
        payload: {
          previousBulletins,
          message: result.error,
        },
      });
      setError(result.error);
      return;
    }

    dispatch({
      type: 'bulletin_save_succeeded',
      payload: {
        tempId: optimisticId,
        bulletin: result.data.bulletin,
        message: result.data.bulletin
          ? 'Bulletin safely saved to Google Sheets.'
          : 'Bulletin cleared. Members will now see the default friendly message.',
      },
    });
    setBulletinMessage(result.data.bulletin?.message || '');
  };

  const handleApproveLoanRequest = async (loanRequest, values) => {
    const approvedInterestRate = Number.parseFloat(values.approved_interest_rate);
    if (!Number.isFinite(approvedInterestRate) || approvedInterestRate < 0) {
      setError('Please enter a valid approval interest rate.');
      return;
    }

    const tempLoanId = createOptimisticId('approved-loan');
    const now = new Date().toISOString();
    const principalAmount = Number.parseFloat(loanRequest.requested_amount);
    const termMonths = Number.parseInt(loanRequest.requested_term_months, 10);
    const totalPayable = principalAmount + (principalAmount * approvedInterestRate * termMonths);
    const optimisticLoan = {
      loan_id: tempLoanId,
      member_id: loanRequest.member_id,
      principal_amount: principalAmount,
      interest_rate: approvedInterestRate,
      term_months: termMonths,
      total_payable: totalPayable,
      balance: totalPayable,
      status: 'active',
      release_date: values.release_date,
      created_at: now,
      updated_at: now,
    };
    const optimisticRequest = {
      ...loanRequest,
      status: 'approved',
      reviewed_by: 'Pending admin sync',
      admin_notes: values.admin_notes,
      approved_interest_rate: approvedInterestRate,
      approved_loan_id: tempLoanId,
      updated_at: now,
    };

    dispatch({
      type: 'loan_request_update_started',
      payload: {
        request: optimisticRequest,
        loan: optimisticLoan,
        message: 'Saving loan approval to Google Sheets...',
      },
    });

    const result = await sendRequest(
      `/api/loan-requests/${loanRequest.request_id}/approve`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      },
      'Failed to approve loan request.'
    );

    if (result.unauthorized) {
      dispatch({
        type: 'loan_request_update_failed',
        payload: {
          previousRequest: loanRequest,
          tempLoanId,
          message: 'Your admin session expired. Please sign in again.',
        },
      });
      router.push('/admin-login');
      return;
    }

    if (result.error) {
      dispatch({
        type: 'loan_request_update_failed',
        payload: {
          previousRequest: loanRequest,
          tempLoanId,
          message: result.error,
        },
      });
      setError(result.error);
      return;
    }

    dispatch({
      type: 'loan_request_update_succeeded',
      payload: {
        request: result.data.request,
        loan: result.data.loan,
        tempLoanId,
        message: 'Loan request safely approved in Google Sheets.',
      },
    });
  };

  const handleRejectLoanRequest = async (loanRequest, adminNotes) => {
    const optimisticRequest = {
      ...loanRequest,
      status: 'rejected',
      reviewed_by: 'Pending admin sync',
      admin_notes: adminNotes,
      updated_at: new Date().toISOString(),
    };

    dispatch({
      type: 'loan_request_update_started',
      payload: {
        request: optimisticRequest,
        loan: null,
        message: 'Saving loan rejection to Google Sheets...',
      },
    });

    const result = await sendRequest(
      `/api/loan-requests/${loanRequest.request_id}/reject`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: adminNotes }),
      },
      'Failed to reject loan request.'
    );

    if (result.unauthorized) {
      dispatch({
        type: 'loan_request_update_failed',
        payload: {
          previousRequest: loanRequest,
          tempLoanId: null,
          message: 'Your admin session expired. Please sign in again.',
        },
      });
      router.push('/admin-login');
      return;
    }

    if (result.error) {
      dispatch({
        type: 'loan_request_update_failed',
        payload: {
          previousRequest: loanRequest,
          tempLoanId: null,
          message: result.error,
        },
      });
      setError(result.error);
      return;
    }

    dispatch({
      type: 'loan_request_update_succeeded',
      payload: {
        request: result.data.request,
        loan: null,
        tempLoanId: null,
        message: 'Loan request safely updated in Google Sheets.',
      },
    });
  };

  return {
    memberForm,
    setMemberForm,
    loanForm,
    setLoanForm,
    bulletinMessage,
    setBulletinMessage,
    error,
    setError,
    isBusy,
    handleAddMember,
    handleSoftDeleteMember,
    handleAddLoan,
    handleSaveBulletin,
    handleApproveLoanRequest,
    handleRejectLoanRequest,
  };
}