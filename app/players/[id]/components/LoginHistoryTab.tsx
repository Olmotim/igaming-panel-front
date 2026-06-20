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
  SUCCESS: "bg-green-500/20 text-green-400",
  FAILED: "bg-orange-500/20 text-orange-400",
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/players/${playerId}/login-history`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
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
            <tr className="border-b border-border/50">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Fecha</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">IP</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Dispositivo</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Navegador</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">País</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {logins.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No hay historial de accesos registrado
                </td>
              </tr>
            ) : (
              logins.map((entry) => (
                <tr key={entry.id} className="border-b border-border/30">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString("es-ES")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{entry.ip ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.device ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.browser ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.country ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[entry.status]}`}>
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