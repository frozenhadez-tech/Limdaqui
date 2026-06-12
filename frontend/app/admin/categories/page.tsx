"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { type Category } from "@/lib/types";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

const field =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminCategoriesPage() {
  const authedFetch = useAuthedFetch();
  const { user: me } = useAuth();
  // Staff can create categories; editing is for managers and admins.
  const canEdit = me?.role === "admin" || me?.role === "manager";

  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  function startEdit(c: Category) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditSlug(c.slug);
    setEditError(null);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setEditError(null);
    setSavingEdit(true);
    try {
      const row = await authedFetch<Category>(`/api/categories/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editName.trim(), slug: editSlug.trim() }),
      });
      setCategories((c) =>
        (c ?? [])
          .map((x) => (x.id === row.id ? row : x))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditingId(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingEdit(false);
    }
  }

  useEffect(() => {
    apiFetch<Category[]>("/api/categories")
      .then(setCategories)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const row = await authedFetch<Category>("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      });
      setCategories((c) =>
        [...(c ?? []), row].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setName("");
      setSlug("");
      setSlugTouched(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <p className="animate-fade-up text-[0.65rem] font-bold uppercase tracking-[0.24em] text-gray-400">
        Back office
      </p>
      <h1 className="animate-fade-up delay-1 mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">
        Categories
      </h1>

      {error && (
        <div className="mt-6 rounded-lg border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="animate-fade-up delay-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {!categories ? (
            <div className="space-y-3 p-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="p-12 text-center text-sm text-gray-400">
              No categories yet — create one to organize the catalog.
            </p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {categories.map((c) =>
                editingId === c.id ? (
                  <li key={c.id} className="px-6 py-4">
                    {editError && (
                      <p className="mb-2 text-sm text-brand">{editError}</p>
                    )}
                    <form onSubmit={saveEdit} className="flex flex-wrap items-center gap-3">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={`${field} max-w-[12rem] flex-1`}
                        aria-label="Category name"
                        placeholder="Name"
                      />
                      <input
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value)}
                        className={`${field} max-w-[12rem] flex-1 font-mono`}
                        aria-label="Category slug"
                        placeholder="slug"
                      />
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={savingEdit || !editName.trim() || !editSlug.trim()}
                          className="rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
                        >
                          {savingEdit ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          disabled={savingEdit}
                          className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-500 transition hover:text-ink"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </li>
                ) : (
                  <li key={c.id} className="flex items-center gap-4 px-6 py-4">
                    <span className="h-2 w-2 shrink-0 rounded-sm bg-brand" />
                    <span className="font-semibold text-ink">{c.name}</span>
                    <span className="ml-auto font-mono text-xs text-gray-400">
                      /{c.slug}
                    </span>
                    {canEdit && (
                      <button
                        onClick={() => startEdit(c)}
                        title={`Edit ${c.name}`}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-ink"
                      >
                        Edit
                      </button>
                    )}
                  </li>
                ),
              )}
            </ul>
          )}
        </div>

        <form
          onSubmit={create}
          className="animate-fade-up delay-3 h-fit rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <h2 className="font-display text-base font-extrabold tracking-tight text-ink">
            New category
          </h2>

          {formError && (
            <div className="mt-4 rounded-lg border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand">
              {formError}
            </div>
          )}

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                className={field}
                placeholder="e.g. Medical Equipment"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Slug
              </label>
              <input
                required
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
                className={`${field} font-mono`}
                placeholder="medical-equipment"
              />
            </div>
            <button
              type="submit"
              disabled={saving || !name || !slug}
              className="w-full rounded-full bg-brand py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create category"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
