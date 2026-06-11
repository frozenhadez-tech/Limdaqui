"use client";

import { useState } from "react";

import { apiFetch } from "@/lib/api";

const field =
  "w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function QuotePage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        message: form.message,
        ...(form.company ? { company: form.company } : {}),
        ...(form.phone ? { phone: form.phone } : {}),
      };
      await apiFetch("/api/quotes", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          Request a Quotation
        </h1>
        <p className="mt-2 text-gray-500">
          Tell us what you need and our team will get back to you with pricing
          and availability.
        </p>

        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          {done ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path
                    d="m5 13 4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-bold text-ink">
                Quotation request sent
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Thanks, {form.name.split(" ")[0] || "there"}! We&apos;ll be in
                touch at {form.email} shortly.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 rounded-lg border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand">
                  {error}
                </div>
              )}
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      required
                      value={form.name}
                      onChange={update("name")}
                      className={field}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={update("email")}
                      className={field}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Company <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      value={form.company}
                      onChange={update("company")}
                      className={field}
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Phone <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      value={form.phone}
                      onChange={update("phone")}
                      className={field}
                      placeholder="+63 ..."
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    What do you need?
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={update("message")}
                    className={field}
                    placeholder="List the products, quantities, and any requirements…"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
                >
                  {submitting ? "Sending…" : "Submit request"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
