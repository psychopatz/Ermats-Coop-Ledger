function formatRepaymentStatus(status) {
  if (status === 'not_paid') {
    return 'Not Paid';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getRepaymentStatusClass(status) {
  if (status === 'paid') {
    return 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400';
  }

  if (status === 'partial') {
    return 'bg-amber-500/10 border border-amber-500/30 text-amber-300';
  }

  return 'bg-slate-500/10 border border-slate-500/30 text-slate-300';
}

export default function LoansWorkspace({
  members,
  loans,
  loanForm,
  setLoanForm,
  handleAddLoan,
  actionLoading,
}) {
  const memberLookup = new Map(members.map((member) => [member.member_id, member]));

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-xl font-bold text-slate-200">Loan Portfolio</h3>
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
                  <th className="px-5 py-3 text-center">Repayment</th>
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
                  loans.map((loan) => {
                    const borrower = memberLookup.get(loan.member_id);

                    return (
                      <tr key={loan.loan_id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-semibold text-slate-200 text-xs">{loan.loan_id}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-300">
                          <p className="font-semibold">{borrower?.full_name || 'Unknown'}</p>
                          <p className="text-[10px] text-slate-500">{loan.member_id}</p>
                        </td>
                        <td className="px-5 py-3.5 text-xs">${Number.parseFloat(loan.principal_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-5 py-3.5 text-xs">{(Number.parseFloat(loan.interest_rate) * 100).toFixed(1)}%</td>
                        <td className="px-5 py-3.5 text-xs">{loan.term_months} mos</td>
                        <td className="px-5 py-3.5 font-medium text-xs">${Number.parseFloat(loan.total_payable).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-5 py-3.5 font-medium text-emerald-400 text-xs">${Number.parseFloat(loan.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-5 py-3.5 text-center text-xs">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getRepaymentStatusClass(loan.repayment_status)}`}>
                            {formatRepaymentStatus(loan.repayment_status)}
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

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-200">Issue New Loan</h3>
        <form onSubmit={handleAddLoan} className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Borrowing Member</label>
            <select
              required
              value={loanForm.member_id}
              onChange={(event) => setLoanForm({ ...loanForm, member_id: event.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="">Select Member...</option>
              {members
                .filter((member) => member.status === 'active')
                .map((member) => (
                  <option key={member.member_id} value={member.member_id}>
                    {member.full_name} ({member.member_id})
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
              onChange={(event) => setLoanForm({ ...loanForm, principal_amount: event.target.value })}
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
              onChange={(event) => setLoanForm({ ...loanForm, interest_rate: event.target.value })}
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
              onChange={(event) => setLoanForm({ ...loanForm, term_months: event.target.value })}
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
              onChange={(event) => setLoanForm({ ...loanForm, release_date: event.target.value })}
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
  );
}