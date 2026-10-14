/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MarkPatchNotesSeen, PatchNotesList } from "./PatchNotesList";
import { PATCH_NOTES_SEEN_KEY } from "@/lib/patch-notes-seen";

const notes = [
  { date: "2026-10-14", title: "Premier Stages", changes: ["Maps fill in on their own.", "Summit is in the pool."] },
  { date: "2026-10-02", title: "Spooky season", changes: ["The site dresses up for October."] },
];

afterEach(() => localStorage.clear());

describe("PatchNotesList", () => {
  it("renders one article per entry, in the order given", () => {
    render(<PatchNotesList notes={notes} />);
    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(2);
    expect(within(articles[0]).getByRole("heading", { name: "Premier Stages" })).toBeInTheDocument();
    expect(within(articles[1]).getByRole("heading", { name: "Spooky season" })).toBeInTheDocument();
  });

  it("dates each entry with a machine-readable time", () => {
    render(<PatchNotesList notes={notes} />);
    const time = within(screen.getAllByRole("article")[0]).getByText("Oct 14, 2026");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("datetime", "2026-10-14");
  });

  it("lists each change as a bullet", () => {
    render(<PatchNotesList notes={notes} />);
    const items = within(screen.getAllByRole("article")[0]).getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual(["Maps fill in on their own.", "Summit is in the pool."]);
  });

  it("tags only the newest entry as latest", () => {
    render(<PatchNotesList notes={notes} />);
    const [newest, older] = screen.getAllByRole("article");
    expect(within(newest).getByText(/latest/i)).toBeInTheDocument();
    expect(within(older).queryByText(/latest/i)).not.toBeInTheDocument();
  });

  it("says so when there are no notes yet", () => {
    render(<PatchNotesList notes={[]} />);
    expect(screen.getByText(/nothing new yet/i)).toBeInTheDocument();
  });
});

describe("MarkPatchNotesSeen", () => {
  it("records the latest date once the page is open, and renders nothing", () => {
    const { container } = render(<MarkPatchNotesSeen latest="2026-10-14" />);
    expect(localStorage.getItem(PATCH_NOTES_SEEN_KEY)).toBe("2026-10-14");
    expect(container).toBeEmptyDOMElement();
  });
});
