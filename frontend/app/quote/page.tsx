"use client";

import { useRef, useState } from "react";

import { API_URL, apiFetch } from "@/lib/api";

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function onPickFile(picked: File | undefined) {
    setError(null);
    if (!picked) return;
    if (picked.size > MAX_ATTACHMENT_BYTES) {
      setError("Attachment is too large — the limit is 10 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFile(picked);
  }

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

      if (file) {
        // Multipart: the browser sets its own Content-Type with the boundary.
        const body = new FormData();
        for (const [key, value] of Object.entries(payload)) body.append(key, value);
        body.append("attachment", file);
        const res = await fetch(`${API_URL}/api/quotes`, { method: "POST", body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            data?.issues?.[0]?.message || data?.error || "Submission failed",
          );
        }
      } else {
        await apiFetch("/api/quotes", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
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
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Attachment <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.xls,.xlsx,.csv,.doc,.docx,.txt,image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => onPickFile(e.target.files?.[0])}
                  />
                  {file ? (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
                      <div className="flex min-w-0 items-center gap-2.5 text-sm text-gray-700">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-gray-400">
                          <path
                            d="m21 12-8.5 8.5a5 5 0 0 1-7-7L14 5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L16 7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="truncate font-medium">{file.name}</span>
                        <span className="shrink-0 text-xs text-gray-400">
                          {formatBytes(file.size)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="shrink-0 text-xs font-semibold text-gray-400 transition hover:text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-500 transition hover:border-brand hover:text-brand"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="m21 12-8.5 8.5a5 5 0 0 1-7-7L14 5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L16 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Attach your product list
                    </button>
                  )}
                  <p className="mt-1.5 text-xs text-gray-400">
                    PDF, Excel, Word, CSV, or image — up to 10 MB
                  </p>
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
