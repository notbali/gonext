import { timingSafeEqual } from "node:crypto";
import { loadDuePings } from "@/lib/bot-pings-data";

// Polled by the Discord bot (bali-bot's premier cog); always computed fresh.
export const dynamic = "force-dynamic";

function tokenMatches(header: string | null, secret: string): boolean {
  const given = Buffer.from(header?.replace(/^Bearer\s+/i, "") ?? "");
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  const secret = process.env.BOT_API_SECRET;
  if (!secret) return Response.json({ error: "Bot API is not configured." }, { status: 503 });
  if (!tokenMatches(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pings = await loadDuePings(new Date(), new URL(request.url).origin);
  return Response.json({ pings }, { headers: { "cache-control": "no-store" } });
}
