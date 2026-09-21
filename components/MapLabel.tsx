"use client";

import DecryptedText from "@/components/DecryptedText";
import { useGroupHovered } from "@/components/HoverGroup";

/** Letters and digits only, so scrambled text keeps the label's uppercase-mono look instead of turning to symbol soup. */
const SCRAMBLE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * Text that's decrypted while its enclosing `HoverGroup` is hovered and scrambled otherwise. The one place the
 * map name's decrypt effect is tuned, so it looks the same for every map — including any added later.
 * 45ms a letter keeps even the longest map name (8 letters, 360ms) inside the map reveal's 480ms slide-open.
 */
export function MapLabel({ text, className = "" }: { text: string; className?: string }) {
  const hovered = useGroupHovered();

  return (
    <DecryptedText
      data-testid="map-label"
      text={text}
      animateOn="controlled"
      active={hovered}
      sequential
      speed={45}
      characters={SCRAMBLE_CHARACTERS}
      parentClassName={className}
      className="text-text-primary"
      encryptedClassName="text-brand"
    />
  );
}
