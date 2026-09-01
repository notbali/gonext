import Image from "next/image";

function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({
  name,
  src,
  size = 32,
  className = "",
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`shrink-0 rounded-full ${className}`}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-surface-raised font-mono font-bold text-text-primary ${className}`}
    >
      <span style={{ fontSize: Math.round(size * 0.4) }}>{initialsFromName(name)}</span>
    </div>
  );
}
