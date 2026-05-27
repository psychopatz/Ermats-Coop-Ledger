export default function BulletinWorkspace({
  bulletins,
  bulletinMessage,
  setBulletinMessage,
  handleSaveBulletin,
  actionLoading,
}) {
  const activeBulletin = bulletins.find((bulletin) => bulletin.status === 'active') || null;

  return (
    <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8">
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-200">Member Bulletin</h3>
        <form onSubmit={handleSaveBulletin} className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 space-y-4">
          <div>
            <p className="text-sm text-slate-400">
              This message appears at the top of the member overview. Leave it empty and save to clear the bulletin so members see the default friendly message.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Bulletin Message</label>
            <textarea
              value={bulletinMessage}
              onChange={(event) => setBulletinMessage(event.target.value)}
              rows={8}
              disabled={actionLoading}
              placeholder="Add a short update, reminder, or collection note for members..."
              className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-600 text-sm leading-6 resize-y focus:outline-none focus:border-purple-500"
            />
          </div>
          <button
            type="submit"
            disabled={actionLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all disabled:opacity-50 text-sm cursor-pointer"
          >
            {actionLoading ? 'Saving...' : bulletinMessage.trim() ? 'Publish Bulletin' : 'Clear Bulletin'}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-200">Bulletin History</h3>
        <div className="border border-slate-900 rounded-2xl bg-slate-950 overflow-hidden">
          <div className="divide-y divide-slate-900">
            {!bulletins.length ? (
              <div className="px-5 py-10 text-center text-slate-500 text-sm">
                No bulletins have been published yet.
              </div>
            ) : (
              bulletins.map((bulletin) => (
                <article key={bulletin.bulletin_id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs font-semibold text-slate-300">{bulletin.bulletin_id}</p>
                      <p className="text-xs text-slate-500">Updated {bulletin.updated_at?.split('T')[0] || 'Unknown'}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      bulletin.status === 'active'
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-500/10 border border-slate-500/30 text-slate-300'
                    }`}>
                      {bulletin.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-6">{bulletin.message || 'No message body.'}</p>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/30">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Member View</p>
          <p className="mt-3 text-sm text-slate-300 whitespace-pre-wrap leading-6">
            {activeBulletin?.message?.trim() || 'Hello there. Your latest verified payments, balances, and loan updates will appear here once the admin posts a bulletin.'}
          </p>
        </div>
      </div>
    </div>
  );
}