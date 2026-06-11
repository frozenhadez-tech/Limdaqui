"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

import { Logo } from "./Logo";

function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
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

const ICONS = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5",
  shop: "M3.5 8 12 3l8.5 5v8L12 21l-8.5-5V8Zm0 0L12 13l8.5-5M12 13v8",
  cart: "M3 4h2l2.6 12.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20.5 8H6m2.5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
  admin: "M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M4 21h11m-11 0H2m13 0h4m0 0h3m-3 0v-9h-3M8 8h3m-3 4h3m-3 4h3",
  logout: "M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3m4-4 4-4m0 0-4-4m4 4H9",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6 6 18",
} as const;

type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  title: string;
};

function NavLink({
  item,
  active,
  badge,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      title={item.title}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center gap-1.5 rounded-md px-1 py-1 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 ${
        active
          ? "font-bold text-brand"
          : "font-medium text-gray-700 hover:text-brand"
      }`}
    >
      <Icon d={ICONS[item.icon]} />
      {item.label}
      {badge !== undefined && badge > 0 && (
        <span
          aria-label={`${badge} item${badge === 1 ? "" : "s"} in cart`}
          className="absolute -right-2.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[0.6rem] font-bold text-white"
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const { user, logout, loading } = useAuth();
  const { count } = useCart();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  // Close the menu on Escape.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Close the mobile menu when navigating.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const items: NavItem[] = [
    { href: "/", label: "Home", icon: "home", title: "Go to the homepage" },
    { href: "/products", label: "Shop", icon: "shop", title: "Browse the product catalog" },
    { href: "/cart", label: "Cart", icon: "cart", title: "View your shopping cart" },
    ...(user
      ? [{ href: "/profile", label: "My Profile", icon: "profile" as const, title: "Account, security, and order history" }]
      : []),
    ...(isAdmin
      ? [{ href: "/admin", label: "Admin", icon: "admin" as const, title: "Back-office dashboard" }]
      : []),
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
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

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              badge={item.icon === "cart" ? count : undefined}
            />
          ))}
        </nav>

        {/* Right side: session */}
        <div className="hidden items-center gap-4 lg:flex">
          <div className="h-8 w-px bg-gray-200" />
          {loading ? (
            <div className="h-9 w-28 animate-pulse rounded-full bg-gray-100" />
          ) : user ? (
            <>
              <div className="leading-tight">
                <p className="text-sm font-bold text-ink">
                  {user.fullName ?? (isAdmin ? "Admin User" : "Customer")}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={logout}
                title="Log out"
                aria-label="Log out"
                className="rounded-full p-2 text-gray-500 outline-none transition-colors hover:bg-brand/5 hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <Icon d={ICONS.logout} size={18} />
              </button>
            </>
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
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="rounded-md p-2 text-gray-700 outline-none transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/40 lg:hidden"
        >
          <Icon d={mobileOpen ? ICONS.close : ICONS.menu} size={22} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav
          aria-label="Main"
          className="animate-fade-in border-t border-gray-100 bg-white px-6 py-4 lg:hidden"
        >
          <div className="space-y-1">
            {items.map((item) => (
              <div key={item.href} className="py-1.5">
                <NavLink
                  item={item}
                  active={isActive(item.href)}
                  badge={item.icon === "cart" ? count : undefined}
                  onClick={() => setMobileOpen(false)}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="leading-tight">
                  <p className="text-sm font-bold text-ink">
                    {user.fullName ?? (isAdmin ? "Admin User" : "Customer")}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <button
                  onClick={logout}
                  title="Log out"
                  aria-label="Log out"
                  className="rounded-full p-2 text-gray-500 transition-colors hover:bg-brand/5 hover:text-brand"
                >
                  <Icon d={ICONS.logout} size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-full border border-gray-200 py-2 text-center text-sm font-semibold text-gray-700"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-full bg-brand py-2 text-center text-sm font-bold text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
