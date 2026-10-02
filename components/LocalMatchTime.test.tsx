/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocalMatchTime } from "./LocalMatchTime";

const wed8pmEastern = new Date("2026-09-24T00:00:00.000Z");

describe("LocalMatchTime", () => {
  it("shows the match in a non-Eastern viewer's own time, weekday included", () => {
    render(<LocalMatchTime date={wed8pmEastern} timeZone="America/Los_Angeles" />);
    expect(screen.getByTestId("local-time")).toHaveTextContent("Your time · Wed 5:00 PM PDT");
  });

  it("rolls the weekday over when the viewer is already into the next day", () => {
    render(<LocalMatchTime date={wed8pmEastern} timeZone="Europe/London" />);
    expect(screen.getByTestId("local-time")).toHaveTextContent(/Your time · Thu 1:00 AM (BST|GMT\+1)/);
  });

  it("stays out of the way for a viewer already on Eastern time", () => {
    render(<LocalMatchTime date={wed8pmEastern} timeZone="America/New_York" />);
    expect(screen.queryByTestId("local-time")).toBeNull();
  });

  it("treats another zone that's on Eastern time as Eastern", () => {
    render(<LocalMatchTime date={wed8pmEastern} timeZone="America/Toronto" />);
    expect(screen.queryByTestId("local-time")).toBeNull();
  });

  it("uses the browser's own zone by default", () => {
    // The suite runs with TZ=UTC.
    render(<LocalMatchTime date={wed8pmEastern} />);
    expect(screen.getByTestId("local-time")).toHaveTextContent("Your time · Thu 12:00 AM UTC");
  });
});
