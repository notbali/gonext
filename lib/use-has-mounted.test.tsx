/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { useHasMounted } from "./use-has-mounted";

function Probe() {
  const mounted = useHasMounted();
  return <span>{mounted ? "mounted" : "not-mounted"}</span>;
}

describe("useHasMounted", () => {
  it("is true once rendered on the client", () => {
    render(<Probe />);
    expect(screen.getByText("mounted")).toBeInTheDocument();
  });
});
