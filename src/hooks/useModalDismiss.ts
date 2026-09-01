// ==============================================================================
// Amar Dokan (আমার দোকান) Modal Behaviour Hook
// Escape to close, focus moved into the dialog and restored on close, body
// scroll locked, and a global flag the barcode listener checks so scanner
// keystrokes never leak into an open dialog.
// ==============================================================================

import { useEffect, useRef } from 'react';

let openModalCount = 0;

/** True while any dialog using this hook is on screen. */
export function isAnyModalOpen(): boolean {
  return openModalCount > 0;
}

export function useModalDismiss<T extends HTMLElement = HTMLDivElement>(
  isOpen: boolean,
  onClose?: () => void
) {
  const containerRef = useRef<T | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    openModalCount += 1;
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus into the dialog so keyboard and screen-reader users land there.
    const focusTimer = window.setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      const target = container.querySelector<HTMLElement>(
        'input:not([type="hidden"]), select, textarea, button, [href], [tabindex]:not([tabindex="-1"])'
      );
      (target ?? container).focus({ preventScroll: true });
    }, 30);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      // Keep Tab inside the dialog.
      const container = containerRef.current;
      if (!container) return;
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(
          'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      openModalCount = Math.max(0, openModalCount - 1);
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.({ preventScroll: true });
    };
  }, [isOpen, onClose]);

  return containerRef;
}
