import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loadDuePings = vi.fn();
vi.mock("@/lib/bot-pings-data", () => ({ loadDuePings: (...args: unknown[]) => loadDuePings(...args) }));

const { GET } = await import("./route");

function request(token?: string) {
  return new Request("https://gonext.example/api/bot/pings", {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

beforeEach(() => {
  loadDuePings.mockReset().mockResolvedValue([{ key: "k", content: "hi", mentionUserIds: [] }]);
  vi.stubEnv("BOT_API_SECRET", "s3cret");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/bot/pings", () => {
  it("rejects a request with no token", async () => {
    const res = await GET(request());
    expect(res.status).toBe(401);
    expect(loadDuePings).not.toHaveBeenCalled();
  });

  it("rejects a wrong token", async () => {
    const res = await GET(request("nope"));
    expect(res.status).toBe(401);
  });

  it("refuses everyone when no secret is configured", async () => {
    vi.stubEnv("BOT_API_SECRET", "");
    const res = await GET(request(""));
    expect(res.status).toBe(503);
    expect(loadDuePings).not.toHaveBeenCalled();
  });

  it("returns the due pings, linking back to this site", async () => {
    const res = await GET(request("s3cret"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ pings: [{ key: "k", content: "hi", mentionUserIds: [] }] });
    expect(loadDuePings).toHaveBeenCalledWith(expect.any(Date), "https://gonext.example");
  });

  it("is never cached", async () => {
    const res = await GET(request("s3cret"));
    expect(res.headers.get("cache-control")).toMatch(/no-store/);
  });
});
