export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: "operaio" | "admin" | "impresa" | "responsabile";
  }; 
}

import { OfflineRilevamento } from "@shared/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Richiesta fallita");
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>(`${API_BASE}/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  refresh: (refreshToken: string) =>
    request<LoginResponse>(`${API_BASE}/auth/refresh`, {
      method: "POST",
      body: JSON.stringify({ refreshToken })
    }),
  createRilevamento: (
    payload: FormData,
    accessToken: string
  ) =>
    fetch(`${API_BASE}/rilevamenti`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: payload
    }).then(async (res) => {
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Salvataggio rilevamento fallito");
      }
      return res.json();
    }),
  syncRilevamenti: (records: OfflineRilevamento[], accessToken: string) =>
    request<{ message: string }>(`${API_BASE}/rilevamenti/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ records })
    }),
  fetchReferenceData: (accessToken: string) =>
    request<{
      comuni: Array<{ id: string; name: string; province: string; region: string }>;
      imprese: Array<{ id: string; name: string }>;
      tipiLavorazione: Array<{ id: string; name: string }>;
    }>(`${API_BASE}/admin/reference`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
};
