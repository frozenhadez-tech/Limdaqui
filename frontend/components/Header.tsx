"use client";

import Link from "next/link";

import { useAuth } from "@/lib/auth";

import { Logo } from "./Logo";

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 8 12 3l8.5 5v8L12 21l-8.5-5V8Z M3.5 8 12 13l8.5-5M12 13v8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Header() {
  const { user, logout, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <Logo className="h-9 w-9" />
          <span className="leading-none">
            <span className="block font-display text-lg font-extrabold tracking-tight text-brand">
              LIMDAQUI
            </span>
            <span className="mt-1 block text-[0.62rem] font-bold tracking-[0.22em] text-gray-500">
              TRADING INC.
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-6 sm:gap-8">
          <div className="hidden items-center gap-7 md:flex">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-bold text-brand"
            >
              <HomeIcon /> Home
            </Link>
            <Link
              href="/products"
              className="flex items-center gap-1.5 text-sm font-medium text-gray-700 transition-colors hover:text-brand"
            >
              <ShopIcon /> Shop
            </Link>
          </div>

          <div className="hidden h-6 w-px bg-gray-200 md:block" />

          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-full bg-gray-100" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-full border border-ink/15 px-4 py-2 text-sm font-bold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white"
                >
                  Admin
                </Link>
              )}
              <span className="hidden text-sm font-medium text-gray-700 sm:inline">
                Hi, {user.fullName?.split(" ")[0] ?? user.email.split("@")[0]}
              </span>
              <button
                onClick={logout}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-brand hover:text-brand"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 transition-colors hover:text-brand"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-white shadow-sm shadow-brand/20 transition-colors hover:bg-brand-600"
              >
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
