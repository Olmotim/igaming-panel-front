"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import { Select } from "@/components/Select";
import Link from "next/link";
import type { TicketSummary } from "@/types/ticket";
import type { Department } from "@/types/department";
import {
  TICKET_PRIORITY_COLORS as PRIORITY_COLORS,
  TICKET_STATUS_COLORS as STATUS_COLORS,
  TICKET_STATUS_LABELS as STATUS_LABELS,
  DEPARTMENTS,
} from "@/lib/constants";
import { apiFetch, ApiError } from "@/lib/api";

export default function TicketsPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    department: DEPARTMENTS[0],
    priority: "MEDIUM",
    playerId: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    fetchTickets();
  }, [user, loading]);

  async function fetchTickets() {
    setLoadingTickets(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterDepartment) params.append("department", filterDepartment);
      if (filterPriority) params.append("priority", filterPriority);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      });
      const data = await res.json();
      setTickets(data);
    } finally {
      setLoadingTickets(false);
    }
  }

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await apiFetch("/tickets", {
        method: "POST",
        accessToken,
        body: {
          ...form,
          playerId: form.playerId ? parseInt(form.playerId) : undefined,
        },
      });
      setForm({
        title: "",
        description: "",
        department: DEPARTMENTS[0],
        priority: "MEDIUM",
        playerId: "",
      });
      setShowForm(false);
      fetchTickets();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al crear el ticket");
    } finally {
      setCreating(false);
    }
  }

  if (loading || loadingTickets) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold">Tickets internos</h2>
            <p className="text-muted-foreground mt-1">Gestión de tickets entre departamentos</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar" : "+ Nuevo ticket"}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Crear ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createTicket} className="space-y-3">
                <Input
                  placeholder="Título del ticket"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Descripción detallada..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  rows={3}
                  className="bg-input border-border text-foreground w-full resize-none rounded-md border px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value as Department })}
                    className="w-full"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full"
                  >
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </Select>
                </div>
                <Input
                  placeholder="ID del jugador (opcional)"
                  value={form.playerId}
                  onChange={(e) => setForm({ ...form, playerId: e.target.value })}
                  type="number"
                />
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button type="submit" disabled={creating}>
                  {creating ? "Creando..." : "Crear ticket"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          {user?.role === "ADMIN" && (
            <Select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
              <option value="">Todos los departamentos</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          )}

          <Select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="">Todas las prioridades</option>
            <option value="LOW">Baja</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </Select>

          <Button variant="outline" size="sm" onClick={fetchTickets}>
            Filtrar
          </Button>
          {(filterStatus || filterDepartment || filterPriority) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterStatus("");
                setFilterDepartment("");
                setFilterPriority("");
              }}
            >
              Limpiar
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border/50 border-b">
                  <th className="text-muted-foreground px-6 py-2.5 text-left font-medium">ID</th>
                  <th className="text-muted-foreground px-6 py-2.5 text-left font-medium">
                    Título
                  </th>
                  <th className="text-muted-foreground px-6 py-2.5 text-left font-medium">Dpto.</th>
                  <th className="text-muted-foreground px-6 py-2.5 text-left font-medium">
                    Prioridad
                  </th>
                  <th className="text-muted-foreground px-6 py-2.5 text-left font-medium">
                    Estado
                  </th>
                  <th className="text-muted-foreground px-6 py-2.5 text-left font-medium">
                    Jugador
                  </th>
                  <th className="text-muted-foreground px-6 py-2.5 text-left font-medium">
                    Creado
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-muted-foreground px-6 py-8 text-center">
                      No hay tickets
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-border/30 hover:bg-muted/20 cursor-pointer border-b transition-colors"
                      onClick={() => router.push(`/tickets/${ticket.id}`)}
                    >
                      <td className="text-muted-foreground px-6 py-2.5 tabular-nums">
                        #{ticket.id}
                      </td>
                      <td className="px-6 py-2.5 font-medium">{ticket.title}</td>
                      <td className="text-muted-foreground px-6 py-2.5">{ticket.department}</td>
                      <td className="px-6 py-2.5">
                        <span
                          className={`rounded px-2 py-1 text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-2.5">
                        <span
                          className={`rounded px-2 py-1 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}
                        >
                          {STATUS_LABELS[ticket.status]}
                        </span>
                      </td>
                      <td className="text-muted-foreground px-6 py-2.5">
                        {ticket.player
                          ? `${ticket.player.firstName} ${ticket.player.lastName}`
                          : "—"}
                      </td>
                      <td className="text-muted-foreground px-6 py-2.5">
                        {new Date(ticket.createdAt).toLocaleDateString("es-ES")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
