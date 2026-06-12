"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/types";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

const field =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

const PAGE_SIZE = 25;

type Role = "customer" | "staff" | "manager" | "admin";

type AdminUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
  status: "active" | "suspended";
  createdAt: string;
};

type FormState = {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  status: "active" | "suspended";
};

const EMPTY_FORM: FormState = {
  fullName: "",
  email: "",
  password: "",
  role: "customer",
  status: "active",
};

const ROLE_STYLES: Record<Role, string> = {
  admin: "bg-ink text-white",
  manager: "bg-indigo-50 text-indigo-600",
  staff: "bg-blue-50 text-blue-600",
  customer: "bg-gray-100 text-gray-600",
};

function RolePill({ role }: { role: Role }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${ROLE_STYLES[role]}`}
    >
      {role}
    </span>
  );
}

function StatusPill({ status }: { status: AdminUser["status"] }) {
  return status === "active" ? (
    <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">
      Active
    </span>
  ) : (
    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
      Suspended
    </span>
  );
}

export default function AdminUsersPage() {
  const authedFetch = useAuthedFetch();
  const { user: me } = useAuth();

  const [usersList, setUsersList] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Editor: null = closed, "new" = creating, otherwise the user being edited.
  const [editing, setEditing] = useState<AdminUser | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(
    (q?: string) => {
      const params = q?.trim() ? `&q=${encodeURIComponent(q.trim())}` : "";
      authedFetch<AdminUser[]>(`/api/users?limit=100${params}`)
        .then(setUsersList)
        .catch((err) =>
          setError(err instanceof Error ? err.message : "Failed to load"),
        );
    },
    [authedFetch],
  );

  useEffect(() => load(), [load]);

  // Debounced search; a new search starts back at the first page.
  useEffect(() => {
    setPage(1);
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const totalPages = Math.max(1, Math.ceil((usersList?.length ?? 0) / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = (usersList ?? []).slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function goToPage(next: number) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const isSelf = editing !== "new" && editing !== null && editing.id === me?.id;
  const meIsAdmin = me?.role === "admin";
  // Managers cannot modify admin accounts.
  const targetLocked = (u: AdminUser) =>
    u.id === me?.id || (!meIsAdmin && u.role === "admin");
  const assignableRoles: Role[] = meIsAdmin
    ? ["customer", "staff", "manager", "admin"]
    : ["customer", "staff", "manager"];

  function openEditor(target: AdminUser | "new") {
    setEditing(target);
    setForm(
      target === "new"
        ? EMPTY_FORM
        : {
            fullName: target.fullName ?? "",
            email: target.email,
            password: "",
            role: target.role,
            status: target.status,
          },
    );
    setFormError(null);
    setConfirmDelete(false);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setFormError(null);
    setSaving(true);
    try {
      if (editing === "new") {
        await authedFetch("/api/users", {
          method: "POST",
          body: JSON.stringify({
            email: form.email.trim(),
            password: form.password,
            fullName: form.fullName.trim() || undefined,
            role: form.role,
          }),
        });
      } else {
        await authedFetch(`/api/users/${editing!.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            fullName: form.fullName.trim() || null,
            role: form.role,
            status: form.status,
            ...(form.password ? { password: form.password } : {}),
          }),
        });
      }
      setEditing(null);
      load(search);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleSuspend(target: AdminUser) {
    setError(null);
    try {
      const updated = await authedFetch<AdminUser>(`/api/users/${target.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: target.status === "active" ? "suspended" : "active",
        }),
      });
      setUsersList((list) =>
        list?.map((u) => (u.id === updated.id ? updated : u)) ?? null,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function removeUser() {
    if (editing === "new" || !editing) return;
    setSaving(true);
    try {
      await authedFetch(`/api/users/${editing.id}`, { method: "DELETE" });
      setEditing(null);
      load(search);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <p className="animate-fade-up text-[0.65rem] font-bold uppercase tracking-[0.24em] text-gray-400">
        Back office
      </p>
      <div className="animate-fade-up delay-1 mt-1 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          User Management
        </h1>
        <button
          onClick={() => openEditor("new")}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-600"
        >
          + New user
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand">
          {error}
        </div>
      )}

      <div className="animate-fade-up delay-2 mt-8">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${field} max-w-xs`}
          placeholder="Search by name or email…"
          aria-label="Search users"
        />
      </div>

      <div className="animate-fade-up delay-2 mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {!usersList ? (
          <div className="space-y-3 p-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : usersList.length === 0 ? (
          <p className="p-12 text-center text-sm text-gray-400">
            No users match your search.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-6 py-3.5">User</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="hidden px-4 py-3.5 md:table-cell">Joined</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.map((u) => (
                <tr key={u.id} className="transition hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-white">
                        {(u.fullName ?? u.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">
                          {u.fullName ?? "—"}
                          {u.id === me?.id && (
                            <span className="ml-1.5 text-xs font-medium text-gray-400">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RolePill role={u.role} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={u.status} />
                  </td>
                  <td className="hidden px-4 py-3 text-gray-500 md:table-cell">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleSuspend(u)}
                        disabled={targetLocked(u)}
                        title={
                          u.id === me?.id
                            ? "You cannot suspend your own account"
                            : targetLocked(u)
                              ? "Only admins can modify admin accounts"
                              : u.status === "active"
                                ? `Suspend ${u.email}`
                                : `Reactivate ${u.email}`
                        }
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40 ${
                          u.status === "active"
                            ? "text-amber-600 hover:bg-amber-50"
                            : "text-green-600 hover:bg-green-50"
                        }`}
                      >
                        {u.status === "active" ? "Suspend" : "Activate"}
                      </button>
                      <button
                        onClick={() => openEditor(u)}
                        disabled={!meIsAdmin && u.role === "admin"}
                        title={
                          !meIsAdmin && u.role === "admin"
                            ? "Only admins can modify admin accounts"
                            : `Edit ${u.email}`
                        }
                        className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-ink disabled:opacity-40"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(usersList?.length ?? 0) > PAGE_SIZE && (
        <nav
          aria-label="User pages"
          className="mt-6 flex flex-wrap items-center justify-center gap-2"
        >
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-brand hover:text-brand disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
          >
            ‹ Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => goToPage(n)}
              aria-current={n === currentPage ? "page" : undefined}
              className={`h-10 w-10 rounded-full text-sm font-bold transition ${
                n === currentPage
                  ? "bg-brand text-white shadow-sm shadow-brand/20"
                  : "border border-gray-200 text-gray-600 hover:border-brand hover:text-brand"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-brand hover:text-brand disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
          >
            Next ›
          </button>
        </nav>
      )}

      {(usersList?.length ?? 0) > 0 && (
        <p className="mt-3 text-center text-xs text-gray-400">
          Showing {(currentPage - 1) * PAGE_SIZE + 1}–
          {Math.min(currentPage * PAGE_SIZE, usersList!.length)} of{" "}
          {usersList!.length} users
        </p>
      )}

      {/* Slide-over editor */}
      {editing && (
        <div className="fixed inset-0 z-50">
          <div
            className="animate-fade-in absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={() => !saving && setEditing(null)}
          />
          <div className="animate-slide-in absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-7 py-5">
              <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
                {editing === "new" ? "New user" : "Edit user"}
              </h2>
              <button
                onClick={() => setEditing(null)}
                disabled={saving}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-ink"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6 6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-7 py-6">
              {formError && (
                <div className="rounded-lg border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand">
                  {formError}
                </div>
              )}
              {isSelf && (
                <div className="rounded-lg bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
                  This is your own account — you cannot suspend it or change
                  its role.
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Full name
                </label>
                <input
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  className={field}
                  placeholder="Juan Dela Cruz"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  disabled={editing !== "new"}
                  className={`${field} ${editing !== "new" ? "bg-gray-50 text-gray-400" : ""}`}
                  placeholder="user@example.com"
                  title={editing !== "new" ? "Email cannot be changed" : undefined}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  {editing === "new" ? "Password" : "New password (optional)"}
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className={field}
                  placeholder={
                    editing === "new"
                      ? "At least 8 characters"
                      : "Leave blank to keep the current password"
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => update("role", e.target.value as FormState["role"])}
                    disabled={isSelf}
                    className={field}
                  >
                    {assignableRoles.map((r) => (
                      <option key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                {editing !== "new" && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        update("status", e.target.value as FormState["status"])
                      }
                      disabled={isSelf}
                      className={field}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-gray-100 px-7 py-5">
              <button
                onClick={save}
                disabled={
                  saving ||
                  (editing === "new" && (!form.email || form.password.length < 8))
                }
                className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
              >
                {saving
                  ? "Saving…"
                  : editing === "new"
                    ? "Create user"
                    : "Save changes"}
              </button>
              <button
                onClick={() => setEditing(null)}
                disabled={saving}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-gray-500 transition hover:text-ink"
              >
                Cancel
              </button>
              {editing !== "new" && !isSelf && meIsAdmin && (
                <button
                  onClick={() => (confirmDelete ? removeUser() : setConfirmDelete(true))}
                  disabled={saving}
                  className={`ml-auto rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    confirmDelete
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "text-red-500 hover:bg-red-50"
                  }`}
                >
                  {confirmDelete ? "Confirm delete" : "Delete"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
