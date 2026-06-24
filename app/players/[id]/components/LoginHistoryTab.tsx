"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface LoginEntry {
  id: number;
  ip: string | null;
  device: string | null;
  browser: string | null;
  country: string | null;
  status: string;
  createdAt: string;
}

interface LoginHistoryTabProps {
  playerId: number;
  accessToken: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  SUCCESS: "Correcto",
  FAILED: "Fallido",
  BLOCKED: "Bloqueado",
};

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "bg-success/20 text-success",
  FAILED: "bg-warning/20 text-warning",
  BLOCKED: "bg-destructive/20 text-destructive",
};

export default function LoginHistoryTab({ playerId, accessToken }: LoginHistoryTabProps) {
  const [logins, setLogins] = useState<LoginEntry[]>([]);
  const [loadingLogins, setLoadingLogins] = useState(true);

  useEffect(() => {
    fetchLogins();
  }, []);

  async function fetchLogins() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/players/${playerId}/login-history`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: "include",
        },
      );
      const data = await res.json();
      setLogins(data);
    } finally {
      setLoadingLogins(false);
    }
  }

  if (loadingLogins) {
    return <p className="text-muted-foreground text-sm">Cargando historial de accesos...</p>;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border/50 border-b">
              <th className="text-muted-foreground px-4 py-2.5 text-left font-medium">Fecha</th>
              <th className="text-muted-foreground px-4 py-2.5 text-left font-medium">IP</th>
              <th className="text-muted-foreground px-4 py-2.5 text-left font-medium">
                Dispositivo
              </th>
              <th className="text-muted-foreground px-4 py-2.5 text-left font-medium">Navegador</th>
              <th className="text-muted-foreground px-4 py-2.5 text-left font-medium">País</th>
              <th className="text-muted-foreground px-4 py-2.5 text-left font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {logins.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center">
                  No hay historial de accesos registrado
                </td>
              </tr>
            ) : (
              logins.map((entry) => (
                <tr key={entry.id} className="border-border/30 border-b">
                  <td className="text-muted-foreground px-4 py-2.5">
                    {new Date(entry.createdAt).toLocaleString("es-ES")}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">{entry.ip ?? "—"}</td>
                  <td className="text-muted-foreground px-4 py-2.5">{entry.device ?? "—"}</td>
                  <td className="text-muted-foreground px-4 py-2.5">{entry.browser ?? "—"}</td>
                  <td className="text-muted-foreground px-4 py-2.5">{entry.country ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${STATUS_COLORS[entry.status]}`}
                    >
                      {STATUS_LABELS[entry.status]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
