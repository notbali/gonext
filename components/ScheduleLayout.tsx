import type { ReactNode } from "react";

/**
 * The schedule page body: the availability grid with its sidebar. Stacks
 * (grid, then sidebar) on phones and tablets; goes side by side from lg up.
 */
export function ScheduleLayout({ children, sidebar }: { children: ReactNode; sidebar: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 px-4 py-4 sm:px-8 sm:py-6 lg:flex-row lg:gap-6">
      {children}
      <div
        data-testid="schedule-sidebar"
        className="flex w-full flex-col gap-4 lg:w-[340px] lg:shrink-0"
      >
        {sidebar}
      </div>
    </div>
  );
}
