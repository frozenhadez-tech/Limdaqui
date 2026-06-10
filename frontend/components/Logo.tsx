export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {/* L */}
      <path d="M6 7 H12 V26 H18 V32 H6 Z" fill="var(--color-brand)" />
      {/* D */}
      <path
        d="M21 7 H27 A13 13 0 0 1 27 32 H21 V25 H26 A6 6 0 0 0 26 14 H21 Z"
        fill="var(--color-ink)"
      />
    </svg>
  );
}
