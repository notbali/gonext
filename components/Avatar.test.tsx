/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "./Avatar";

describe("Avatar", () => {
  it("renders initials when there is no image source", () => {
    render(<Avatar name="Alice Smith" src={null} size={32} />);
    expect(screen.getByText("AS")).toBeInTheDocument();
  });
});
