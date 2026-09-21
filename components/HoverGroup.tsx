"use client";

import { createContext, useContext, useState, type ComponentPropsWithoutRef } from "react";

const HoverGroupContext = createContext(false);

/** Whether the pointer is over the nearest enclosing `HoverGroup` — the JS twin of Tailwind's `group-hover:`. */
export function useGroupHovered(): boolean {
  return useContext(HoverGroupContext);
}

/**
 * A div that tells its descendants when it's hovered, for effects CSS `group-hover:` can't drive
 * (e.g. scrambling text). Add the `group` class as usual to keep the CSS-only `group-hover:` variants working too.
 */
export function HoverGroup({ children, ...props }: ComponentPropsWithoutRef<"div">) {
  const [hovered, setHovered] = useState(false);

  return (
    <div {...props} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <HoverGroupContext value={hovered}>{children}</HoverGroupContext>
    </div>
  );
}
