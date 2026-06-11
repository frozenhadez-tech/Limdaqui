export function Logo({
  className,
  dark = false,
}: {
  className?: string;
  dark?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 420 210"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {/* L */}
      <path d="M15 15 H125 V125 H250 V190 H15 Z" fill="var(--color-brand)" />
      {/* D */}
      <path
        d="M133 15 H260 C355 15 408 57 408 102 C408 148 355 190 260 190 H250 V130 H258 C290 130 307 119 307 103 C307 86 290 76 258 76 H250 V117 H133 Z"
        fill={dark ? "#ffffff" : "var(--color-ink)"}
      />
    </svg>
  );
}
