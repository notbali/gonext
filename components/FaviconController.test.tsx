/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { FaviconController } from "./FaviconController";

function mockDocumentHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
}

/** The icon the browser actually shows: the last `rel="icon"` link in the head. */
function shownIcon(): string {
  const links = document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"]');
  return links[links.length - 1].href;
}

function fireVisibilityChange() {
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,fake");

  const link = document.createElement("link");
  link.rel = "icon";
  link.href = "/favicon.ico";
  document.head.appendChild(link);

  mockDocumentHidden(false);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.querySelectorAll('link[rel="icon"]').forEach((el) => el.remove());
});

describe("FaviconController", () => {
  it("does nothing while the tab is visible, even with unset days", () => {
    const setIntervalSpy = vi.spyOn(window, "setInterval");
    render(<FaviconController hasUnsetDays={true} nearestMatchDate={null} />);
    expect(setIntervalSpy).not.toHaveBeenCalled();
  });

  it("does nothing when hidden with no signals to report", () => {
    mockDocumentHidden(true);
    const setIntervalSpy = vi.spyOn(window, "setInterval");
    render(<FaviconController hasUnsetDays={false} nearestMatchDate={null} />);
    fireVisibilityChange();
    expect(setIntervalSpy).not.toHaveBeenCalled();
  });

  it("pulses while hidden with unset availability days", () => {
    mockDocumentHidden(true);
    render(<FaviconController hasUnsetDays={true} nearestMatchDate={null} />);
    fireVisibilityChange();

    const hrefBefore = shownIcon();
    vi.advanceTimersByTime(2100);
    expect(shownIcon()).not.toBe(hrefBefore);
  });

  it("stops pulsing once the tab regains focus", () => {
    mockDocumentHidden(true);
    render(<FaviconController hasUnsetDays={true} nearestMatchDate={null} />);
    fireVisibilityChange();

    const clearIntervalSpy = vi.spyOn(window, "clearInterval");
    mockDocumentHidden(false);
    fireVisibilityChange();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("alternates red/white when a match starts within 30 minutes", () => {
    mockDocumentHidden(true);
    const nearestMatchDate = new Date(Date.now() + 15 * 60_000);
    render(<FaviconController hasUnsetDays={false} nearestMatchDate={nearestMatchDate} />);
    fireVisibilityChange();

    const hrefBefore = shownIcon();
    vi.advanceTimersByTime(1100);
    expect(shownIcon()).not.toBe(hrefBefore);
  });

  it("does not alternate for a match more than 30 minutes out", () => {
    mockDocumentHidden(true);
    const nearestMatchDate = new Date(Date.now() + 45 * 60_000);
    const setIntervalSpy = vi.spyOn(window, "setInterval");
    render(<FaviconController hasUnsetDays={false} nearestMatchDate={nearestMatchDate} />);
    fireVisibilityChange();
    expect(setIntervalSpy).not.toHaveBeenCalled();
  });

  describe("halloween season", () => {
    const iconHref = shownIcon;

    beforeEach(() => {
      let frame = 0;
      vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockImplementation(() => `data:image/png;base64,frame${frame++}`);
    });

    it("shows a pumpkin while the tab is visible, without any animation", () => {
      const setIntervalSpy = vi.spyOn(window, "setInterval");
      render(<FaviconController season="halloween" hasUnsetDays={false} nearestMatchDate={null} />);
      expect(iconHref()).toMatch(/^data:image\/png/);
      expect(setIntervalSpy).not.toHaveBeenCalled();
    });

    it("flickers the pumpkin's eyes while hidden with unset days", () => {
      mockDocumentHidden(true);
      render(<FaviconController season="halloween" hasUnsetDays={true} nearestMatchDate={null} />);
      fireVisibilityChange();
      const before = iconHref();
      vi.advanceTimersByTime(2100);
      expect(iconHref()).not.toBe(before);
    });

    it("goes back to the still pumpkin, not the default icon, once the tab regains focus", () => {
      mockDocumentHidden(true);
      render(<FaviconController season="halloween" hasUnsetDays={true} nearestMatchDate={null} />);
      fireVisibilityChange();
      vi.advanceTimersByTime(4100);
      mockDocumentHidden(false);
      fireVisibilityChange();
      expect(iconHref()).toMatch(/^data:image\/png/);
      expect(iconHref()).not.toContain("favicon.ico");
    });

    it("adds its own icon link rather than rewriting the page's", () => {
      render(<FaviconController season="halloween" hasUnsetDays={false} nearestMatchDate={null} />);
      const links = document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"]');
      expect(links).toHaveLength(2);
      expect(links[0].href).toContain("/favicon.ico");
    });

    it("stays the shown icon when the page adds another icon link after it", async () => {
      render(<FaviconController season="halloween" hasUnsetDays={false} nearestMatchDate={null} />);
      // Next.js re-renders its metadata <link rel="icon"> into the head on its own schedule.
      const late = document.createElement("link");
      late.rel = "icon";
      late.href = "/favicon.ico?late";
      document.head.appendChild(late);
      await Promise.resolve();

      expect(iconHref()).toMatch(/^data:image\/png/);
    });

    it("restores the default icon when unmounted", () => {
      const { unmount } = render(<FaviconController season="halloween" hasUnsetDays={false} nearestMatchDate={null} />);
      unmount();
      expect(iconHref()).toContain("/favicon.ico");
    });
  });
});
