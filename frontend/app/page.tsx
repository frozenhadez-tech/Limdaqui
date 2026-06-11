import type { CSSProperties } from "react";

import Link from "next/link";

import { CountUp } from "@/components/CountUp";
import { Reveal } from "@/components/Reveal";

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

const PARTICLES: CSSProperties[] = [
  { left: "8%", animationDuration: "9s", animationDelay: "0s" },
  { left: "20%", animationDuration: "12s", animationDelay: "-3s" },
  { left: "35%", animationDuration: "10s", animationDelay: "-6s" },
  { left: "50%", animationDuration: "13s", animationDelay: "-1.5s" },
  { left: "66%", animationDuration: "11s", animationDelay: "-4.5s" },
  { left: "80%", animationDuration: "9.5s", animationDelay: "-7s" },
  { left: "92%", animationDuration: "12.5s", animationDelay: "-2s" },
];

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
      <section className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden bg-ink">
        {/* base gradient */}
        <div className="absolute inset-0 -z-30 bg-gradient-to-br from-[#0b1120] via-[#0e1830] to-black" />
        {/* medical photo: fades in once, then a slow continuous Ken Burns zoom */}
        <div
          className="hero-image absolute inset-0 -z-20 bg-cover bg-center mix-blend-overlay"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1920&q=80')",
          }}
        />
        {/* legibility darkening over the photo */}
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_bottom,rgba(11,17,31,0.35),rgba(11,17,31,0.92))]" />
        {/* slow-panning tech grid */}
        <div className="hero-grid absolute inset-0 -z-10" />
        {/* drifting, breathing glow blobs */}
        <div className="blob-a absolute -bottom-32 -left-32 -z-10 h-[36rem] w-[36rem] rounded-full bg-brand/25 blur-3xl" />
        <div className="blob-b absolute -right-24 -top-24 -z-10 h-[32rem] w-[32rem] rounded-full bg-[#274690]/30 blur-3xl" />
        {/* top red wash */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_-5%,rgba(226,35,26,0.16),transparent_65%)]" />
        {/* rising glow particles */}
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          {PARTICLES.map((style, i) => (
            <span key={i} className="particle" style={style} />
          ))}
        </div>
        {/* periodic diagonal light sweep */}
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="hero-sheen absolute inset-y-0 w-1/4" />
        </div>

        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
          <span className="animate-fade-up inline-flex items-center gap-2.5 rounded-full border border-brand/40 bg-brand/10 px-4 py-1.5 text-sm font-semibold text-red-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
            Trusted Medical Trading Partner in the Philippines
          </span>

          <h1 className="animate-fade-up delay-1 mt-8 font-display text-5xl font-extrabold leading-[0.92] tracking-tight text-white sm:text-7xl">
            LIMDAQUI
            <span className="text-shimmer mt-1 block">TRADING INC.</span>
          </h1>

          <p className="animate-fade-up delay-2 mt-7 max-w-2xl text-lg leading-relaxed text-gray-300">
            Your reliable source for quality pharmaceuticals, medical equipment,
            and healthcare supplies. Shop online and get delivered nationwide.
          </p>

          <div className="animate-fade-up delay-3 mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/products"
              className="btn-glow inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-bold text-white transition hover:scale-105 hover:bg-brand-600 active:scale-95"
            >
              Shop Now <CartIcon />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:scale-105 hover:border-white/60 hover:bg-white/10 active:scale-95"
            >
              Create Account
            </Link>
            <Link
              href="/quote"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:scale-105 hover:border-white/60 hover:bg-white/10 active:scale-95"
            >
              Request Quotation <DocIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="relative overflow-hidden bg-brand">
        <div className="blob-b absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-6 py-14 text-center text-white md:grid-cols-4">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.12}>
              <div className="font-display text-4xl font-extrabold sm:text-5xl">
                <CountUp value={stat.value} />
              </div>
              <div className="mt-1.5 text-sm font-medium text-red-100/90">
                {stat.label}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Why choose us */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="text-center text-sm font-bold uppercase tracking-[0.2em] text-brand">
              Why Choose Us
            </p>
            <h2 className="mt-3 text-center font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              The LIMDAQUI Advantage
            </h2>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.title} delay={(i % 3) * 0.12}>
                <div className="group h-full rounded-2xl border border-gray-100 bg-gray-50/70 p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand/20 hover:bg-white hover:shadow-xl hover:shadow-brand/5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand transition-all duration-300 group-hover:scale-110 group-hover:bg-brand group-hover:text-white group-hover:shadow-lg group-hover:shadow-brand/30">
                    {feature.icon}
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-ink">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-gray-500">{feature.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="relative overflow-hidden bg-brand">
        <div className="blob-a absolute -left-24 -bottom-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="blob-b absolute -right-24 -top-24 h-80 w-80 rounded-full bg-ink/20 blur-3xl" aria-hidden="true" />
        <Reveal className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Ready to Start Shopping?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-red-50/90">
            Browse our extensive catalog of medical supplies and equipment.
            Fast, secure, and reliable.
          </p>
          <Link
            href="/products"
            className="group mt-9 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-brand shadow-lg transition hover:scale-105 hover:bg-red-50 active:scale-95"
          >
            Browse Products
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              <path
                d="m9 6 6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </Reveal>
      </section>
    </>
  );
}
