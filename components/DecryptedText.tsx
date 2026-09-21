"use client";

import { useEffect, useState, useRef, useMemo, useCallback, type CSSProperties } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/motion";

/*
 * Adapted from React Bits' DecryptedText (https://reactbits.dev). Differences from upstream:
 *  - `animateOn="controlled"`: decrypts while the `active` prop is true and encrypts again when it goes
 *    false, so a parent (e.g. a hover group) decides when. Continues from wherever a half-finished
 *    animation got to instead of jumping.
 *  - The screen-reader layer always holds the real `text` (upstream exposed the scrambled text).
 *  - Skips the scramble entirely under prefers-reduced-motion.
 *  - Animation ticks don't run side effects inside state updaters, which React StrictMode double-invokes.
 *  - Imports from `framer-motion` (already a dependency) rather than the `motion` alias package.
 */

const styles = {
  wrapper: {
    display: "inline-block",
    whiteSpace: "pre-wrap",
  },
  srOnly: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    border: 0,
  },
} satisfies Record<string, CSSProperties>;

type DecryptedTextProps = {
  /** The text content to decrypt. */
  text: string;
  /** Time in ms between each iteration. */
  speed?: number;
  /** Max # of random iterations (non-sequential mode). */
  maxIterations?: number;
  /** Whether to reveal one character at a time in sequence. */
  sequential?: boolean;
  /** From which position characters begin to reveal in sequential mode. */
  revealDirection?: "start" | "end" | "center";
  /** Restrict scrambling to only the characters already in the text. */
  useOriginalCharsOnly?: boolean;
  /** The pool scrambled characters are drawn from. */
  characters?: string;
  /** CSS class for revealed characters. */
  className?: string;
  /** CSS class for the main characters container. */
  parentClassName?: string;
  /** CSS class for encrypted characters. */
  encryptedClassName?: string;
  /** What triggers the animation. "controlled" follows the `active` prop. */
  animateOn?: "view" | "hover" | "inViewHover" | "click" | "controlled";
  /** Controls click behavior; only applies when animateOn is "click". */
  clickMode?: "once" | "toggle";
  /** Whether the text should be decrypted; only applies when animateOn is "controlled". */
  active?: boolean;
} & Omit<HTMLMotionProps<"span">, "className" | "children">;

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = "start",
  useOriginalCharsOnly = false,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+",
  className = "",
  parentClassName = "",
  encryptedClassName = "",
  animateOn = "hover",
  clickMode = "once",
  active = false,
  ...props
}: DecryptedTextProps) {
  // Starts as the real text so server-rendered HTML (and no-JS) is readable and there's no random
  // output to mismatch on hydration; the mount effect below scrambles it where it should start encrypted.
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isDecrypted, setIsDecrypted] = useState(animateOn !== "click");
  const [direction, setDirection] = useState<"forward" | "reverse">("forward");
  const reducedMotion = usePrefersReducedMotion();

  const containerRef = useRef<HTMLSpanElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  // Mirrors `revealedIndices` so interval ticks can read the latest set without a state updater.
  const revealedRef = useRef<Set<number>>(new Set());
  // The `active` value the animation was last started for (or mounted with), so re-renders don't re-trigger it.
  const lastActiveRef = useRef(active);

  const applyRevealed = useCallback((next: Set<number>) => {
    revealedRef.current = next;
    setRevealedIndices(next);
  }, []);

  const availableChars = useMemo(() => {
    return useOriginalCharsOnly
      ? Array.from(new Set(text.split(""))).filter((char) => char !== " ")
      : characters.split("");
  }, [useOriginalCharsOnly, text, characters]);

  const shuffleText = useCallback(
    (originalText: string, currentRevealed: Set<number>) => {
      return originalText
        .split("")
        .map((char, i) => {
          if (char === " ") return " ";
          if (currentRevealed.has(i)) return originalText[i];
          return availableChars[Math.floor(Math.random() * availableChars.length)];
        })
        .join("");
    },
    [availableChars],
  );

  /** The order characters are revealed in (sequential mode); encrypting removes them in the reverse order. */
  const revealOrder = useMemo(() => {
    const len = text.length;
    const order: number[] = [];
    if (revealDirection === "start") {
      for (let i = 0; i < len; i++) order.push(i);
    } else if (revealDirection === "end") {
      for (let i = len - 1; i >= 0; i--) order.push(i);
    } else {
      const middle = Math.floor(len / 2);
      let offset = 0;
      while (order.length < len) {
        const idx = offset % 2 === 0 ? middle + offset / 2 : middle - Math.ceil(offset / 2);
        if (idx >= 0 && idx < len) order.push(idx);
        offset++;
      }
    }
    return order;
  }, [revealDirection, text.length]);

  const fillAllIndices = useCallback(() => {
    const s = new Set<number>();
    for (let i = 0; i < text.length; i++) s.add(i);
    return s;
  }, [text]);

  const removeRandomIndices = useCallback((set: Set<number>, count: number) => {
    const arr = Array.from(set);
    for (let i = 0; i < count && arr.length > 0; i++) {
      const idx = Math.floor(Math.random() * arr.length);
      arr.splice(idx, 1);
    }
    return new Set(arr);
  }, []);

  const encryptInstantly = useCallback(() => {
    const emptySet = new Set<number>();
    applyRevealed(emptySet);
    setDisplayText(shuffleText(text, emptySet));
    setIsDecrypted(false);
  }, [text, shuffleText, applyRevealed]);

  const triggerDecrypt = useCallback(() => {
    // Interrupting an encrypt: keep what's still revealed and carry on from there.
    if (!isAnimating) applyRevealed(new Set());
    setDirection("forward");
    setIsAnimating(true);
  }, [isAnimating, applyRevealed]);

  const triggerReverse = useCallback(() => {
    // Interrupting a decrypt: encrypt from what's revealed so far rather than flashing the full text.
    const start = isDecrypted && !isAnimating ? fillAllIndices() : revealedRef.current;
    applyRevealed(start);
    setDisplayText(shuffleText(text, start));
    setDirection("reverse");
    setIsAnimating(true);
  }, [isDecrypted, isAnimating, fillAllIndices, applyRevealed, shuffleText, text]);

  useEffect(() => {
    if (!isAnimating || reducedMotion) return;

    let currentIteration = 0;

    const commit = (next: Set<number>) => {
      applyRevealed(next);
      setDisplayText(shuffleText(text, next));
    };
    const finish = (decrypted: boolean) => {
      clearInterval(intervalRef.current);
      setIsAnimating(false);
      setIsDecrypted(decrypted);
    };

    intervalRef.current = setInterval(() => {
      const prev = revealedRef.current;

      if (direction === "forward") {
        if (sequential) {
          const nextIndex = revealOrder.find((i) => !prev.has(i));
          if (nextIndex === undefined) return finish(true);
          const next = new Set(prev).add(nextIndex);
          commit(next);
          if (next.size >= revealOrder.length) finish(true);
        } else {
          setDisplayText(shuffleText(text, prev));
          currentIteration++;
          if (currentIteration >= maxIterations) {
            finish(true);
            setDisplayText(text);
          }
        }
        return;
      }

      if (sequential) {
        const idxToRemove = [...revealOrder].reverse().find((i) => prev.has(i));
        if (idxToRemove === undefined) return finish(false);
        const next = new Set(prev);
        next.delete(idxToRemove);
        commit(next);
        if (next.size === 0) finish(false);
      } else {
        const current = prev.size === 0 ? fillAllIndices() : prev;
        const removeCount = Math.max(1, Math.ceil(text.length / Math.max(1, maxIterations)));
        const next = removeRandomIndices(current, removeCount);
        currentIteration++;
        if (next.size === 0 || currentIteration >= maxIterations) {
          // ensure final scrambled state
          commit(new Set());
          finish(false);
        } else {
          commit(next);
        }
      }
    }, speed);

    return () => clearInterval(intervalRef.current);
  }, [
    isAnimating,
    reducedMotion,
    direction,
    text,
    speed,
    maxIterations,
    sequential,
    revealOrder,
    shuffleText,
    fillAllIndices,
    removeRandomIndices,
    applyRevealed,
  ]);

  /* Click Behaviour */
  const handleClick = () => {
    if (animateOn !== "click") return;

    if (clickMode === "once") {
      if (isDecrypted) return;
      triggerDecrypt();
    }

    if (clickMode === "toggle") {
      if (isDecrypted) {
        triggerReverse();
      } else {
        triggerDecrypt();
      }
    }
  };

  /* Hover Behaviour */
  const triggerHoverDecrypt = () => {
    if (isAnimating) return;

    applyRevealed(new Set());
    setIsDecrypted(false);
    setDisplayText(text);
    setDirection("forward");
    setIsAnimating(true);
  };

  const resetToPlainText = () => {
    clearInterval(intervalRef.current);
    setIsAnimating(false);
    applyRevealed(new Set());
    setDisplayText(text);
    setIsDecrypted(true);
    setDirection("forward");
  };

  /* View Observer */
  useEffect(() => {
    if (animateOn !== "view" && animateOn !== "inViewHover") return;

    const observerCallback = (entries: { isIntersecting: boolean }[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          triggerDecrypt();
          setHasAnimated(true);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    });
    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [animateOn, hasAnimated, triggerDecrypt]);

  /* Initial / reset state: encrypted where it should start that way, plain otherwise. */
  /* Scrambling uses Math.random, so it can't happen at render time without a hydration mismatch —
     it has to be synced in after mount. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (animateOn === "click" || (animateOn === "controlled" && !lastActiveRef.current)) {
      encryptInstantly();
    } else {
      setDisplayText(text);
      setIsDecrypted(true);
    }
    setIsAnimating(false);
    applyRevealed(new Set());
    setDirection("forward");
  }, [animateOn, text, encryptInstantly, applyRevealed]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* Controlled Behaviour */
  useEffect(() => {
    if (animateOn !== "controlled" || lastActiveRef.current === active) return;
    lastActiveRef.current = active;
    // A change in `active` is the trigger event itself, so starting the animation here is the point of the effect.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (active) {
      triggerDecrypt();
    } else {
      triggerReverse();
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [animateOn, active, triggerDecrypt, triggerReverse]);

  const animateProps = reducedMotion
    ? {}
    : animateOn === "hover" || animateOn === "inViewHover"
      ? {
          onMouseEnter: triggerHoverDecrypt,
          onMouseLeave: resetToPlainText,
        }
      : animateOn === "click"
        ? {
            onClick: handleClick,
          }
        : {};

  const shownText = reducedMotion ? text : displayText;

  return (
    <motion.span className={parentClassName} ref={containerRef} style={styles.wrapper} {...animateProps} {...props}>
      <span style={styles.srOnly}>{text}</span>

      <span aria-hidden="true">
        {shownText.split("").map((char, index) => {
          const isRevealedOrDone = reducedMotion || revealedIndices.has(index) || (!isAnimating && isDecrypted);

          return (
            <span key={index} className={isRevealedOrDone ? className : encryptedClassName}>
              {char}
            </span>
          );
        })}
      </span>
    </motion.span>
  );
}
