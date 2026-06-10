import Link from "next/link";

import { Logo } from "./Logo";

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function PinIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 4h3l2 5-2 1.5a11 11 0 0 0 5 5L19 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function CheckShield() {
  return (
    <svg {...iconProps} width="14" height="14">
      <path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop Products" },
  { href: "/quote", label: "Request Quotation" },
  { href: "/login", label: "Login / Register" },
];

export function Footer() {
  return (
    <footer className="bg-ink text-gray-400">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <Logo className="h-9 w-9" dark />
              <span className="leading-none">
                <span className="block font-display text-lg font-extrabold tracking-tight text-brand">
                  LIMDAQUI
                </span>
                <span className="mt-1 block text-[0.62rem] font-bold tracking-[0.22em] text-gray-400">
                  TRADING INC.
                </span>
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed">
              Your trusted partner for quality pharmaceuticals, medical
              equipment, and healthcare supplies in the Philippines. FDA
              compliant and dedicated to excellence.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
              Contact Us
            </h3>
            <ul className="mt-5 space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="mt-0.5 shrink-0 text-brand">
                  <PinIcon />
                </span>
                <span className="leading-relaxed">
                  Zone 5J Bridges Town Square, Plaridel Street
                  <br />
                  Alang Alang, Mandaue City
                  <br />
                  Cebu, Philippines 6014
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 shrink-0 text-brand">
                  <PhoneIcon />
                </span>
                <span className="leading-relaxed">
                  +63 962 256 6224
                  <br />
                  +63 966 248 6630
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 shrink-0 text-brand">
                  <MailIcon />
                </span>
                <a
                  href="mailto:Sales@limdaqui.ph"
                  className="transition-colors hover:text-white"
                >
                  Sales@limdaqui.ph
                </a>
              </li>
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
              Quick Links
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs sm:flex-row">
          <p>© 2026 Limdaqui Trading Inc. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <CheckShield /> FDA Approved
          </p>
        </div>
      </div>
    </footer>
  );
}
