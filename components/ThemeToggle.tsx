"use client";

import { applyTheme, useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const theme = useTheme();
  const next = theme === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="tap-target btn-press rounded-md p-1.5 text-text-dim transition-colors duration-[var(--d-micro)] hover:text-text-primary"
    >
      {theme === "light" ? (
        // Moon: go dark.
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
          <path d="M6.2 1.3a6.5 6.5 0 1 0 8.5 8.5A5.5 5.5 0 0 1 6.2 1.3Z" />
        </svg>
      ) : (
        // Sun: go light.
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="8" cy="8" r="3" />
          <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1" />
        </svg>
      )}
    </button>
  );
}
