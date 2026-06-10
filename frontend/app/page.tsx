import Link from "next/link";

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

export default function Home() {
  return (
    <section className="relative isolate overflow-hidden bg-ink">
      {/* layered background for depth */}
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
  );
}
