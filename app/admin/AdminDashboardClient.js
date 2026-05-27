'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminWorkspace } from '@/components/admin/AdminWorkspaceProvider';
import MembersWorkspace from '@/components/admin/MembersWorkspace';
import LoansWorkspace from '@/components/admin/LoansWorkspace';
import AuditsWorkspace from '@/components/admin/AuditsWorkspace';

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
  const { members, loans, audits, payments, today } = useAdminWorkspace();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('members');
  const [memberForm, setMemberForm] = useState(DEFAULT_MEMBER_FORM);
  const [loanForm, setLoanForm] = useState(createLoanForm(today));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isBusy = isSubmitting || isPending;

  const refreshWorkspace = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const submitRequest = async (url, options, fallbackMessage) => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.push('/admin-login');
        refreshWorkspace();
        return null;
      }

      if (!response.ok) {
        throw new Error(data.error || fallbackMessage);
      }

      refreshWorkspace();
      return data;
    } catch (requestError) {
      setError(requestError.message || fallbackMessage);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = async (event) => {
    event.preventDefault();

    const result = await submitRequest(
      '/api/members',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberForm),
      },
      'Failed to register member.'
    );

    if (result) {
      setMemberForm(DEFAULT_MEMBER_FORM);
    }
  };

  const handleSoftDeleteMember = async (memberId) => {
    if (!confirm(`Are you sure you want to deactivate member ${memberId}?`)) {
      return;
    }

    await submitRequest(
      `/api/members/${memberId}`,
      { method: 'DELETE' },
      'Failed to deactivate member.'
    );
  };

  const handleAddLoan = async (event) => {
    event.preventDefault();

    const result = await submitRequest(
      '/api/loans',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: loanForm.member_id,
          principal_amount: Number.parseFloat(loanForm.principal_amount),
          interest_rate: Number.parseFloat(loanForm.interest_rate),
          term_months: Number.parseInt(loanForm.term_months, 10),
          release_date: loanForm.release_date,
        }),
      },
      'Failed to issue loan.'
    );

    if (result) {
      setLoanForm(createLoanForm(today));
    }
  };

  const tabs = [
    { id: 'members', name: 'Members Directory', count: members.length },
    { id: 'loans', name: 'Loan Portfolio', count: loans.length },
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

          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Admin Operations</h2>
              <p className="text-sm text-slate-400">This page now renders from one server-side ledger snapshot instead of fanning out through multiple dashboard API reads.</p>
            </div>
            <button
              onClick={refreshWorkspace}
              disabled={isBusy}
              className="py-2 px-4 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-slate-100 hover:bg-slate-900 transition-colors text-sm font-semibold disabled:opacity-50 cursor-pointer"
            >
              Refresh Workspace
            </button>
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
              members={members}
              loans={loans}
              loanForm={loanForm}
              setLoanForm={setLoanForm}
              handleAddLoan={handleAddLoan}
              actionLoading={isBusy}
            />
          )}

          {activeTab === 'audits' && <AuditsWorkspace audits={audits} />}
        </div>
      </section>
    </main>
  );
}