"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast as toastVariant } from "@/lib/motion";
import { useHasMounted } from "@/lib/use-has-mounted";

type ToastVariant = "success" | "error";
type ToastAction = { label: string; onClick: () => void };
type ToastInput = {
  message: string;
  variant?: ToastVariant;
  /** A button on the toast (e.g. Undo); using it dismisses the toast. */
  action?: ToastAction;
  /** A new toast replaces any showing toast with the same key, instead of stacking. */
  key?: string;
};
type ToastItem = { id: number; message: string; variant: ToastVariant; action?: ToastAction; key?: string };

const AUTO_DISMISS_MS = 3400;
/** Toasts with an action stay up longer, so there's time to reach for it. */
const ACTION_DISMISS_MS = 6000;

const ToastContext = createContext<{
  addToast: (toast: ToastInput) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // The portal target (document.body) doesn't exist during SSR, so its presence
  // must match on the client's first (hydration) render too.
  const mounted = useHasMounted();

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ message, variant = "success", action, key }: ToastInput) => {
      const id = nextId++;
      setToasts((prev) => [
        ...(key ? prev.filter((t) => t.key !== key) : prev),
        { id, message, variant, action, key },
      ]);
      setTimeout(() => dismiss(id), action ? ACTION_DISMISS_MS : AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 sm:inset-x-auto sm:bottom-7 sm:right-7">
            <AnimatePresence>
              {toasts.map((t) => (
                <motion.div
                  key={t.id}
                  role="status"
                  data-variant={t.variant}
                  className={`pointer-events-auto flex w-full items-start gap-3 rounded-lg border bg-surface-raised py-3 pl-3 pr-4 shadow-lg sm:w-auto sm:min-w-[300px] ${
                    t.variant === "error" ? "border-danger/40" : "border-primary/40"
                  }`}
                  initial={toastVariant.hidden}
                  animate={toastVariant.visible}
                  exit={toastVariant.exit}
                >
                  <span
                    className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                      t.variant === "error" ? "bg-danger" : "bg-primary"
                    }`}
                  />
                  <span className="text-body text-text-primary">{t.message}</span>
                  {t.action && (
                    <button
                      type="button"
                      onClick={() => {
                        t.action!.onClick();
                        dismiss(t.id);
                      }}
                      className="btn-press tap-target ml-auto shrink-0 font-mono text-[11px] font-semibold uppercase tracking-wider text-brand-bright hover:text-brand"
                    >
                      {t.action.label}
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
