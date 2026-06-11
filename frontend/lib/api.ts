export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Thin fetch wrapper around the backend API.
 * On non-2xx responses, throws an Error with the best human-readable message
 * the backend provided (first validation issue, then `error`, then a fallback).
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.issues?.[0]?.message ||
      data?.error ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}
