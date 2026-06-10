import Link from "next/link";

/* ---------------------------------------------------------------- icons */

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 4h2l2.4 12.3a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L20 8H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 2h8l4 4v16H6V2Z M14 2v4h4M9 13h6M9 17h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const iconProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function ShieldIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="17.5" cy="17.5" r="1.5" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="8.5" r="2.5" />
      <path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" />
      <path d="M15.5 14.4c2.5.3 4.5 2.2 4.5 4.6" />
    </svg>
  );
}

function MedalIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.5 7.5 21 12 18.5 16.5 21 15 13.5" />
    </svg>
  );
}

/* ---------------------------------------------------------------- data */

const STATS = [
  { value: "10+", label: "Years Experience" },
  { value: "500+", label: "Products Available" },
  { value: "100+", label: "Happy Clients" },
  { value: "100%", label: "FDA Compliant" },
];

const FEATURES = [
  { icon: <ShieldIcon />, title: "FDA Certified", desc: "All products meet FDA standards" },
  { icon: <TruckIcon />, title: "Fast Delivery", desc: "Nationwide shipping available" },
  { icon: <CardIcon />, title: "Secure Payment", desc: "Multiple payment options" },
  { icon: <BoxIcon />, title: "Quality Products", desc: "Authentic medical supplies" },
  { icon: <UsersIcon />, title: "24/7 Support", desc: "Always here to help" },
  { icon: <MedalIcon />, title: "Best Prices", desc: "Competitive pricing guaranteed" },
];

/* ---------------------------------------------------------------- page */

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-ink">
        <div className="absolute inset-0 -z-10 bg-ink" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(70%_55%_at_50%_-5%,rgba(226,35,26,0.20),transparent_65%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_85%_15%,rgba(24,35,58,0.9),transparent_70%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(11,17,31,0.25),rgba(11,17,31,0.96))]" />

        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
          <span className="animate-fade-up inline-flex items-center gap-2.5 rounded-full border border-brand/40 bg-brand/10 px-4 py-1.5 text-sm font-semibold text-red-200">
            <span className="h-2 w-2 rounded-full bg-brand" />
            Trusted Medical Trading Partner in the Philippines
          </span>

          <h1 className="animate-fade-up delay-1 mt-8 font-display text-5xl font-extrabold leading-[0.92] tracking-tight text-white sm:text-7xl">
            LIMDAQUI
            <span className="mt-1 block text-brand">TRADING INC.</span>
          </h1>

          <p className="animate-fade-up delay-2 mt-7 max-w-2xl text-lg leading-relaxed text-gray-300">
            Your reliable source for quality pharmaceuticals, medical equipment,
            and healthcare supplies. Shop online and get delivered nationwide.
          </p>

          <div className="animate-fade-up delay-3 mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-600"
            >
              Shop Now <CartIcon />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/5"
            >
              Create Account
            </Link>
            <Link
              href="/quote"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/5"
            >
              Request Quotation <DocIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-brand">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-6 py-14 text-center text-white md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="font-display text-4xl font-extrabold sm:text-5xl">
                {stat.value}
              </div>
              <div className="mt-1.5 text-sm font-medium text-red-100/90">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why choose us */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-sm font-bold uppercase tracking-[0.2em] text-brand">
            Why Choose Us
          </p>
          <h2 className="mt-3 text-center font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            The LIMDAQUI Advantage
          </h2>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-gray-100 bg-gray-50/70 p-7 transition hover:-translate-y-0.5 hover:border-gray-200 hover:bg-white hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  {feature.icon}
                </div>
                <h3 className="mt-5 text-lg font-bold text-ink">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="bg-brand">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Ready to Start Shopping?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-red-50/90">
            Browse our extensive catalog of medical supplies and equipment.
            Fast, secure, and reliable.
          </p>
          <Link
            href="/products"
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-brand shadow-lg transition hover:bg-red-50"
          >
            Browse Products
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="m9 6 6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
