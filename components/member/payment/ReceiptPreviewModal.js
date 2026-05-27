'use client';

import { useEffect, useRef, useState } from 'react';
import { memberFieldClassName, memberSectionEyebrowClassName } from '@/components/member/memberTheme';

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function clampPosition(view, x, y, zoom) {
  const scaledWidth = view.renderedWidth * zoom;
  const scaledHeight = view.renderedHeight * zoom;
  const nextX = scaledWidth <= view.viewportWidth
    ? (view.viewportWidth - scaledWidth) / 2
    : clamp(x, view.viewportWidth - scaledWidth, 0);
  const nextY = scaledHeight <= view.viewportHeight
    ? (view.viewportHeight - scaledHeight) / 2
    : clamp(y, view.viewportHeight - scaledHeight, 0);

  return { x: nextX, y: nextY };
}

function createInitialView(preview, viewportWidth, viewportHeight) {
  const fitScale = Math.min(viewportWidth / preview.imageWidth, viewportHeight / preview.imageHeight);
  const renderedWidth = preview.imageWidth * fitScale;
  const renderedHeight = preview.imageHeight * fitScale;
  let zoom = 1;
  let x = (viewportWidth - renderedWidth) / 2;
  let y = (viewportHeight - renderedHeight) / 2;

  if (preview.frame) {
    const focusZoom = clamp(
      Math.max(
        2,
        Math.min(
          viewportWidth / Math.max(preview.frame.width * fitScale * 1.6, 1),
          viewportHeight / Math.max(preview.frame.height * fitScale * 3, 1)
        )
      ),
      MIN_ZOOM,
      MAX_ZOOM
    );
    const frameCenterX = (preview.frame.x + (preview.frame.width / 2)) * fitScale;
    const frameCenterY = (preview.frame.y + (preview.frame.height / 2)) * fitScale;

    zoom = focusZoom;
    x = (viewportWidth / 2) - (frameCenterX * zoom);
    y = (viewportHeight / 2) - (frameCenterY * zoom);
  }

  const clamped = clampPosition({ viewportWidth, viewportHeight, renderedWidth, renderedHeight }, x, y, zoom);

  return {
    viewportWidth,
    viewportHeight,
    renderedWidth,
    renderedHeight,
    zoom,
    x: clamped.x,
    y: clamped.y,
  };
}

export default function ReceiptPreviewModal({
  isOpen,
  preview,
  referenceCode,
  onReferenceCodeChange,
  onClose,
}) {
  const viewportRef = useRef(null);
  const dragStateRef = useRef(null);
  const [view, setView] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !preview || !viewportRef.current) {
      return undefined;
    }

    const syncView = () => {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      setView(createInitialView(preview, rect.width, rect.height));
    };

    const frame = requestAnimationFrame(syncView);
    window.addEventListener('resize', syncView);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', syncView);
    };
  }, [isOpen, preview]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !preview) {
    return null;
  }

  const updateZoom = (nextZoom) => {
    setView((current) => {
      if (!current) {
        return current;
      }

      const zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
      const focalX = (current.viewportWidth / 2 - current.x) / current.zoom;
      const focalY = (current.viewportHeight / 2 - current.y) / current.zoom;
      const x = (current.viewportWidth / 2) - (focalX * zoom);
      const y = (current.viewportHeight / 2) - (focalY * zoom);
      const clamped = clampPosition(current, x, y, zoom);

      return {
        ...current,
        zoom,
        x: clamped.x,
        y: clamped.y,
      };
    });
  };

  const updateZoomAtPoint = (nextZoom, clientX, clientY) => {
    const rect = viewportRef.current?.getBoundingClientRect();

    setView((current) => {
      if (!current || !rect) {
        return current;
      }

      const zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
      const viewportX = clientX - rect.left;
      const viewportY = clientY - rect.top;
      const focalX = (viewportX - current.x) / current.zoom;
      const focalY = (viewportY - current.y) / current.zoom;
      const x = viewportX - (focalX * zoom);
      const y = viewportY - (focalY * zoom);
      const clamped = clampPosition(current, x, y, zoom);

      return {
        ...current,
        zoom,
        x: clamped.x,
        y: clamped.y,
      };
    });
  };

  const resetView = () => {
    if (!viewportRef.current) {
      return;
    }

    const rect = viewportRef.current.getBoundingClientRect();
    setView(createInitialView(preview, rect.width, rect.height));
  };

  const handlePointerDown = (event) => {
    if (!view) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: view.x,
      originY: view.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    setView((current) => {
      if (!current) {
        return current;
      }

      const x = dragState.originX + (event.clientX - dragState.startX);
      const y = dragState.originY + (event.clientY - dragState.startY);
      const clamped = clampPosition(current, x, y, current.zoom);

      return {
        ...current,
        x: clamped.x,
        y: clamped.y,
      };
    });
  };

  const handlePointerUp = (event) => {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null;
    }
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const zoomStep = event.deltaY < 0 ? 0.3 : -0.3;

    updateZoomAtPoint((view?.zoom || 1) + zoomStep, event.clientX, event.clientY);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/72 p-2 backdrop-blur-xl sm:p-4 md:p-6">
      <button
        type="button"
        aria-label="Close receipt preview"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <div className="relative z-10 h-full overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(4,9,15,0.94),rgba(4,9,15,0.88))] shadow-[0_30px_80px_-24px_rgba(0,0,0,0.65)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_62%)]" />

        <div className="absolute inset-x-0 top-0 z-10 flex flex-col gap-3 border-b border-white/10 bg-[linear-gradient(180deg,rgba(8,16,23,0.92),rgba(8,16,23,0.62))] px-4 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className={memberSectionEyebrowClassName}>Receipt Preview</p>
            <p className="mt-1 text-sm text-slate-300">Drag to pan. Scroll or use the controls to zoom into the reference line.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
              {Math.round((view?.zoom || 1) * 100)}%
            </div>
            <button
              type="button"
              onClick={() => updateZoom((view?.zoom || 1) - 0.35)}
              className="h-10 w-10 rounded-full border border-white/10 bg-white/8 text-lg text-stone-100 hover:bg-white/12"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => updateZoom((view?.zoom || 1) + 0.35)}
              className="h-10 w-10 rounded-full border border-white/10 bg-white/8 text-lg text-stone-100 hover:bg-white/12"
            >
              +
            </button>
            <button
              type="button"
              onClick={resetView}
              className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-100 hover:bg-white/12"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-100 hover:bg-white/12"
            >
              Cancel
            </button>
          </div>
        </div>

        <div
          ref={viewportRef}
          className="absolute inset-x-0 top-[108px] bottom-[150px] overflow-hidden touch-none cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        >
          {view && (
            <img
              src={preview.sourceUrl}
              alt="Uploaded GCash receipt preview"
              draggable={false}
              className="absolute select-none max-w-none"
              style={{
                width: `${view.renderedWidth}px`,
                height: `${view.renderedHeight}px`,
                transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.zoom})`,
                transformOrigin: '0 0',
              }}
            />
          )}

          <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/10 bg-slate-950/52 px-3 py-2 text-xs font-medium text-slate-200 backdrop-blur-xl">
            Drag image to move. Scroll to zoom.
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 border-t border-white/10 bg-[linear-gradient(180deg,rgba(8,16,23,0.7),rgba(8,16,23,0.96))] px-4 py-4 backdrop-blur-2xl sm:px-6">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 lg:flex-row lg:items-end">
            <label className="flex-1 space-y-1.5">
              <span className={memberSectionEyebrowClassName}>Reference Code</span>
              <input
                type="text"
                value={referenceCode}
                onChange={(event) => onReferenceCodeChange(event.target.value)}
                className={memberFieldClassName}
                placeholder="GCash reference number"
              />
            </label>
            <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-300 lg:min-w-[240px]">
              Start by checking the line near “Ref No.”, then adjust zoom if needed.
            </div>
            <div className="flex gap-2 lg:min-w-[250px] lg:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-semibold text-stone-100 hover:bg-white/12"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl bg-[#d9e7cf] px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-[#e4efdc] shadow-[0_18px_40px_-26px_rgba(217,231,207,0.55)]"
              >
                Use This Reference
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}