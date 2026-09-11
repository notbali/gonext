/** A near-invisible ambient background loop. Pure CSS — no client JS needed. */
export function AmbientGrain() {
  return (
    <div
      data-testid="ambient-grain"
      aria-hidden="true"
      className="ambient-grain pointer-events-none fixed inset-x-0 top-0 -z-10 h-[220px] opacity-70"
    />
  );
}
