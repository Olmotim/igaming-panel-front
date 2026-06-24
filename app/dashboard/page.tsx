"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import type { TicketSummary } from "@/types/ticket";
import {
  TICKET_PRIORITY_COLORS as PRIORITY_COLORS,
  TICKET_STATUS_COLORS as STATUS_COLORS,
  TICKET_STATUS_LABELS as STATUS_LABELS,
} from "@/lib/constants";

interface Metrics {
  kpis: {
    ticketsOpen: number;
    ticketsUrgent: number;
    ticketsResolvedToday: number;
    playersPendingKYC: number;
  };
  myTickets: TicketSummary[];
  recentTickets: TicketSummary[];
  ticketsByDepartment: { department: string; count: number }[];
}

export default function DashboardPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    fetchMetrics();
  }, [user, loading]);

  async function fetchMetrics() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/metrics`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      });
      const data = await res.json();
      setMetrics(data);
    } finally {
      setLoadingMetrics(false);
    }
  }

  if (loading || loadingMetrics) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div>
          <h2 className="font-heading text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Bienvenido de vuelta, {user?.email}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Tickets abiertos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-primary text-3xl font-bold">{metrics.kpis.ticketsOpen}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Tickets urgentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive text-3xl font-bold">{metrics.kpis.ticketsUrgent}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Resueltos hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-success text-3xl font-bold">{metrics.kpis.ticketsResolvedToday}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Jugadores pendientes KYC
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-primary text-3xl font-bold">{metrics.kpis.playersPendingKYC}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mis tickets asignados</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.myTickets.length === 0 ? (
                <p className="text-muted-foreground text-sm">No tienes tickets asignados.</p>
              ) : (
                <div className="space-y-3">
                  {metrics.myTickets.map((ticket) => (
                    <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                      <div className="border-border/30 hover:bg-muted/20 flex items-center justify-between rounded border-b px-2 py-2 transition-colors">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{ticket.title}</p>
                          <p className="text-muted-foreground text-xs">
                            {ticket.department} ·{" "}
                            {ticket.player
                              ? `${ticket.player.firstName} ${ticket.player.lastName}`
                              : "Sin jugador"}
                          </p>
                        </div>
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}
                        >
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
                <p className="text-muted-foreground text-sm">No hay tickets recientes.</p>
              ) : (
                <div className="space-y-3">
                  {metrics.recentTickets.map((ticket) => (
                    <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                      <div className="border-border/30 hover:bg-muted/20 flex items-center justify-between rounded border-b px-2 py-2 transition-colors">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{ticket.title}</p>
                          <p className="text-muted-foreground text-xs">
                            {ticket.createdBy.email} ·{" "}
                            {new Date(ticket.createdAt).toLocaleDateString("es-ES")}
                          </p>
                        </div>
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}
                        >
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
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {metrics.ticketsByDepartment.map((item) => (
                  <div
                    key={item.department}
                    className="bg-muted/20 border-border/30 flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm font-medium">{item.department}</span>
                    <span className="text-primary text-lg font-bold">{item.count}</span>
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
