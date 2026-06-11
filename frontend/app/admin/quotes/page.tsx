"use client";

import { useEffect, useState } from "react";

import { formatDate, type Quote } from "@/lib/types";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

export default function AdminQuotesPage() {
  const authedFetch = useAuthedFetch();
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    authedFetch<Quote[]>("/api/quotes?limit=100")
      .then(setQuotes)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  }, [authedFetch]);

  return (
    <>
      <p className="animate-fade-up text-[0.65rem] font-bold uppercase tracking-[0.24em] text-gray-400">
        Back office
      </p>
      <div className="animate-fade-up delay-1 mt-1 flex items-baseline justify-between">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          Quotations
        </h1>
        {quotes && (
          <span className="text-sm font-medium text-gray-400">
            {quotes.length} request{quotes.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand">
          {error}
        </div>
      )}

      <div className="animate-fade-up delay-2 mt-8">
        {!quotes ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : quotes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-14 text-center">
            <p className="font-display text-lg font-bold text-ink">Inbox zero</p>
            <p className="mt-1 text-sm text-gray-400">
              Quotation requests from the public form will appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {quotes.map((q) => {
              const open = openId === q.id;
              return (
                <li
                  key={q.id}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                >
                  <button
                    onClick={() => setOpenId(open ? null : q.id)}
                    className="flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-gray-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-white">
                      {q.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">
                        {q.name}
                        {q.company && (
                          <span className="font-medium text-gray-400">
                            {" "}· {q.company}
                          </span>
                        )}
                      </p>
                      <p className={`text-sm text-gray-500 ${open ? "" : "truncate"}`}>
                        {open ? "" : q.message}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-gray-400">{formatDate(q.createdAt)}</p>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      className={`shrink-0 text-gray-300 transition-transform ${open ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    >
                      <path
                        d="m6 9 6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {open && (
                    <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-5">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                        {q.message}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500">
                        <a
                          href={`mailto:${q.email}?subject=Re: your quotation request to Limdaqui`}
                          className="font-bold text-brand hover:underline"
                        >
                          Reply by email →
                        </a>
                        <span>{q.email}</span>
                        {q.phone && <span>{q.phone}</span>}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
