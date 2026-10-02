"use client";

import { useEffect } from "react";
import type { Season } from "@/lib/season";

const PULSE_INTERVAL_MS = 2000;
const ALERT_INTERVAL_MS = 1000;
const ALERT_WINDOW_MINUTES = 30;
const ICON_SIZE = 32;

function minutesUntil(date: Date, now: Date): number {
  return Math.round((date.getTime() - now.getTime()) / 60_000);
}

type Frame = { dotOn: boolean; markColor: string };

function drawIcon(ctx: CanvasRenderingContext2D, { dotOn, markColor }: Frame) {
  ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE);
  const cx = ICON_SIZE / 2;
  const cy = ICON_SIZE / 2;
  const r = ICON_SIZE * 0.32;

  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fillStyle = markColor;
  ctx.fill();

  if (dotOn) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = "#0a0d12";
    ctx.fill();
  }
}

const PUMPKIN_ORANGE = "#ff7518";
const PUMPKIN_STEM = "#4c7a2a";
const PUMPKIN_GLOW = "#ffd23f";
const PUMPKIN_DARK = "#1a1008";

function polygon(ctx: CanvasRenderingContext2D, points: [number, number][], color: string) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const p of points.slice(1)) ctx.lineTo(...p);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/** The halloween mark: a jack-o'-lantern. `dotOn` lights its face; `markColor` is the light's color. */
function drawPumpkin(ctx: CanvasRenderingContext2D, { dotOn, markColor }: Frame) {
  ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE);
  polygon(ctx, [[14, 9], [15, 3], [19, 4], [18, 9]], PUMPKIN_STEM);
  // Three overlapping lobes read as a pumpkin even at 16px.
  for (const [x, r] of [[10, 9], [22, 9], [16, 11]] as const) {
    ctx.beginPath();
    ctx.arc(x, 19, r, 0, Math.PI * 2);
    ctx.fillStyle = PUMPKIN_ORANGE;
    ctx.fill();
  }
  const face = dotOn ? markColor : PUMPKIN_DARK;
  polygon(ctx, [[8, 18], [11, 13], [14, 18]], face);
  polygon(ctx, [[18, 18], [21, 13], [24, 18]], face);
  polygon(ctx, [[8, 21], [24, 21], [22, 26], [19, 24], [16, 27], [13, 24], [10, 26]], face);
}

/**
 * Two dynamic favicon states, both stopping the moment the tab regains focus
 * so the animation reads as a notification, not decoration: an unconfirmed
 * availability pulse (2s), and a red/white alternation when a match starts
 * within 30 minutes (1s, takes priority over the pulse). In the halloween
 * season the mark is a jack-o'-lantern that stays up while the tab is visible,
 * and the same two signals flicker its face instead.
 */
export function FaviconController({
  hasUnsetDays,
  nearestMatchDate,
  season = null,
}: {
  hasUnsetDays: boolean;
  nearestMatchDate: Date | null;
  season?: Season;
}) {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const canvas = document.createElement("canvas");
    canvas.width = ICON_SIZE;
    canvas.height = ICON_SIZE;
    const ctx = canvas.getContext("2d");
    if (!link || !ctx) return;

    const originalHref = link.href;
    const isPumpkin = season === "halloween";
    const draw = isPumpkin ? drawPumpkin : drawIcon;
    const markColor = isPumpkin ? PUMPKIN_GLOW : "#ff4655";
    // In season the still icon is a lit pumpkin rather than the static favicon file.
    let restHref = originalHref;
    if (isPumpkin) {
      draw(ctx, { dotOn: true, markColor });
      restHref = canvas.toDataURL();
    }
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let tick = 0;

    function stop() {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      link!.href = restHref;
    }

    function matchIsImminent(): boolean {
      if (!nearestMatchDate) return false;
      const minutes = minutesUntil(nearestMatchDate, new Date());
      return minutes >= 0 && minutes <= ALERT_WINDOW_MINUTES;
    }

    function start(intervalMs: number, tickToFrame: (tick: number) => Frame) {
      if (intervalId !== null) return;
      tick = 0;
      intervalId = setInterval(() => {
        tick++;
        draw(ctx!, tickToFrame(tick));
        link!.href = canvas.toDataURL();
      }, intervalMs);
    }

    function evaluate() {
      if (!document.hidden) {
        stop();
      } else if (matchIsImminent()) {
        start(ALERT_INTERVAL_MS, (t) => ({ dotOn: true, markColor: t % 2 === 0 ? markColor : "#ffffff" }));
      } else if (hasUnsetDays) {
        start(PULSE_INTERVAL_MS, (t) => ({ dotOn: t % 2 === 0, markColor }));
      } else {
        stop();
      }
    }

    document.addEventListener("visibilitychange", evaluate);
    evaluate();

    return () => {
      document.removeEventListener("visibilitychange", evaluate);
      stop();
      link.href = originalHref;
    };
  }, [hasUnsetDays, nearestMatchDate, season]);

  return null;
}
