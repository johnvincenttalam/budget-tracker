import { useEffect, useRef, useState } from 'react';

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  // Reset drag state when sheet closes
  useEffect(() => {
    if (!open) {
      setDragY(0);
      setIsDragging(false);
    }
  }, [open]);

  function handleTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setDragY(delta);
    }
  }

  function handleTouchEnd() {
    setIsDragging(false);
    if (dragY > 100) {
      onClose();
    } else {
      setDragY(0);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-[80] animate-fade-in"
        style={{ opacity: isDragging ? Math.max(0.3, 1 - dragY / 400) : undefined }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`fixed inset-x-0 bottom-0 z-[90] ${isDragging ? '' : 'animate-slide-up'}`}
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s ease-out',
        }}
      >
        <div className="max-w-2xl mx-auto bg-slate-900 rounded-t-3xl max-h-[90dvh] flex flex-col shadow-2xl">
          {/* Drag handle area — touch target for swipe */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="flex justify-center pt-3 pb-2 shrink-0 cursor-grab active:cursor-grabbing"
          >
            <div className="w-10 h-1 bg-slate-700 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-3 shrink-0">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center active:bg-slate-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
