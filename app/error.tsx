"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="font-mono text-caption font-semibold uppercase tracking-widest text-brand">
        Something went wrong
      </p>
      <p className="max-w-sm text-body text-text-muted">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="btn-press btn-glow mt-4 rounded-md bg-brand px-4 py-2.5 font-mono text-caption font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
