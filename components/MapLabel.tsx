"use client";

import DecryptedText from "@/components/DecryptedText";
import { useGroupHovered } from "@/components/HoverGroup";
import { D } from "@/lib/motion";

/** Letters and digits only, so scrambled text keeps the label's uppercase-mono look instead of turning to symbol soup. */
const SCRAMBLE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * Text that's decrypted while its enclosing `HoverGroup` is hovered and scrambled otherwise. The one place the
 * map name's decrypt effect is tuned, so it looks the same for every map — including any added later.
 * Decrypting waits for the map reveal's slide-open (`D.state`, the duration on WEEK_MAP_REVEAL_CLASS) to finish,
 * so the scramble is on show while the map opens and the decrypt plays once it's fully in; encrypting starts
 * the moment the pointer leaves. 45ms a letter keeps even the longest map name (8 letters) under half a second.
 */
export function MapLabel({ text, className = "" }: { text: string; className?: string }) {
  const hovered = useGroupHovered();

  return (
    <DecryptedText
      data-testid="map-label"
      text={text}
      animateOn="controlled"
      active={hovered}
      decryptDelay={D.state * 1000}
      sequential
      speed={45}
      characters={SCRAMBLE_CHARACTERS}
      parentClassName={className}
      className="text-text-primary"
      encryptedClassName="text-brand"
    />
  );
}
