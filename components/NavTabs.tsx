"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";

const NAV_ITEMS = [
  { key: "schedule", label: "SCHEDULE", href: "/" },
  { key: "matches", label: "MATCHES", href: "/matches" },
  { key: "roster", label: "ROSTER", href: "/roster" },
] as const;

function activeKeyFor(pathname: string): (typeof NAV_ITEMS)[number]["key"] {
  if (pathname.startsWith("/matches")) return "matches";
  if (pathname.startsWith("/roster")) return "roster";
  return "schedule";
}

export function NavTabs() {
  const pathname = usePathname();
  const active = activeKeyFor(pathname);

  return (
    <nav className="flex items-center gap-6">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.key === active ? "page" : undefined}
          className={`relative pb-1 font-mono text-caption font-semibold tracking-wider transition-colors duration-[var(--d-micro)] ${
            item.key === active ? "text-text-primary" : "text-text-dim hover:text-text-muted"
          }`}
        >
          {item.label}
          {item.key === active && (
            <motion.span
              layoutId="nav-underline"
              data-testid="nav-underline"
              className="absolute inset-x-0 -bottom-1 h-[2px] bg-brand"
              transition={{ duration: 0.24, ease: EASE.snap }}
            />
          )}
        </Link>
      ))}
    </nav>
  );
}
