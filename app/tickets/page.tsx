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

interface Ticket {
  id: number;
  title: string;
  priority: string;
  status: string;
  department: string;
  createdAt: string;
  resolvedAt: string | null;
  createdBy: { id: number; email: string };
  assignedTo: { id: number; email: string } | null;
  player: { id: number; name: string; email: string } | null;
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

const DEPARTMENTS = ["CS", "RISK", "COMPLIANCE", "PAYMENTS", "RG", "SPORTSBOOK", "AML", "SECOND_LINE", "DOCUMENTS"];

export default function TicketsPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    department: "CS",
    priority: "MEDIUM",
    playerId: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
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
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...form,
          playerId: form.playerId ? parseInt(form.playerId) : undefined,
        }),
      });
      if (res.ok) {
        setForm({ title: "", description: "", department: "CS", priority: "MEDIUM", playerId: "" });
        setShowForm(false);
        fetchTickets();
      }
    } finally {
      setCreating(false);
    }
  }

  if (loading || loadingTickets) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Tickets internos</h2>
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
                  className="w-full text-sm px-3 py-2 rounded-md bg-input border border-border text-foreground resize-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full"
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
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
                <Button type="submit" disabled={creating}>
                  {creating ? "Creando..." : "Crear ticket"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
  <Select
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
  >
    <option value="">Todos los estados</option>
    {Object.entries(STATUS_LABELS).map(([value, label]) => (
      <option key={value} value={value}>{label}</option>
    ))}
  </Select>

  {user?.role === "admin" && (
    <Select
      value={filterDepartment}
      onChange={(e) => setFilterDepartment(e.target.value)}
    >
      <option value="">Todos los departamentos</option>
      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
    </Select>
  )}

  <Select
    value={filterPriority}
    onChange={(e) => setFilterPriority(e.target.value)}
  >
    <option value="">Todas las prioridades</option>
    <option value="LOW">Baja</option>
    <option value="MEDIUM">Media</option>
    <option value="HIGH">Alta</option>
    <option value="URGENT">Urgente</option>
  </Select>

  <Button variant="outline" size="sm" onClick={fetchTickets}>Filtrar</Button>
  {(filterStatus || filterDepartment || filterPriority) && (
    <Button variant="ghost" size="sm" onClick={() => {
      setFilterStatus(""); setFilterDepartment(""); setFilterPriority("");
    }}>Limpiar</Button>
  )}
</div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium">ID</th>
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium">Título</th>
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium">Dpto.</th>
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium">Prioridad</th>
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium">Estado</th>
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium">Jugador</th>
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium">Creado</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      No hay tickets
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => router.push(`/tickets/${ticket.id}`)}>
                      <td className="px-6 py-3 text-muted-foreground">#{ticket.id}</td>
                      <td className="px-6 py-3 font-medium">{ticket.title}</td>
                      <td className="px-6 py-3 text-muted-foreground">{ticket.department}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
                          {STATUS_LABELS[ticket.status]}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {ticket.player ? ticket.player.name : "—"}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
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