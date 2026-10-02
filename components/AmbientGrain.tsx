import type { Season } from "@/lib/season";

/** A near-invisible ambient background loop, plus a low fog bank in the halloween season. Pure CSS — no client JS needed. */
export function AmbientGrain({ season = null }: { season?: Season }) {
  return (
    <>
      <div
        data-testid="ambient-grain"
        aria-hidden="true"
        className="ambient-grain pointer-events-none fixed inset-x-0 top-0 -z-10 h-[220px] opacity-70"
      />
      {season === "halloween" && (
        <div
          data-testid="ambient-fog"
          aria-hidden="true"
          className="ambient-fog pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-[45vh] overflow-hidden"
        />
      )}
    </>
  );
}
