/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavTabs } from "./NavTabs";

const mockPathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

describe("NavTabs", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/");
  });

  it("marks Schedule active on the root path", () => {
    render(<NavTabs />);
    expect(screen.getByRole("link", { name: /schedule/i })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /matches/i })).not.toHaveAttribute("aria-current");
  });

  it("marks Matches active on /matches", () => {
    mockPathname.mockReturnValue("/matches");
    render(<NavTabs />);
    expect(screen.getByRole("link", { name: /matches/i })).toHaveAttribute("aria-current", "page");
  });

  it("marks Roster active on /roster", () => {
    mockPathname.mockReturnValue("/roster");
    render(<NavTabs />);
    expect(screen.getByRole("link", { name: /roster/i })).toHaveAttribute("aria-current", "page");
  });
});
