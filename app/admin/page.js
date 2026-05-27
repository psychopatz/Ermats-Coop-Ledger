// app/admin/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  // Navigation Tabs: 'members' | 'loans' | 'payments' | 'audits'
  const [activeTab, setActiveTab] = useState('members');

  // Master Data States
  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [audits, setAudits] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Form States - Member
  const [memberForm, setMemberForm] = useState({ full_name: '', email: '', access_code: '' });
  // Form States - Loan
  const [loanForm, setLoanForm] = useState({
    member_id: '',
    principal_amount: '',
    interest_rate: '0.03',
    term_months: '12',
    release_date: new Date().toISOString().split('T')[0],
  });
  // Form States - Payment
  const [paymentForm, setPaymentForm] = useState({
    loan_id: '',
    amount_received: '',
    payment_date: new Date().toISOString().split('T')[0],
    received_by: 'admin@test.com',
  });
  // Form States - Void Payment Action
  const [voidPaymentId, setVoidPaymentId] = useState(null);
  const [voidForm, setVoidForm] = useState({ void_reason: '', actor_email: 'admin@test.com' });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Parallel fetch from API routes
      const [membersRes, loansRes, paymentsRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/loans'),
        fetch('/api/payments'),
      ]);

      if (!membersRes.ok || !loansRes.ok || !paymentsRes.ok) {
        throw new Error('Failed to retrieve control center records.');
      }

      const membersData = await membersRes.json();
      const loansData = await loansRes.json();
      const paymentsData = await paymentsRes.json();

      setMembers(membersData);
      setLoans(loansData);
      setPayments(paymentsData);

      // Audit logs are retrieved via the Sheets directly, but since we don't have a direct GET /api/audit
      // Let's implement an endpoint or fallback. Wait! The prompt says "Write audit log" but didn't explicitly request
      // an API endpoint to GET /api/audit. Let's create a quick API endpoint for Audit logs, or we can fetch them
      // from a helper route. Let's write an api/audits/route.js next so we can view them!
      // In the meantime, we fetch it or default to empty list.
      try {
        const auditRes = await fetch('/api/audits');
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          setAudits(auditData);
        }
      } catch (e) {
        console.warn('Audit logs GET endpoint not ready or failing:', e);
      }

    } catch (err) {
      setError(err.message || 'Error occurred while loading data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Form Submissions
  const handleAddMember = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register member.');

      setMemberForm({ full_name: '', email: '', access_code: '' });
      await fetchAllData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSoftDeleteMember = async (memberId) => {
    if (!confirm(`Are you sure you want to deactivate member ${memberId}?`)) return;
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete member.');

      await fetchAllData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddLoan = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: loanForm.member_id,
          principal_amount: parseFloat(loanForm.principal_amount),
          interest_rate: parseFloat(loanForm.interest_rate),
          term_months: parseInt(loanForm.term_months, 10),
          release_date: loanForm.release_date,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to issue loan.');

      setLoanForm({
        member_id: '',
        principal_amount: '',
        interest_rate: '0.03',
        term_months: '12',
        release_date: new Date().toISOString().split('T')[0],
      });
      await fetchAllData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    const selectedLoan = loans.find((l) => l.loan_id === paymentForm.loan_id);
    if (!selectedLoan) {
      setError('Please select a valid active loan.');
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loan_id: paymentForm.loan_id,
          member_id: selectedLoan.member_id,
          amount_received: parseFloat(paymentForm.amount_received),
          payment_date: paymentForm.payment_date,
          received_by: paymentForm.received_by,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process payment.');

      setPaymentForm({
        loan_id: '',
        amount_received: '',
        payment_date: new Date().toISOString().split('T')[0],
        received_by: 'admin@test.com',
      });
      await fetchAllData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVoidPayment = async (e) => {
    e.preventDefault();
    if (!voidPaymentId) return;
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/payments/${voidPaymentId}/void`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voidForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to void transaction.');

      setVoidPaymentId(null);
      setVoidForm({ void_reason: '', actor_email: 'admin@test.com' });
      await fetchAllData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header Panel */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
              Coop Ledger
            </Link>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400 font-semibold uppercase tracking-wider">
              Admin Workspace
            </span>
          </div>

          {/* Testing mode badge and action */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/5 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              Testing Mode Only
            </span>
            <button
              onClick={fetchAllData}
              disabled={isLoading || actionLoading}
              className="py-1.5 px-3 rounded-lg border border-slate-800 bg-slate-900 text-slate-350 hover:text-slate-100 hover:bg-slate-850 disabled:opacity-50 transition-colors text-xs font-semibold cursor-pointer"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin UI */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        {/* Left Navigation Menu */}
        <aside className="w-full md:w-56 shrink-0 space-y-2">
          {[
            { id: 'members', name: 'Members Directory', count: members.length },
            { id: 'loans', name: 'Cooperative Loans', count: loans.length },
            { id: 'payments', name: 'Payments Register', count: payments.length },
            { id: 'audits', name: 'System Audit Logs', count: audits.length },
          ].map((tab) => (
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

        {/* Dynamic Workspace */}
        <div className="flex-grow space-y-6">
          {error && (
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm flex gap-3 items-center">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="h-64 border border-slate-900 bg-slate-900/30 rounded-2xl animate-pulse flex items-center justify-center">
              <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider animate-bounce">Loading records...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: MEMBERS DIRECTORY */}
              {activeTab === 'members' && (
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Table List (Left 2 cols) */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xl font-bold text-slate-200">Registered Members</h3>
                    <div className="border border-slate-900 rounded-2xl bg-slate-950 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                          <thead className="bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase border-b border-slate-900">
                            <tr>
                              <th className="px-5 py-3">Member ID</th>
                              <th className="px-5 py-3">Full Name</th>
                              <th className="px-5 py-3">Email</th>
                              <th className="px-5 py-3">Access Code</th>
                              <th className="px-5 py-3">Status</th>
                              <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900">
                            {members.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="px-5 py-8 text-center text-slate-500 text-xs">
                                  No members registered yet.
                                </td>
                              </tr>
                            ) : (
                              members.map((m) => (
                                <tr key={m.member_id} className="hover:bg-slate-900/20 transition-colors">
                                  <td className="px-5 py-3.5 font-mono font-semibold text-slate-200 text-xs">
                                    {m.member_id}
                                  </td>
                                  <td className="px-5 py-3.5 font-medium text-slate-355 text-xs">{m.full_name}</td>
                                  <td className="px-5 py-3.5 text-xs text-slate-450">{m.email}</td>
                                  <td className="px-5 py-3.5 font-mono text-slate-500 text-xs">{m.access_code}</td>
                                  <td className="px-5 py-3.5 text-xs">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                      m.status === 'active'
                                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                                    }`}>
                                      {m.status}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 text-right">
                                    {m.status === 'active' && (
                                      <button
                                        onClick={() => handleSoftDeleteMember(m.member_id)}
                                        disabled={actionLoading}
                                        className="text-xs text-rose-500 hover:text-rose-400 font-semibold disabled:opacity-50 cursor-pointer"
                                      >
                                        Deactivate
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Add Member Form (Right 1 col) */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-200">Register Member</h3>
                    <form onSubmit={handleAddMember} className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name</label>
                        <input
                          type="text"
                          required
                          value={memberForm.full_name}
                          onChange={(e) => setMemberForm({ ...memberForm, full_name: e.target.value })}
                          placeholder="Juan Dela Cruz"
                          disabled={actionLoading}
                          className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-650 text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
                        <input
                          type="email"
                          required
                          value={memberForm.email}
                          onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                          placeholder="juan@example.com"
                          disabled={actionLoading}
                          className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-650 text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Access Code (Plain)</label>
                        <input
                          type="text"
                          required
                          value={memberForm.access_code}
                          onChange={(e) => setMemberForm({ ...memberForm, access_code: e.target.value })}
                          placeholder="123456"
                          disabled={actionLoading}
                          className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-650 text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all disabled:opacity-50 text-sm cursor-pointer"
                      >
                        {actionLoading ? 'Registering...' : 'Add Member'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 2: COOPERATIVE LOANS */}
              {activeTab === 'loans' && (
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Table List (Left 2 cols) */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xl font-bold text-slate-200">Active Loans</h3>
                    <div className="border border-slate-900 rounded-2xl bg-slate-950 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                          <thead className="bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase border-b border-slate-900">
                            <tr>
                              <th className="px-5 py-3">Loan ID</th>
                              <th className="px-5 py-3">Borrower</th>
                              <th className="px-5 py-3">Principal</th>
                              <th className="px-5 py-3">Rate</th>
                              <th className="px-5 py-3">Term</th>
                              <th className="px-5 py-3">Total Payable</th>
                              <th className="px-5 py-3">Balance</th>
                              <th className="px-5 py-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900">
                            {loans.length === 0 ? (
                              <tr>
                                <td colSpan="8" className="px-5 py-8 text-center text-slate-500 text-xs">
                                  No loans registered yet.
                                </td>
                              </tr>
                            ) : (
                              loans.map((l) => {
                                const borrower = members.find((m) => m.member_id === l.member_id);
                                return (
                                  <tr key={l.loan_id} className="hover:bg-slate-900/20 transition-colors">
                                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-200 text-xs">{l.loan_id}</td>
                                    <td className="px-5 py-3.5 text-xs text-slate-300">
                                      <p className="font-semibold">{borrower?.full_name || 'Unknown'}</p>
                                      <p className="text-[10px] text-slate-500">{l.member_id}</p>
                                    </td>
                                    <td className="px-5 py-3.5 text-xs">${parseFloat(l.principal_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="px-5 py-3.5 text-xs">{(parseFloat(l.interest_rate) * 100).toFixed(1)}%</td>
                                    <td className="px-5 py-3.5 text-xs">{l.term_months} mos</td>
                                    <td className="px-5 py-3.5 font-medium text-xs">${parseFloat(l.total_payable).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="px-5 py-3.5 font-medium text-emerald-400 text-xs">${parseFloat(l.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="px-5 py-3.5 text-center text-xs">
                                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                        l.status === 'paid'
                                          ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
                                          : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                      }`}>
                                        {l.status}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Add Loan Form (Right 1 col) */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-200">Issue New Loan</h3>
                    <form onSubmit={handleAddLoan} className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Borrowing Member</label>
                        <select
                          required
                          value={loanForm.member_id}
                          onChange={(e) => setLoanForm({ ...loanForm, member_id: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
                        >
                          <option value="">Select Member...</option>
                          {members
                            .filter((m) => m.status === 'active')
                            .map((m) => (
                              <option key={m.member_id} value={m.member_id}>
                                {m.full_name} ({m.member_id})
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Principal Amount ($)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          step="any"
                          value={loanForm.principal_amount}
                          onChange={(e) => setLoanForm({ ...loanForm, principal_amount: e.target.value })}
                          placeholder="10000"
                          disabled={actionLoading}
                          className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-650 text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Interest Rate (decimal)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="1"
                          step="0.001"
                          value={loanForm.interest_rate}
                          onChange={(e) => setLoanForm({ ...loanForm, interest_rate: e.target.value })}
                          placeholder="0.03 (for 3%)"
                          disabled={actionLoading}
                          className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-650 text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Term (months)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={loanForm.term_months}
                          onChange={(e) => setLoanForm({ ...loanForm, term_months: e.target.value })}
                          placeholder="12"
                          disabled={actionLoading}
                          className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-650 text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Release Date</label>
                        <input
                          type="date"
                          required
                          value={loanForm.release_date}
                          onChange={(e) => setLoanForm({ ...loanForm, release_date: e.target.value })}
                          disabled={actionLoading}
                          className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all disabled:opacity-50 text-sm cursor-pointer"
                      >
                        {actionLoading ? 'Issuing...' : 'Add Loan'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 3: PAYMENTS REGISTER */}
              {activeTab === 'payments' && (
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Table List (Left 2 cols) */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xl font-bold text-slate-200">Payment Transactions</h3>
                    <div className="border border-slate-900 rounded-2xl bg-slate-950 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                          <thead className="bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase border-b border-slate-900">
                            <tr>
                              <th className="px-5 py-3">Payment ID</th>
                              <th className="px-5 py-3">Loan ID</th>
                              <th className="px-5 py-3">Member ID</th>
                              <th className="px-5 py-3">Date</th>
                              <th className="px-5 py-3">Amount</th>
                              <th className="px-5 py-3">Status</th>
                              <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900">
                            {payments.length === 0 ? (
                              <tr>
                                <td colSpan="7" className="px-5 py-8 text-center text-slate-500 text-xs">
                                  No payment transactions recorded.
                                </td>
                              </tr>
                            ) : (
                              payments.map((p) => (
                                <tr key={p.payment_id} className="hover:bg-slate-900/20 transition-colors">
                                  <td className="px-5 py-3.5 font-mono font-semibold text-slate-200 text-xs">{p.payment_id}</td>
                                  <td className="px-5 py-3.5 font-mono text-slate-450 text-xs">{p.loan_id}</td>
                                  <td className="px-5 py-3.5 font-mono text-slate-450 text-xs">{p.member_id}</td>
                                  <td className="px-5 py-3.5 text-xs text-slate-400">{p.payment_date}</td>
                                  <td className="px-5 py-3.5 font-medium text-xs">${parseFloat(p.amount_received).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                  <td className="px-5 py-3.5 text-xs">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                      p.status === 'voided'
                                        ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                                        : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                    }`}>
                                      {p.status}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 text-right">
                                    {p.status === 'active' && (
                                      <button
                                        onClick={() => {
                                          setVoidPaymentId(p.payment_id);
                                          setError('');
                                        }}
                                        className="text-xs text-rose-500 hover:text-rose-400 font-semibold cursor-pointer"
                                      >
                                        Void
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Void Transaction Dialog Panel */}
                    {voidPaymentId && (
                      <form onSubmit={handleVoidPayment} className="p-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-md font-bold text-rose-400">Void Payment transaction: {voidPaymentId}</h4>
                          <button
                            type="button"
                            onClick={() => setVoidPaymentId(null)}
                            className="text-xs text-slate-450 hover:text-slate-200"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Void Reason</label>
                            <input
                              type="text"
                              required
                              value={voidForm.void_reason}
                              onChange={(e) => setVoidForm({ ...voidForm, void_reason: e.target.value })}
                              placeholder="Incorrect payment amount inputted"
                              className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-650 text-sm focus:outline-none focus:border-rose-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Actor Email</label>
                            <input
                              type="email"
                              required
                              value={voidForm.actor_email}
                              onChange={(e) => setVoidForm({ ...voidForm, actor_email: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-rose-500"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="w-full py-2 px-4 rounded-lg bg-rose-650 hover:bg-rose-600 text-white font-semibold transition-all disabled:opacity-50 text-sm cursor-pointer"
                        >
                          {actionLoading ? 'Voiding...' : 'Confirm Void & Revert Balance'}
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Add Payment Form (Right 1 col) */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-200">Process Payment</h3>
                    <form onSubmit={handleAddPayment} className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Loan Account</label>
                        <select
                          required
                          value={paymentForm.loan_id}
                          onChange={(e) => setPaymentForm({ ...paymentForm, loan_id: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
                        >
                          <option value="">Select Loan...</option>
                          {loans
                            .filter((l) => l.status === 'active')
                            .map((l) => {
                              const borrower = members.find((m) => m.member_id === l.member_id);
                              return (
                                <option key={l.loan_id} value={l.loan_id}>
                                  {l.loan_id} - {borrower?.full_name || 'Member'} (${parseFloat(l.balance).toLocaleString()} bal)
                                </option>
                              );
                            })}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Amount Received ($)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          step="any"
                          value={paymentForm.amount_received}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount_received: e.target.value })}
                          placeholder="1000"
                          disabled={actionLoading}
                          className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-650 text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Payment Date</label>
                        <input
                          type="date"
                          required
                          value={paymentForm.payment_date}
                          onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                          disabled={actionLoading}
                          className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Received By (Collector Email)</label>
                        <input
                          type="email"
                          required
                          value={paymentForm.received_by}
                          onChange={(e) => setPaymentForm({ ...paymentForm, received_by: e.target.value })}
                          placeholder="admin@test.com"
                          disabled={actionLoading}
                          className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all disabled:opacity-50 text-sm cursor-pointer"
                      >
                        {actionLoading ? 'Processing...' : 'Record Payment'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 4: SYSTEM AUDIT LOGS */}
              {activeTab === 'audits' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-200">System Activity Audit Log</h3>
                  <div className="border border-slate-900 rounded-2xl bg-slate-950 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-350">
                        <thead className="bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase border-b border-slate-900">
                          <tr>
                            <th className="px-5 py-3">Audit ID</th>
                            <th className="px-5 py-3">Timestamp</th>
                            <th className="px-5 py-3">Actor Email</th>
                            <th className="px-5 py-3">Action</th>
                            <th className="px-5 py-3">Entity Type</th>
                            <th className="px-5 py-3">Entity ID</th>
                            <th className="px-5 py-3">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 font-mono text-[11px]">
                          {audits.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="px-5 py-8 text-center text-slate-500 text-xs font-sans">
                                No audit log records found. Make sure `/api/audits` route is initialized.
                              </td>
                            </tr>
                          ) : (
                            audits.map((a) => (
                              <tr key={a.audit_id} className="hover:bg-slate-900/20 transition-colors">
                                <td className="px-5 py-3 text-slate-255 font-semibold">{a.audit_id}</td>
                                <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{a.timestamp}</td>
                                <td className="px-5 py-3 text-slate-400">{a.actor_email}</td>
                                <td className="px-5 py-3 text-purple-400 font-bold">{a.action}</td>
                                <td className="px-5 py-3 text-slate-400">{a.entity_type}</td>
                                <td className="px-5 py-3 text-indigo-400 font-semibold">{a.entity_id}</td>
                                <td className="px-5 py-3 text-slate-500 max-w-xs truncate" title={a.details}>{a.details}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
