'use client';

import { memberInfoCardClassName, memberSectionEyebrowClassName } from '@/components/member/memberTheme';

export default function ReceiptPreviewCard({ preview, referenceCode, onOpen, onClear }) {
  return (
    <div className={`${memberInfoCardClassName} receipt-spotlight`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={memberSectionEyebrowClassName}>Receipt Preview</p>
          <p className="mt-1 text-sm text-slate-300/80">Open the fullscreen viewer to inspect the receipt and keep the reference input fixed at the bottom.</p>
        </div>
        {preview && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300 hover:text-white hover:bg-white/8 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {preview ? (
        <>
          <div className="rounded-[28px] border border-white/10 bg-white/6 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">Detected reference</p>
            <p className="mt-2 font-mono text-lg text-stone-50">{preview.extractedCode || referenceCode || 'Review manually'}</p>
          </div>
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/92 p-3">
            <img
              src={preview.cropUrl || preview.sourceUrl}
              alt="Receipt preview thumbnail"
              className="w-full h-auto max-h-[220px] object-contain"
            />
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-semibold text-stone-100 hover:bg-white/12 cursor-pointer"
          >
            Open Fullscreen Preview
          </button>
        </>
      ) : (
        <div className="rounded-[28px] border border-dashed border-white/14 bg-slate-950/40 px-5 py-10 text-center text-sm text-slate-400">
          Upload a GCash screenshot to open a fullscreen receipt viewer.
        </div>
      )}
    </div>
  );
}