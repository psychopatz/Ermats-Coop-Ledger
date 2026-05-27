export default function MembersWorkspace({
  members,
  memberForm,
  setMemberForm,
  handleAddMember,
  handleSoftDeleteMember,
  actionLoading,
}) {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-xl font-bold text-slate-200">Registered Members</h3>
        <div className="border border-slate-900 rounded-2xl bg-slate-950 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase border-b border-slate-900">
                <tr>
                  <th className="px-5 py-3">Member ID</th>
                  <th className="px-5 py-3">Full Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-8 text-center text-slate-500 text-xs">
                      No members registered yet.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.member_id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-slate-200 text-xs">
                        {member.member_id}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-355 text-xs">{member.full_name}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-450">{member.email}</td>
                      <td className="px-5 py-3.5 text-xs">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          member.status === 'active'
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {member.status === 'active' && (
                          <button
                            onClick={() => handleSoftDeleteMember(member.member_id)}
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
          <div className="divide-y divide-slate-900 md:hidden">
            {members.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-500 text-sm">No members registered yet.</div>
            ) : (
              members.map((member) => (
                <article key={member.member_id} className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold text-slate-100">{member.member_id}</p>
                      <p className="text-sm text-slate-200">{member.full_name}</p>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      member.status === 'active'
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                    }`}>
                      {member.status}
                    </span>
                  </div>
                  {member.status === 'active' && (
                    <button
                      onClick={() => handleSoftDeleteMember(member.member_id)}
                      disabled={actionLoading}
                      className="text-sm text-rose-500 hover:text-rose-400 font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      Deactivate
                    </button>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-200">Register Member</h3>
        <form onSubmit={handleAddMember} className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name</label>
            <input
              type="text"
              required
              value={memberForm.full_name}
              onChange={(event) => setMemberForm({ ...memberForm, full_name: event.target.value })}
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
              onChange={(event) => setMemberForm({ ...memberForm, email: event.target.value })}
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
              onChange={(event) => setMemberForm({ ...memberForm, access_code: event.target.value })}
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
  );
}