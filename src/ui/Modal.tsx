import { useEffect, type ReactNode } from 'react';
import { CloseIcon } from './icons';

export function Modal({ title, onClose, width = 'max-w-lg', children }: { title: string; onClose: () => void; width?: string; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-full w-full overflow-y-auto rounded-xl bg-white p-6 shadow-2xl ${width}`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-slate-500 hover:bg-slate-100">
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
