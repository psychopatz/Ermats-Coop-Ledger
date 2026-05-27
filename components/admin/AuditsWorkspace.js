export default function AuditsWorkspace({ audits }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-slate-200">System Activity Audit Log</h3>
      <div className="border border-slate-900 rounded-2xl bg-slate-950 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
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
                    No audit log records found.
                  </td>
                </tr>
              ) : (
                audits.map((audit) => (
                  <tr key={audit.audit_id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-5 py-3 text-slate-255 font-semibold">{audit.audit_id}</td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{audit.timestamp}</td>
                    <td className="px-5 py-3 text-slate-400">{audit.actor_email}</td>
                    <td className="px-5 py-3 text-purple-400 font-bold">{audit.action}</td>
                    <td className="px-5 py-3 text-slate-400">{audit.entity_type}</td>
                    <td className="px-5 py-3 text-indigo-400 font-semibold">{audit.entity_id}</td>
                    <td className="px-5 py-3 text-slate-500 max-w-xs truncate" title={audit.details}>{audit.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-slate-900 md:hidden">
          {audits.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-500 text-sm">No audit log records found.</div>
          ) : (
            audits.map((audit) => (
              <article key={audit.audit_id} className="p-5 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-slate-100">{audit.audit_id}</p>
                    <p className="text-xs text-slate-500">{audit.timestamp}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">{audit.action}</span>
                </div>
                <p className="text-sm text-slate-300">{audit.actor_email}</p>
                <p className="text-sm text-slate-400">{audit.entity_type} • {audit.entity_id}</p>
                <p className="text-sm text-slate-500 break-words">{audit.details}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}