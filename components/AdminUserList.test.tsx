/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AdminUserList, type AdminTeammateRow, type AdminUnassignedRow } from "./AdminUserList";
import { ToastProvider } from "./ToastProvider";

function teammate(id: string, name: string, overrides: Partial<AdminTeammateRow> = {}): AdminTeammateRow {
  return { id, name, image: null, discordId: `d-${id}`, isCoach: false, active: true, ...overrides };
}

function unassigned(id: string, name: string): AdminUnassignedRow {
  return { id, name, image: null, discordId: `d-${id}` };
}

function actions() {
  return {
    addUserToTeam: vi.fn().mockResolvedValue(undefined),
    deactivateTeammate: vi.fn().mockResolvedValue(undefined),
    reactivateTeammate: vi.fn().mockResolvedValue(undefined),
    promoteTeammate: vi.fn().mockResolvedValue(undefined),
    demoteTeammate: vi.fn().mockResolvedValue(undefined),
  };
}

function renderList(
  props: Partial<Parameters<typeof AdminUserList>[0]> = {},
  handlers = actions(),
) {
  render(
    <ToastProvider>
      <AdminUserList teammates={[]} unassignedUsers={[]} canAddToTeam={true} {...handlers} {...props} />
    </ToastProvider>,
  );
  return handlers;
}

function section(name: RegExp) {
  return screen.getByRole("region", { name });
}

describe("AdminUserList", () => {
  it("groups users into Coaches, Players, Inactive and Not on team sections with counts", () => {
    renderList({
      teammates: [
        teammate("a", "Alice", { isCoach: true }),
        teammate("b", "Bob"),
        teammate("c", "Cara"),
        teammate("d", "Dan", { active: false }),
      ],
      unassignedUsers: [unassigned("e", "Eve")],
    });

    expect(within(section(/coaches/i)).getByText("Alice")).toBeInTheDocument();
    expect(within(section(/players/i)).getByText("Bob")).toBeInTheDocument();
    expect(within(section(/players/i)).getByText("Cara")).toBeInTheDocument();
    expect(within(section(/inactive/i)).getByText("Dan")).toBeInTheDocument();
    expect(within(section(/not on team/i)).getByText("Eve")).toBeInTheDocument();
    expect(within(section(/players/i)).getByText("2")).toBeInTheDocument();
  });

  it("puts an inactive coach under Inactive, not Coaches", () => {
    renderList({ teammates: [teammate("a", "Alice", { isCoach: true, active: false })] });

    expect(within(section(/inactive/i)).getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /coaches/i })).not.toBeInTheDocument();
  });

  it("shows each user's Discord id so same-named accounts can be told apart", () => {
    renderList({ teammates: [teammate("a", "Alice", { discordId: "123456789" })] });

    expect(screen.getByText("123456789")).toBeInTheDocument();
  });

  it("offers Demote and Remove on an active coach", () => {
    const handlers = renderList({ teammates: [teammate("a", "Alice", { isCoach: true })] });

    fireEvent.click(within(section(/coaches/i)).getByRole("button", { name: /demote alice/i }));
    fireEvent.click(within(section(/coaches/i)).getByRole("button", { name: /remove alice/i }));

    expect(handlers.demoteTeammate).toHaveBeenCalledWith("a");
    expect(handlers.deactivateTeammate).toHaveBeenCalledWith("a");
  });

  it("offers Make Coach and Remove on an active player", () => {
    const handlers = renderList({ teammates: [teammate("b", "Bob")] });

    fireEvent.click(screen.getByRole("button", { name: /make bob a coach/i }));
    fireEvent.click(screen.getByRole("button", { name: /remove bob/i }));

    expect(handlers.promoteTeammate).toHaveBeenCalledWith("b");
    expect(handlers.deactivateTeammate).toHaveBeenCalledWith("b");
  });

  it("offers Reactivate on an inactive teammate", () => {
    const handlers = renderList({ teammates: [teammate("d", "Dan", { active: false })] });

    fireEvent.click(screen.getByRole("button", { name: /reactivate dan/i }));

    expect(handlers.reactivateTeammate).toHaveBeenCalledWith("d");
  });

  it("offers Add to team on an unassigned user", () => {
    const handlers = renderList({ unassignedUsers: [unassigned("e", "Eve")] });

    fireEvent.click(screen.getByRole("button", { name: /add eve to team/i }));

    expect(handlers.addUserToTeam).toHaveBeenCalledWith("e");
  });

  it("hides Add to team when there's no team to add to", () => {
    renderList({ unassignedUsers: [unassigned("e", "Eve")], canAddToTeam: false });

    expect(screen.queryByRole("button", { name: /add eve to team/i })).not.toBeInTheDocument();
  });

  it("filters every section by name or Discord id", () => {
    renderList({
      teammates: [teammate("a", "Alice", { isCoach: true }), teammate("b", "Bob", { discordId: "4242" })],
      unassignedUsers: [unassigned("e", "Eve")],
    });

    const search = screen.getByRole("searchbox", { name: /search users/i });
    fireEvent.change(search, { target: { value: "ali" } });
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    expect(screen.queryByText("Eve")).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "4242" } });
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("says so when nothing matches the search", () => {
    renderList({ teammates: [teammate("a", "Alice")] });

    fireEvent.change(screen.getByRole("searchbox", { name: /search users/i }), { target: { value: "zzz" } });

    expect(screen.getByText(/no users match/i)).toBeInTheDocument();
  });

  it("shows an error toast when an action rejects", async () => {
    renderList(
      { teammates: [teammate("b", "Bob")] },
      { ...actions(), deactivateTeammate: vi.fn().mockRejectedValue(new Error("Only an admin can do this.")) },
    );

    fireEvent.click(screen.getByRole("button", { name: /remove bob/i }));

    await waitFor(() => expect(screen.getByText("Only an admin can do this.")).toBeInTheDocument());
  });

  it("gives every action a touch-sized hit area", () => {
    renderList({
      teammates: [teammate("a", "Alice", { isCoach: true }), teammate("b", "Bob"), teammate("d", "Dan", { active: false })],
      unassignedUsers: [unassigned("e", "Eve")],
    });

    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveClass("tap-target");
    }
  });
});
