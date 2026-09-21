import type { ReactNode } from "react";

/** Shared shell for the centered, single-column pages (Matches, Roster). */
export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg">
      <div
        data-testid="page-container-inner"
        className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-8"
      >
        {children}
      </div>
    </div>
  );
}
