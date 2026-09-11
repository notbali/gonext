const STROKE_WIDTH = 2;

export function AvailabilityRing({ percent, size }: { percent: number; size: number }) {
  const radius = size / 2 - STROKE_WIDTH;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, percent));
  const offset = circumference * (1 - clamped);
  const complete = clamped >= 1;

  return (
    <svg
      data-testid="availability-ring"
      data-complete={complete ? "" : undefined}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={complete ? "availability-ring-bloom" : ""}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={STROKE_WIDTH}
      />
      <circle
        data-testid="availability-ring-progress"
        data-circumference={circumference}
        className="availability-ring-progress"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeDasharray={circumference}
        style={{ strokeDashoffset: offset }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}
