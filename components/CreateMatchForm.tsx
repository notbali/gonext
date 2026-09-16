"use client";

import { useRef, useTransition } from "react";
import { useToast } from "@/components/ToastProvider";

export function CreateMatchForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await action(formData);
        addToast({ message: "Match added.", variant: "success" });
        formRef.current?.reset();
      } catch (err) {
        addToast({
          message: err instanceof Error ? err.message : "Something went wrong.",
          variant: "error",
        });
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="mt-8 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <div>
        <label htmlFor="match-date" className="block font-mono text-caption text-text-dim">
          Date
        </label>
        <input
          id="match-date"
          type="date"
          name="date"
          required
          disabled={isPending}
          className="mt-1 rounded border border-border bg-surface-raised px-2 py-1.5 text-body text-text-primary disabled:opacity-60"
        />
      </div>
      <div>
        <label htmlFor="match-time" className="block font-mono text-caption text-text-dim">
          Time
        </label>
        <input
          id="match-time"
          type="time"
          name="time"
          required
          disabled={isPending}
          className="mt-1 rounded border border-border bg-surface-raised px-2 py-1.5 text-body text-text-primary disabled:opacity-60"
        />
      </div>
      <label
        htmlFor="match-playoffs"
        className="flex items-center gap-2 pb-1.5 font-mono text-caption text-text-dim"
      >
        <input
          id="match-playoffs"
          type="checkbox"
          name="isPlayoffs"
          disabled={isPending}
          className="h-4 w-4 rounded border-border bg-surface-raised accent-warning disabled:opacity-60"
        />
        Playoffs match
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="btn-press btn-glow rounded-md bg-brand px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-white disabled:opacity-60"
      >
        Add match
      </button>
    </form>
  );
}
