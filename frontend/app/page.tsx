import Link from "next/link";

import { API_URL } from "@/lib/api";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Limdaqui
      </h1>
      <p className="max-w-prose text-lg text-gray-500">
        E-commerce storefront. Next.js frontend on Vercel, Express API on Google
        Cloud Run, Postgres on Neon.
      </p>
      <Link
        href="/products"
        className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
      >
        Browse products →
      </Link>
      <p className="rounded-full bg-gray-100 px-4 py-1.5 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        API: <code>{API_URL}</code>
      </p>
    </main>
  );
}
