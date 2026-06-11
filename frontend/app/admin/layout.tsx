"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";

function Icon({ d }: { d: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const NAV = [
  { href: "/admin", label: "Overview", d: "M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-4H4v4Zm10-12h6V4h-6v4Z" },
  { href: "/admin/quotes", label: "Quotations", d: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-5.1A8 8 0 1 1 21 12Z" },
  { href: "/admin/products", label: "Products", d: "M3.5 8 12 3l8.5 5v8L12 21l-8.5-5V8Zm0 0L12 13l8.5-5M12 13v8" },
  { href: "/admin/categories", label: "Categories", d: "M4 7h16M4 12h16M4 17h10" },
];

function GatePanel({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: { href: string; label: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <Logo className="mx-auto h-10 w-10" />
        <h1 className="mt-4 font-display text-xl font-extrabold tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-2 text-sm text-gray-500">{body}</p>
        <Link
          href={cta.href}
          className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
        >
          {cta.label}
        </Link>
      </div>
    </main>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-brand" />
      </main>
    );
  }

  if (!user) {
    return (
      <GatePanel
        title="Sign in required"
        body="Log in with an administrator account to access the back office."
        cta={{ href: "/login", label: "Go to login" }}
      />
    );
  }

  if (user.role !== "admin") {
    return (
      <GatePanel
        title="No access"
        body="This area is reserved for Limdaqui administrators."
        cta={{ href: "/", label: "Back to the store" }}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
      <aside className="relative flex flex-col bg-ink text-white md:min-h-screen md:w-64 md:shrink-0">
        {/* Subtle texture matching the public hero */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        <div className="relative flex items-center gap-3 px-6 pb-6 pt-7">
          <Logo className="h-9 w-9" dark />
          <span className="leading-none">
            <span className="block font-display text-base font-extrabold tracking-tight">
              LIMDAQUI
            </span>
            <span className="mt-1 block text-[0.6rem] font-bold tracking-[0.26em] text-brand">
              BACK OFFICE
            </span>
          </span>
        </div>

        <nav className="relative flex gap-1 overflow-x-auto px-3 pb-4 md:flex-col md:overflow-visible">
          {NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className={active ? "text-brand" : ""}>
                  <Icon d={item.d} />
                </span>
                {item.label}
                {active && (
                  <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-brand md:block" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="relative mt-auto hidden border-t border-white/10 px-6 py-5 md:block">
          <p className="truncate text-xs font-semibold text-white/80">
            {user.fullName ?? user.email}
          </p>
          <p className="mt-0.5 text-[0.65rem] uppercase tracking-[0.18em] text-white/40">
            Administrator
          </p>
          <div className="mt-3 flex items-center gap-4 text-xs font-medium">
            <Link href="/" className="text-white/60 transition hover:text-white">
              View store ↗
            </Link>
            <button
              onClick={logout}
              className="text-white/60 transition hover:text-brand"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
      </main>
    </div>
  );
}
