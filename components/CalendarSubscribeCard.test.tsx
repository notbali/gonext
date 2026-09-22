/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CalendarSubscribeCard } from "./CalendarSubscribeCard";

describe("CalendarSubscribeCard", () => {
  it("offers a webcal:// subscribe link for the feed", () => {
    render(<CalendarSubscribeCard feedUrl="https://gonext.example/api/calendar/abc" />);
    expect(screen.getByRole("link", { name: /subscribe/i })).toHaveAttribute(
      "href",
      "webcal://gonext.example/api/calendar/abc",
    );
  });

  it("shows the https URL for calendars that want it pasted", () => {
    render(<CalendarSubscribeCard feedUrl="https://gonext.example/api/calendar/abc" />);
    expect(screen.getByDisplayValue("https://gonext.example/api/calendar/abc")).toBeInTheDocument();
  });
});
