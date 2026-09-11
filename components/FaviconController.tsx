"use client";

import { useEffect } from "react";

const PULSE_INTERVAL_MS = 2000;
const ALERT_INTERVAL_MS = 1000;
const ALERT_WINDOW_MINUTES = 30;
const ICON_SIZE = 32;

function minutesUntil(date: Date, now: Date): number {
  return Math.round((date.getTime() - now.getTime()) / 60_000);
}

function drawIcon(ctx: CanvasRenderingContext2D, { dotOn, markColor }: { dotOn: boolean; markColor: string }) {
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

/**
 * Two dynamic favicon states, both stopping the moment the tab regains focus
 * so the animation reads as a notification, not decoration: an unconfirmed
 * availability pulse (2s), and a red/white alternation when a match starts
 * within 30 minutes (1s, takes priority over the pulse).
 */
export function FaviconController({
  hasUnsetDays,
  nearestMatchDate,
}: {
  hasUnsetDays: boolean;
  nearestMatchDate: Date | null;
}) {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const canvas = document.createElement("canvas");
    canvas.width = ICON_SIZE;
    canvas.height = ICON_SIZE;
    const ctx = canvas.getContext("2d");
    if (!link || !ctx) return;

    const originalHref = link.href;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let tick = 0;

    function stop() {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      link!.href = originalHref;
    }

    function matchIsImminent(): boolean {
      if (!nearestMatchDate) return false;
      const minutes = minutesUntil(nearestMatchDate, new Date());
      return minutes >= 0 && minutes <= ALERT_WINDOW_MINUTES;
    }

    function start(intervalMs: number, tickToFrame: (tick: number) => { dotOn: boolean; markColor: string }) {
      if (intervalId !== null) return;
      tick = 0;
      intervalId = setInterval(() => {
        tick++;
        drawIcon(ctx!, tickToFrame(tick));
        link!.href = canvas.toDataURL();
      }, intervalMs);
    }

    function evaluate() {
      if (!document.hidden) {
        stop();
      } else if (matchIsImminent()) {
        start(ALERT_INTERVAL_MS, (t) => ({ dotOn: true, markColor: t % 2 === 0 ? "#ff4655" : "#ffffff" }));
      } else if (hasUnsetDays) {
        start(PULSE_INTERVAL_MS, (t) => ({ dotOn: t % 2 === 0, markColor: "#ff4655" }));
      } else {
        stop();
      }
    }

    document.addEventListener("visibilitychange", evaluate);
    evaluate();

    return () => {
      document.removeEventListener("visibilitychange", evaluate);
      stop();
    };
  }, [hasUnsetDays, nearestMatchDate]);

  return null;
}
