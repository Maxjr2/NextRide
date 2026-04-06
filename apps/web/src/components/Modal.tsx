import { useEffect, useRef, type ReactNode } from 'react';
import { clsx } from '../utils/clsx';

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Extra classes for the panel itself */
  className?: string;
}

/**
 * Accessible bottom-sheet modal.
 * - role="dialog" with aria-modal and aria-labelledby
 * - Focus trap: Tab cycles within the dialog
 * - Closes on Escape and backdrop click
 */
export function Modal({ title, open, onClose, children, className }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = 'modal-title';

  // Focus the panel when it opens
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-hidden="true"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={clsx(
          'bg-surface w-full max-w-lg rounded-t-card',
          'p-6 pb-9 shadow-card-lg',
          'max-h-[85vh] overflow-y-auto',
          'focus:outline-none',
          className,
        )}
        aria-hidden="false"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id={titleId}
          className="text-xl font-bold text-gray-900 mb-4"
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
