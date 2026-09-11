"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import { useHasMounted } from "@/lib/use-has-mounted";

export function Modal({
  open,
  onClose,
  children,
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  // document.body doesn't exist during SSR — calling createPortal with it directly
  // would crash the server render. Only portal after mount, once it's safe.
  const mounted = useHasMounted();

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusTarget = panel?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusTarget?.focus();

    const elementToRefocus = returnFocusRef?.current;
    return () => {
      elementToRefocus?.focus();
    };
  }, [open, returnFocusRef]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            data-testid="modal-backdrop"
            className="fixed inset-0 z-50 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.72 }}
            exit={{ opacity: 0, transition: { duration: 0.16 } }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.32, ease: EASE.out } }}
            exit={{ opacity: 0, scale: 0.97, y: -8, transition: { duration: 0.16, ease: EASE.snap } }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
