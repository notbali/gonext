/** @vitest-environment jsdom */
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import DecryptedText from "./DecryptedText";

const SPEED = 50;

beforeEach(() => {
  vi.useFakeTimers();
  // Reduced motion is off unless a test opts in.
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** The characters a sighted user sees (the aria-hidden layer), as one string. */
function visibleText(container: HTMLElement): string {
  return container.querySelector('[aria-hidden="true"]')!.textContent ?? "";
}

function tick(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

// A one-character alphabet makes the scrambled text deterministic: "ASCENT" -> "######".
const controlled = {
  text: "ASCENT",
  animateOn: "controlled" as const,
  sequential: true,
  speed: SPEED,
  characters: "#",
};

describe("DecryptedText (controlled)", () => {
  it("starts scrambled when inactive, keeping its length", () => {
    const { container } = render(<DecryptedText {...controlled} active={false} />);

    expect(visibleText(container)).toBe("######");
  });

  it("keeps the real text for screen readers while the visible text is scrambled", () => {
    const { container } = render(<DecryptedText {...controlled} active={false} />);

    const readable = screen.getByText("ASCENT");
    expect(readable).not.toHaveAttribute("aria-hidden");
    expect(container.querySelector('[aria-hidden="true"]')).not.toContainElement(readable);
  });

  it("starts fully readable, with no animation, when it mounts active", () => {
    const { container } = render(<DecryptedText {...controlled} active />);

    expect(visibleText(container)).toBe("ASCENT");
  });

  it("leaves spaces alone when scrambling", () => {
    const { container } = render(<DecryptedText {...controlled} text="MAP TBD" active={false} />);

    expect(visibleText(container)).toBe("### ###");
  });

  it("decrypts one letter per tick, front to back, once activated", () => {
    const { container, rerender } = render(<DecryptedText {...controlled} active={false} />);

    rerender(<DecryptedText {...controlled} active />);
    tick(SPEED * 3);

    expect(visibleText(container)).toBe("ASC###");
  });

  it("finishes fully decrypted in exactly one tick per letter", () => {
    const { container, rerender } = render(<DecryptedText {...controlled} active={false} />);

    rerender(<DecryptedText {...controlled} active />);
    tick(SPEED * "ASCENT".length);

    expect(visibleText(container)).toBe("ASCENT");
  });

  it("re-encrypts from the last letter back once deactivated", () => {
    const { container, rerender } = render(<DecryptedText {...controlled} active />);

    rerender(<DecryptedText {...controlled} active={false} />);
    tick(SPEED);
    expect(visibleText(container)).toBe("ASCEN#");

    tick(SPEED * 5);
    expect(visibleText(container)).toBe("######");
  });

  it("re-encrypts from where a half-finished decrypt got to, without flashing the full text", () => {
    const { container, rerender } = render(<DecryptedText {...controlled} active={false} />);
    rerender(<DecryptedText {...controlled} active />);
    tick(SPEED * 3);
    expect(visibleText(container)).toBe("ASC###");

    rerender(<DecryptedText {...controlled} active={false} />);
    tick(SPEED);

    expect(visibleText(container)).toBe("AS####");
  });

  it("resumes decrypting from where a half-finished encrypt got to", () => {
    const { container, rerender } = render(<DecryptedText {...controlled} active />);
    rerender(<DecryptedText {...controlled} active={false} />);
    tick(SPEED * 2);
    expect(visibleText(container)).toBe("ASCE##");

    rerender(<DecryptedText {...controlled} active />);
    tick(SPEED);

    expect(visibleText(container)).toBe("ASCEN#");
  });

  it("ends fully encrypted when de-activated mid-decrypt, and fully decrypted when re-activated mid-encrypt", () => {
    const { container, rerender } = render(<DecryptedText {...controlled} active={false} />);

    rerender(<DecryptedText {...controlled} active />);
    tick(SPEED * 2);
    rerender(<DecryptedText {...controlled} active={false} />);
    tick(SPEED * 10);
    expect(visibleText(container)).toBe("######");

    rerender(<DecryptedText {...controlled} active />);
    tick(SPEED * 2);
    rerender(<DecryptedText {...controlled} active={false} />);
    tick(SPEED);
    rerender(<DecryptedText {...controlled} active />);
    tick(SPEED * 10);
    expect(visibleText(container)).toBe("ASCENT");
  });

  it("applies className to revealed letters and encryptedClassName to scrambled ones", () => {
    const { container, rerender } = render(
      <DecryptedText {...controlled} active={false} className="revealed" encryptedClassName="encrypted" />,
    );

    rerender(<DecryptedText {...controlled} active className="revealed" encryptedClassName="encrypted" />);
    tick(SPEED * 2);

    const letters = Array.from(container.querySelectorAll('[aria-hidden="true"] > span'));
    expect(letters.map((l) => l.className)).toEqual([
      "revealed",
      "revealed",
      "encrypted",
      "encrypted",
      "encrypted",
      "encrypted",
    ]);
  });

  it("stays in sync under React StrictMode's double-invoked updaters and effects", () => {
    const { container, rerender } = render(
      <StrictMode>
        <DecryptedText {...controlled} active />
      </StrictMode>,
    );

    rerender(
      <StrictMode>
        <DecryptedText {...controlled} active={false} />
      </StrictMode>,
    );
    tick(SPEED);
    expect(visibleText(container)).toBe("ASCEN#");
    tick(SPEED * 5);
    expect(visibleText(container)).toBe("######");

    rerender(
      <StrictMode>
        <DecryptedText {...controlled} active />
      </StrictMode>,
    );
    tick(SPEED * 6);
    expect(visibleText(container)).toBe("ASCENT");
  });

  it("decrypts from the last letter first when revealDirection is 'end'", () => {
    const { container, rerender } = render(<DecryptedText {...controlled} revealDirection="end" active={false} />);

    rerender(<DecryptedText {...controlled} revealDirection="end" active />);
    tick(SPEED);
    expect(visibleText(container)).toBe("#####T");

    tick(SPEED * 5);
    expect(visibleText(container)).toBe("ASCENT");
  });

  it("skips the scramble entirely under prefers-reduced-motion", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    );

    const { container, rerender } = render(<DecryptedText {...controlled} active={false} />);
    expect(visibleText(container)).toBe("ASCENT");

    rerender(<DecryptedText {...controlled} active />);
    tick(SPEED * 10);
    expect(visibleText(container)).toBe("ASCENT");
  });
});

describe("DecryptedText (upstream trigger modes)", () => {
  it("hover: flickers through random characters on enter, then settles on the real text", () => {
    const { container } = render(
      <DecryptedText text="ASCENT" animateOn="hover" speed={SPEED} maxIterations={4} characters="#" />,
    );
    expect(visibleText(container)).toBe("ASCENT");

    fireEvent.mouseEnter(container.firstElementChild!);
    tick(SPEED);
    expect(visibleText(container)).toBe("######");

    tick(SPEED * 4);
    expect(visibleText(container)).toBe("ASCENT");
  });

  it("hover: snaps back to the real text on leave", () => {
    const { container } = render(
      <DecryptedText text="ASCENT" animateOn="hover" speed={SPEED} maxIterations={10} characters="#" />,
    );

    fireEvent.mouseEnter(container.firstElementChild!);
    tick(SPEED);
    fireEvent.mouseLeave(container.firstElementChild!);

    expect(visibleText(container)).toBe("ASCENT");
  });

  it("click (toggle): starts scrambled, decrypts on click, and re-encrypts on the next", () => {
    const { container } = render(
      <DecryptedText
        text="ASCENT"
        animateOn="click"
        clickMode="toggle"
        sequential
        speed={SPEED}
        characters="#"
      />,
    );
    expect(visibleText(container)).toBe("######");

    fireEvent.click(container.firstElementChild!);
    tick(SPEED * 6);
    expect(visibleText(container)).toBe("ASCENT");

    fireEvent.click(container.firstElementChild!);
    tick(SPEED * 6);
    expect(visibleText(container)).toBe("######");
  });

  it("view: animates once the element scrolls into view", () => {
    let notify: (entries: { isIntersecting: boolean }[]) => void = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: typeof notify) {
          notify = cb;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );

    const { container } = render(
      <DecryptedText text="ASCENT" animateOn="view" sequential speed={SPEED} characters="#" />,
    );

    act(() => notify([{ isIntersecting: true }]));
    tick(SPEED);
    expect(visibleText(container)).toBe("A#####");

    tick(SPEED * 5);
    expect(visibleText(container)).toBe("ASCENT");
  });
});
