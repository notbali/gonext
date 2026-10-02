/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { UnsetNudgeCard } from "./UnsetNudgeCard";
import { ToastProvider } from "./ToastProvider";

const writeText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  writeText.mockClear();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const missing = [
  { id: "t1", name: "Alice", avatarUrl: null, discordId: "111" },
  { id: "t2", name: "Bob", avatarUrl: null, discordId: null },
];

function renderCard(teammates = missing) {
  return render(
    <ToastProvider>
      <UnsetNudgeCard teammates={teammates} />
    </ToastProvider>,
  );
}

describe("UnsetNudgeCard", () => {
  it("names everyone with days still unset this week", () => {
    renderCard();
    expect(screen.getByTestId("unset-nudge")).toHaveTextContent("Alice");
    expect(screen.getByTestId("unset-nudge")).toHaveTextContent("Bob");
  });

  it("copies a Discord message that @s them and links this site", async () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: /copy discord ping/i }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        `<@111> Bob — you've still got days not set this week. Fill them in: ${window.location.origin}/`,
      ),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(/paste it in discord/i);
  });

  it("says so with an error toast if the clipboard refuses", async () => {
    writeText.mockRejectedValueOnce(new Error("denied"));
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: /copy discord ping/i }));
    expect(await screen.findByRole("status")).toHaveAttribute("data-variant", "error");
  });

  it("renders nothing once everyone is set", () => {
    renderCard([]);
    expect(screen.queryByTestId("unset-nudge")).toBeNull();
  });
});
