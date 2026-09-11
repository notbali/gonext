"use client";

import { useTransition, type ReactNode } from "react";
import { useToast } from "@/components/ToastProvider";

/**
 * Wraps a server action so its result reports through the toast system.
 * Replaces a plain `<form action={fn}>` + submit button wherever the caller
 * wants success/failure feedback, without giving up the button's own styling.
 */
export function ActionForm({
  action,
  successMessage,
  children,
  className,
}: {
  action: () => Promise<void>;
  successMessage: string;
  children: ReactNode;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  function handleClick() {
    startTransition(async () => {
      try {
        await action();
        addToast({ message: successMessage, variant: "success" });
      } catch (err) {
        addToast({
          message: err instanceof Error ? err.message : "Something went wrong.",
          variant: "error",
        });
      }
    });
  }

  return (
    <button type="button" disabled={isPending} onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
