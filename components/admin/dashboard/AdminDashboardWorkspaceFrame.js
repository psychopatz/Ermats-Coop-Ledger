import {
  getPortalSidebarTabClassName,
  getPortalSyncMessageClassName,
} from '@/components/theme/portalTheme';

export default function AdminDashboardWorkspaceFrame({
  tabs,
  activeTab,
  onTabChange,
  error,
  syncStatus,
  children,
}) {
  return (
    <section className="grid lg:grid-cols-[240px_1fr] gap-8">
      <aside className="space-y-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={getPortalSidebarTabClassName(activeTab === tab.id)}
          >
            <span>{tab.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950/70 border border-white/8 text-slate-400">
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
          <div className={`p-4 rounded-xl text-sm border ${getPortalSyncMessageClassName(syncStatus.state)}`}>
            {syncStatus.message}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Admin Operations</h2>
            <p className="text-sm text-slate-400">This page now renders from one server-side ledger snapshot instead of fanning out through multiple dashboard API reads.</p>
          </div>
        </div>

        {children}
      </div>
    </section>
  );
}