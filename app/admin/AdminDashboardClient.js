'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminWorkspace } from '@/components/admin/AdminWorkspaceProvider';
import MembersWorkspace from '@/components/admin/MembersWorkspace';
import LoansWorkspace from '@/components/admin/LoansWorkspace';
import AuditsWorkspace from '@/components/admin/AuditsWorkspace';
import BulletinWorkspace from '@/components/admin/BulletinWorkspace';
import { createOptimisticId } from '@/lib/domain/workspaceState';

function createLoanForm(today) {
  return {
    member_id: '',
    principal_amount: '',
    interest_rate: '0.03',
    term_months: '12',
    release_date: today,
  };
}

const DEFAULT_MEMBER_FORM = {
  full_name: '',
  email: '',
  access_code: '',
};

export default function AdminDashboardClient() {
  const { members, bulletins, activeBulletin, loans, loanRequests, audits, payments, today, syncStatus, dispatch } = useAdminWorkspace();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('members');
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

  const tabs = [
    { id: 'members', name: 'Members Directory', count: members.length },
    { id: 'loans', name: 'Loans & Requests', count: loans.length + loanRequests.filter((request) => request.status === 'pending_approval').length },
    { id: 'bulletins', name: 'Member Bulletin', count: bulletins.length },
    { id: 'audits', name: 'System Audit Logs', count: audits.length },
  ];

  return (
    <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      <section className="grid gap-4 md:grid-cols-4">
        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/40">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Members</p>
          <p className="text-3xl font-bold text-slate-100 mt-2">{members.length}</p>
          <p className="text-xs text-slate-500 mt-2">Sanitized records available to the admin workspace</p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/40">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Loans</p>
          <p className="text-3xl font-bold text-indigo-300 mt-2">{loans.length}</p>
          <p className="text-xs text-slate-500 mt-2">Repayment status is derived from current balances</p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/40">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Payments</p>
          <p className="text-3xl font-bold text-emerald-400 mt-2">{payments.length}</p>
          <p className="text-xs text-slate-500 mt-2">Grouped analytics and payment methods live in the payments hub</p>
        </div>
        <Link href="/admin/payments" className="p-5 rounded-2xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-300">Payments Hub</p>
          <p className="text-2xl font-bold text-slate-100 mt-2">Year / Month / Week</p>
          <p className="text-xs text-slate-400 mt-2">Review grouped collections, payment methods, and repayment visibility on a dedicated page.</p>
        </Link>
      </section>

      <section className="grid lg:grid-cols-[240px_1fr] gap-8">
        <aside className="space-y-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setError('');
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-sm font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-purple-650/10 border-purple-500/50 text-purple-400 shadow-[0_0_15px_-3px_rgba(168,85,247,0.1)]'
                  : 'bg-slate-900/40 border-slate-900 text-slate-400 hover:border-slate-800 hover:text-slate-200'
              }`}
            >
              <span>{tab.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 border border-slate-850 text-slate-500">
                {tab.count}
              </span>
            </button>
          ))}
        </aside>

        <div className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm flex gap-3 items-center">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {syncStatus.state !== 'idle' && !error && (
            <div className={`p-4 rounded-xl text-sm border ${
              syncStatus.state === 'saved'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                : syncStatus.state === 'error'
                  ? 'border-rose-500/20 bg-rose-500/10 text-rose-300'
                  : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-100'
            }`}>
              {syncStatus.message}
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Admin Operations</h2>
              <p className="text-sm text-slate-400">This page now renders from one server-side ledger snapshot instead of fanning out through multiple dashboard API reads.</p>
            </div>
          </div>

          {activeTab === 'members' && (
            <MembersWorkspace
              members={members}
              memberForm={memberForm}
              setMemberForm={setMemberForm}
              handleAddMember={handleAddMember}
              handleSoftDeleteMember={handleSoftDeleteMember}
              actionLoading={isBusy}
            />
          )}

          {activeTab === 'loans' && (
            <LoansWorkspace
              today={today}
              members={members}
              loans={loans}
              loanRequests={loanRequests}
              loanForm={loanForm}
              setLoanForm={setLoanForm}
              handleAddLoan={handleAddLoan}
              handleApproveLoanRequest={handleApproveLoanRequest}
              handleRejectLoanRequest={handleRejectLoanRequest}
              actionLoading={isBusy}
            />
          )}

          {activeTab === 'bulletins' && (
            <BulletinWorkspace
              bulletins={bulletins}
              bulletinMessage={bulletinMessage}
              setBulletinMessage={setBulletinMessage}
              handleSaveBulletin={handleSaveBulletin}
              actionLoading={isBusy}
            />
          )}

          {activeTab === 'audits' && <AuditsWorkspace audits={audits} />}
        </div>
      </section>
    </main>
  );
}