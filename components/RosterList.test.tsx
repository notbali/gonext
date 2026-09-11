/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { RosterList } from "./RosterList";
import { ToastProvider } from "./ToastProvider";

function teammate(id: string, name: string, overrides: Partial<Parameters<typeof RosterList>[0]["teammates"][number]> = {}) {
  return { id, name, image: null, isCoach: false, completeness: 0.5, ...overrides };
}

function renderList(
  teammates: ReturnType<typeof teammate>[],
  overrides: Partial<Parameters<typeof RosterList>[0]> = {},
) {
  return render(
    <ToastProvider>
      <RosterList
        teammates={teammates}
        viewerIsCoach={true}
        promoteTeammate={vi.fn().mockResolvedValue(undefined)}
        deactivateTeammate={vi.fn().mockResolvedValue(undefined)}
        {...overrides}
      />
    </ToastProvider>,
  );
}

describe("RosterList", () => {
  it("renders one row per teammate", () => {
    renderList([teammate("a", "Alice"), teammate("b", "Bob")]);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("mounts a newly-joined teammate", () => {
    const { rerender } = render(
      <ToastProvider>
        <RosterList
          teammates={[teammate("a", "Alice")]}
          viewerIsCoach={true}
          promoteTeammate={vi.fn()}
          deactivateTeammate={vi.fn()}
        />
      </ToastProvider>,
    );
    rerender(
      <ToastProvider>
        <RosterList
          teammates={[teammate("a", "Alice"), teammate("b", "Bob")]}
          viewerIsCoach={true}
          promoteTeammate={vi.fn()}
          deactivateTeammate={vi.fn()}
        />
      </ToastProvider>,
    );
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("keeps a removed teammate mounted through the exit animation, then removes them", async () => {
    const { rerender } = render(
      <ToastProvider>
        <RosterList
          teammates={[teammate("a", "Alice"), teammate("b", "Bob")]}
          viewerIsCoach={true}
          promoteTeammate={vi.fn()}
          deactivateTeammate={vi.fn()}
        />
      </ToastProvider>,
    );
    rerender(
      <ToastProvider>
        <RosterList
          teammates={[teammate("a", "Alice")]}
          viewerIsCoach={true}
          promoteTeammate={vi.fn()}
          deactivateTeammate={vi.fn()}
        />
      </ToastProvider>,
    );

    expect(screen.getByText("Bob")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Bob")).not.toBeInTheDocument());
  });

  it("shows a completeness ring for each teammate", () => {
    renderList([teammate("a", "Alice", { completeness: 1 })]);
    expect(screen.getByTestId("availability-ring")).toHaveAttribute("data-complete");
  });

  it("hides Make Coach / Remove for a teammate who is already a Coach", () => {
    renderList([teammate("a", "Alice", { isCoach: true })]);
    expect(screen.queryByRole("button", { name: "Make Coach" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });

  it("hides coach actions entirely for a non-coach viewer", () => {
    renderList([teammate("a", "Alice")], { viewerIsCoach: false });
    expect(screen.queryByRole("button", { name: "Make Coach" })).not.toBeInTheDocument();
  });
});
