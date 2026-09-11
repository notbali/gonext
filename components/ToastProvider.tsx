"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast as toastVariant } from "@/lib/motion";
import { useHasMounted } from "@/lib/use-has-mounted";

type ToastVariant = "success" | "error";
type ToastItem = { id: number; message: string; variant: ToastVariant };

const AUTO_DISMISS_MS = 3400;

const ToastContext = createContext<{
  addToast: (toast: { message: string; variant?: ToastVariant }) => void;
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

  const addToast = useCallback(({ message, variant = "success" }: { message: string; variant?: ToastVariant }) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, AUTO_DISMISS_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed bottom-7 right-7 z-50 flex flex-col gap-2">
            <AnimatePresence>
              {toasts.map((t) => (
                <motion.div
                  key={t.id}
                  role="status"
                  data-variant={t.variant}
                  className={`pointer-events-auto flex min-w-[300px] items-start gap-3 rounded-lg border bg-surface-raised py-3 pl-3 pr-4 shadow-lg ${
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
                </motion.div>
              ))}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
