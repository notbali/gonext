/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopNav } from "./TopNav";

vi.mock("@/app/actions", () => ({
  signInWithDiscord: vi.fn(),
  signOutAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

function renderNav(props: Partial<Parameters<typeof TopNav>[0]> = {}) {
  return render(<TopNav teamDivision="Platinum 2" isSignedIn={true} userName="Alice" {...props} />);
}

describe("TopNav on narrow screens", () => {
  it("wraps its contents onto a second row instead of overflowing, and only locks to a single 64px row from md up", () => {
    renderNav();

    const header = screen.getByRole("banner");
    expect(header).toHaveClass("flex-wrap");
    expect(header).toHaveClass("md:flex-nowrap");
    expect(header).toHaveClass("md:h-16");
    expect(header).not.toHaveClass("h-16");
  });

  it("uses tighter horizontal padding on phones than on larger screens", () => {
    renderNav();

    const header = screen.getByRole("banner");
    expect(header).toHaveClass("px-4");
    expect(header).toHaveClass("sm:px-8");
    expect(header).not.toHaveClass("px-8");
  });

  it("drops the 'Premier Scheduler' tagline below lg so the brand row fits", () => {
    renderNav();

    const tagline = screen.getByText("Premier Scheduler");
    expect(tagline).toHaveClass("hidden");
    expect(tagline).toHaveClass("lg:inline");
  });

  it("hides the division pill below sm so the brand row and login/avatar fit on one line", () => {
    renderNav();

    const pill = screen.getByText("Platinum 2").parentElement as HTMLElement;
    expect(pill).toHaveClass("hidden", "sm:flex");
    expect(pill).not.toHaveClass("flex");
  });

  it("shortens the sign-in button to 'Log in' below sm while keeping its full accessible name", () => {
    renderNav({ isSignedIn: false });

    expect(screen.getByRole("button", { name: "Log in with Discord" })).toBeInTheDocument();
    const suffix = screen.getByText("with Discord");
    expect(suffix).toHaveClass("hidden");
    expect(suffix).toHaveClass("sm:inline");
  });

  it("keeps the sign-in label in a single wrapper, so it stays one text run when .tap-target makes the button a flex container", () => {
    renderNav({ isSignedIn: false });

    // As separate flex items, the space in " with Discord" collapses and it renders "Log inwith Discord".
    const button = screen.getByRole("button", { name: "Log in with Discord" });
    expect(button.children).toHaveLength(1);
    expect(button.firstElementChild).toHaveTextContent("Log in with Discord");
  });

  it("gives the sign-in and log-out buttons touch-sized hit areas", () => {
    const { unmount } = renderNav({ isSignedIn: false });
    expect(screen.getByRole("button", { name: /log in/i })).toHaveClass("tap-target");
    unmount();

    renderNav({ isSignedIn: true });
    expect(screen.getByRole("button", { name: /log out/i })).toHaveClass("tap-target");
  });
});
