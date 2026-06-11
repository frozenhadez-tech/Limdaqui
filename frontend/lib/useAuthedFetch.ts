"use client";

import { useCallback } from "react";

import { apiFetch } from "./api";
import { useAuth } from "./auth";

/** apiFetch bound to the current session's Bearer token. */
export function useAuthedFetch() {
  const { token } = useAuth();
  return useCallback(
    <T,>(path: string, init?: RequestInit) =>
      apiFetch<T>(path, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(init?.headers ?? {}),
        },
      }),
    [token],
  );
}
