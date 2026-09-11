/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { FaviconController } from "./FaviconController";

function mockDocumentHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
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

    const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    const hrefBefore = link.href;
    vi.advanceTimersByTime(2100);
    expect(link.href).not.toBe(hrefBefore);
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

    const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    const hrefBefore = link.href;
    vi.advanceTimersByTime(1100);
    expect(link.href).not.toBe(hrefBefore);
  });

  it("does not alternate for a match more than 30 minutes out", () => {
    mockDocumentHidden(true);
    const nearestMatchDate = new Date(Date.now() + 45 * 60_000);
    const setIntervalSpy = vi.spyOn(window, "setInterval");
    render(<FaviconController hasUnsetDays={false} nearestMatchDate={nearestMatchDate} />);
    fireVisibilityChange();
    expect(setIntervalSpy).not.toHaveBeenCalled();
  });
});
