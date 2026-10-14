"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import { useHasUnseenPatchNotes } from "@/lib/patch-notes-seen";

const NAV_ITEMS = [
  { key: "schedule", label: "SCHEDULE", href: "/" },
  { key: "matches", label: "MATCHES", href: "/matches" },
  { key: "roster", label: "ROSTER", href: "/roster" },
  { key: "whats-new", label: "WHAT'S NEW", href: "/whats-new" },
  { key: "admin", label: "ADMIN", href: "/admin" },
] as const;

function activeKeyFor(pathname: string): (typeof NAV_ITEMS)[number]["key"] {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/matches")) return "matches";
  if (pathname.startsWith("/roster")) return "roster";
  if (pathname.startsWith("/whats-new")) return "whats-new";
  return "schedule";
}

export function NavTabs({ showAdmin = false }: { showAdmin?: boolean }) {
  const pathname = usePathname();
  const active = activeKeyFor(pathname);
  const items = NAV_ITEMS.filter((item) => item.key !== "admin" || showAdmin);
  const hasUnseen = useHasUnseenPatchNotes();

  return (
    <nav className="order-last flex w-full items-center justify-around md:order-none md:w-auto md:justify-start md:justify-self-center md:gap-6">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.key === active ? "page" : undefined}
          className={`tap-target relative pb-1 font-mono text-caption font-semibold tracking-wider transition-colors duration-[var(--d-micro)] ${
            item.key === active ? "text-text-primary" : "text-text-dim hover:text-text-muted"
          }`}
        >
          <span className="relative">
            {item.label}
            {item.key === "whats-new" && hasUnseen && active !== "whats-new" && (
              <span
                data-testid="nav-new-dot"
                className="absolute -right-2 -top-0.5 h-1.5 w-1.5 rounded-full bg-brand"
              >
                <span className="sr-only">(unread)</span>
              </span>
            )}
          </span>
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
