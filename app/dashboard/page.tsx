"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface Ticket {
  id: number;
  title: string;
  priority: string;
  status: string;
  department: string;
  createdAt: string;
  createdBy: { id: number; email: string };
  player: { id: number; name: string } | null;
}

interface Metrics {
  kpis: {
    ticketsOpen: number;
    ticketsUrgent: number;
    ticketsResolvedToday: number;
    playersPendingKYC: number;
  };
  myTickets: Ticket[];
  recentTickets: Ticket[];
  ticketsByDepartment: { department: string; count: number }[];
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-blue-500/20 text-blue-400",
  HIGH: "bg-orange-500/20 text-orange-400",
  URGENT: "bg-destructive/20 text-destructive",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-500/20 text-blue-400",
  IN_PROGRESS: "bg-yellow-500/20 text-yellow-400",
  PENDING_INFO: "bg-orange-500/20 text-orange-400",
  RESOLVED: "bg-green-500/20 text-green-400",
  CLOSED: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En progreso",
  PENDING_INFO: "Esperando info",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

export default function DashboardPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    fetchMetrics();
  }, [user, loading]);

  async function fetchMetrics() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/metrics`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setMetrics(data);
    } finally {
      setLoadingMetrics(false);
    }
  }

  if (loading || loadingMetrics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Bienvenido de vuelta, {user?.email}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tickets abiertos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-400">{metrics.kpis.ticketsOpen}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tickets urgentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-destructive">{metrics.kpis.ticketsUrgent}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Resueltos hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400">{metrics.kpis.ticketsResolvedToday}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Jugadores pendientes KYC</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{metrics.kpis.playersPendingKYC}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mis tickets asignados</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.myTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tienes tickets asignados.</p>
              ) : (
                <div className="space-y-3">
                  {metrics.myTickets.map(ticket => (
                    <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                      <div className="flex items-center justify-between py-2 border-b border-border/30 hover:bg-muted/20 rounded px-2 transition-colors">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{ticket.title}</p>
                          <p className="text-xs text-muted-foreground">{ticket.department} · {ticket.player?.name ?? "Sin jugador"}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actividad reciente</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.recentTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay tickets recientes.</p>
              ) : (
                <div className="space-y-3">
                  {metrics.recentTickets.map(ticket => (
                    <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                      <div className="flex items-center justify-between py-2 border-b border-border/30 hover:bg-muted/20 rounded px-2 transition-colors">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{ticket.title}</p>
                          <p className="text-xs text-muted-foreground">{ticket.createdBy.email} · {new Date(ticket.createdAt).toLocaleDateString("es-ES")}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
                          {STATUS_LABELS[ticket.status]}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {metrics.ticketsByDepartment.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tickets abiertos por departamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metrics.ticketsByDepartment.map(item => (
                  <div key={item.department} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                    <span className="text-sm font-medium">{item.department}</span>
                    <span className="text-lg font-bold text-primary">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}