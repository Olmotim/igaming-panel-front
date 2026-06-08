"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    restoreSession();
  }, []);

async function restoreSession() {
  const refreshToken = getRefreshTokenFromCookie();

  if (!refreshToken) {
    setLoading(false);
    return;
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      return;
    }

    setAccessToken(data.access_token);
    saveRefreshTokenToCookie(data.refresh_token);
    await fetchProfile(data.access_token);
  } catch (err) {
    setLoading(false);
  }
}

async function fetchProfile(token: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      setLoading(false);
      return;
    }

    const userData = await res.json();
    setUser(userData);
  } finally {
    setLoading(false);
  }
}

  async function login(email: string, password: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Credenciales incorrectas");
    }

    const data = await res.json();
    setAccessToken(data.access_token);
    saveRefreshTokenToCookie(data.refresh_token);
    await fetchProfile(data.access_token);
    router.push("/dashboard");
  }

  async function logout() {
    if (accessToken) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
    setUser(null);
    setAccessToken(null);
    deleteRefreshTokenCookie();
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}

function saveRefreshTokenToCookie(token: string) {
  const maxAge = 7 * 24 * 60 * 60;
  document.cookie = `refresh_token=${token}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

function getRefreshTokenFromCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)refresh_token=([^;]+)/);
  return match ? match[1] : null;
}

function deleteRefreshTokenCookie() {
  document.cookie = "refresh_token=; max-age=0; path=/";
}